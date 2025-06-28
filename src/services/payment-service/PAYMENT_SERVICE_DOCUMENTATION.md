# Payment Service Implementation Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Logic](#business-logic)
6. [Configuration](#configuration)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)
9. [Performance Optimizations](#performance-optimizations)
10. [Security Features](#security-features)
11. [Kafka Integration](#kafka-integration)
12. [Development Features](#development-features)
13. [Deployment Guide](#deployment-guide)
14. [Monitoring & Observability](#monitoring--observability)

## Overview

The payment-service is a microservice designed to record and track payments from external systems within the CollectionCRM ecosystem. It focuses on payment ingestion rather than actual payment processing, serving as a high-performance data collection and deduplication service.

### Key Responsibilities
- Process payments from various channels (webhooks, staging table)
- Perform high-performance deduplication
- Maintain payment records with audit trails
- Publish payment events to Kafka for downstream processing
- Provide payment query APIs for other services

### Scale Requirements
- Handle ~6 million loans
- Support ~3 million customers
- Serve ~2000 concurrent collection agents
- Process high-volume payment batches efficiently

## Architecture

### Core Components

The service consists of several key architectural layers:

```
src/
├── app.ts                    # Main application setup
├── index.ts                  # Entry point
├── controllers/              # API request handlers
│   ├── WebhookController.ts
│   └── MonitoringController.ts
├── services/                 # Business logic layer
│   ├── PaymentService.ts
│   └── DeduplicationService.ts
├── processors/               # Data processing engines
│   ├── StagingProcessor.ts
│   └── WebhookProcessor.ts
├── models/                   # Database access layer
│   ├── Payment.ts
│   ├── PaymentStaging.ts
│   ├── PaymentReference.ts
│   └── StagingProcessLog.ts
├── jobs/                     # Background jobs
│   ├── JobManager.ts
│   ├── StagingIngestionJob.ts
│   ├── PartitionMaintenanceJob.ts
│   └── CacheCleanupJob.ts
├── kafka/                    # Event publishing
│   ├── producer.ts
│   └── events/
├── routes/                   # API routing
│   ├── webhook.routes.ts
│   └── monitoring.routes.ts
├── types/                    # TypeScript definitions
│   ├── payment.types.ts
│   └── webhook.types.ts
└── config/                   # Configuration
    └── database.ts
```

### Technology Stack

- **Runtime**: Node.js 18 LTS with TypeScript 5
- **Framework**: Express.js 4.x with comprehensive middleware
- **Database**: PostgreSQL 15+ with Knex.js query builder
- **Cache**: Redis 7 with multi-layer caching
- **Message Queue**: Apache Kafka for event publishing
- **Validation**: Zod schemas + express-validator
- **Logging**: Pino for structured logging
- **Monitoring**: Prometheus metrics collection
- **Job Scheduling**: node-cron for background tasks

## Database Schema

### Core Tables

#### 1. `payment_service.payments` (Partitioned Table)
```sql
CREATE TABLE payment_service.payments (
  id UUID DEFAULT gen_random_uuid(),
  reference_number VARCHAR(255) NOT NULL,
  loan_account_number VARCHAR(20) NOT NULL,
  cif VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_channel VARCHAR(100),
  source VARCHAR(50) NOT NULL, -- 'staging' or 'webhook'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, payment_date)
) PARTITION BY RANGE (payment_date);

-- Indexes
CREATE INDEX idx_payments_reference ON payment_service.payments (reference_number);
CREATE INDEX idx_payments_loan_account ON payment_service.payments (loan_account_number, payment_date DESC);
CREATE INDEX idx_payments_cif ON payment_service.payments (cif, payment_date DESC);
CREATE INDEX idx_payments_created_at ON payment_service.payments (created_at);
```

#### 2. `payment_service.payment_references` (Deduplication Cache)
```sql
CREATE TABLE payment_service.payment_references (
  reference_number VARCHAR(255) PRIMARY KEY,
  payment_id UUID NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_refs_created ON payment_service.payment_references (created_at);
```

#### 3. `payment_service.staging_process_log` (Audit Trail)
```sql
CREATE TABLE payment_service.staging_process_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_start_id BIGINT NOT NULL,
  batch_end_id BIGINT NOT NULL,
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_details JSONB
);
```

#### 4. `payment_service.payment_staging` (ETL-Managed)
```sql
-- Staging table structure (managed by ETL - reference only)
CREATE TABLE payment_staging (
  id BIGSERIAL PRIMARY KEY,
  reference_number VARCHAR(255) NOT NULL,
  loan_account_number VARCHAR(20) NOT NULL,
  cif VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_channel VARCHAR(100),
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Partitioning Strategy

Monthly partitions are created automatically:
```sql
-- Example partition creation
CREATE TABLE payment_service.payments_2024_01 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## API Endpoints

### Webhook Endpoints

#### Generic Webhook Processing
```http
POST /api/v1/payments/webhook
Content-Type: application/json
X-Signature: sha256=<hmac_signature>

{
  "reference_number": "PAY-2024-001",
  "loan_account_number": "LA123456789",
  "cif": "CIF123456",
  "amount": 1000.50,
  "payment_date": "2024-01-15T10:30:00Z",
  "payment_channel": "online_banking",
  "metadata": {
    "transaction_id": "TXN-001",
    "bank_code": "VCB"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "created",
    "payment_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Channel-Specific Webhook
```http
POST /api/v1/payments/webhook/:channel
```

#### Webhook Statistics
```http
GET /api/v1/payments/webhook/stats
```

#### Duplicate Check
```http
GET /api/v1/payments/webhook/duplicate/:reference_number
```

#### Payment Lookup
```http
GET /api/v1/payments/webhook/payment/:reference_number
```

### Monitoring Endpoints

#### Health Checks
```http
GET /health
GET /api/v1/monitoring/health
GET /api/v1/monitoring/ready
```

#### Metrics and Statistics
```http
GET /api/v1/monitoring/metrics        # Prometheus metrics
GET /api/v1/monitoring/stats          # Service statistics
GET /api/v1/monitoring/jobs/status    # Background job status
GET /api/v1/monitoring/partitions     # Partition information
```

#### Manual Operations
```http
POST /api/v1/monitoring/jobs/staging-ingestion/run
POST /api/v1/monitoring/jobs/partition-maintenance/run
POST /api/v1/monitoring/jobs/cache-cleanup/run
POST /api/v1/monitoring/cache/warm?limit=10000
POST /api/v1/monitoring/cache/clear
```

#### Payment Queries
```http
GET /api/v1/monitoring/payments/loan/:loan_account_number?limit=100&offset=0
GET /api/v1/monitoring/payments/summary/:loan_account_number
```

## Business Logic

### Payment Processing Flows

#### 1. Webhook Processing (`WebhookProcessor`)

Real-time payment ingestion with the following steps:

1. **Authentication Validation**
   - HMAC-SHA256 signature verification
   - IP whitelist checking (if configured)
   - Channel-specific authentication

2. **Rate Limiting**
   - Redis-based sliding window
   - Per-client/channel limits
   - Configurable thresholds

3. **Duplicate Detection**
   - Multi-layer cache lookup
   - Immediate response for duplicates
   - Existing payment ID return

4. **Payment Creation**
   - Database transaction
   - Metadata enrichment
   - Cache update

5. **Event Publishing**
   - Kafka event generation
   - Reliable delivery guarantees

#### 2. Staging Processing (`StagingProcessor`)

Batch processing from staging table:

1. **Batch Retrieval**
   - Configurable batch sizes
   - Sequential ID tracking
   - Unprocessed record filtering

2. **Bulk Duplicate Check**
   - Efficient reference validation
   - Memory/Redis/DB layer checking
   - Duplicate filtering

3. **Bulk Insert**
   - Transaction-based consistency
   - Batch database operations
   - Reference cache updates

4. **Status Tracking**
   - Process log creation
   - Progress monitoring
   - Error handling

### Deduplication Strategy

Three-layer caching system (`DeduplicationService`):

#### Layer 1: Memory Cache (LRU)
- **Size**: 10,000 items (configurable)
- **TTL**: 1 hour
- **Purpose**: Ultra-fast recent lookups

#### Layer 2: Redis Cache
- **TTL**: 24 hours (configurable)
- **Purpose**: Distributed caching
- **Features**: Bulk operations, automatic expiration

#### Layer 3: Database
- **Retention**: 90 days (configurable)
- **Purpose**: Persistent storage
- **Cleanup**: Automated background job

#### Performance Optimizations
- Bulk duplicate checking for batch operations
- Cache warming on startup and demand
- Hit rate monitoring and alerting
- Automatic cache eviction policies

### Background Jobs

#### 1. Staging Ingestion Job (`StagingIngestionJob`)
```javascript
// Default configuration
{
  schedule: '*/30 * * * * *',  // Every 30 seconds
  enabled: true,
  maxConsecutiveFailures: 5,
  batchProcessingTimeout: 300000  // 5 minutes
}
```

**Features:**
- Automatic failure detection and backoff
- Immediate re-execution when records found
- Timeout protection for long-running batches
- Graceful degradation on consecutive failures

#### 2. Partition Maintenance Job (`PartitionMaintenanceJob`)
```javascript
// Default configuration
{
  schedule: '0 2 * * *',  // Daily at 2 AM
  enabled: true,
  retentionMonths: 12,
  futureMonths: 3
}
```

**Features:**
- Automatic partition creation (3 months ahead)
- Old partition cleanup (12-month retention)
- Partition size monitoring
- Maintenance scheduling

#### 3. Cache Cleanup Job (`CacheCleanupJob`)
```javascript
// Default configuration
{
  schedule: '0 3 * * *',  // Daily at 3 AM
  enabled: true,
  referenceCacheRetentionDays: 90,
  processLogRetentionDays: 30,
  enableCacheWarming: true,
  cacheWarmingLimit: 10000
}
```

**Features:**
- Reference cache cleanup
- Process log maintenance
- Cache warming after cleanup
- Configurable retention periods

## Configuration

### Environment Variables

```env
# Server Configuration
PORT=3004
NODE_ENV=development
HOST=0.0.0.0
LOG_LEVEL=info

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=collectioncrm
DB_USERNAME=postgres
DB_PASSWORD=admin_password
DB_SCHEMA=payment_service
DB_POOL_MIN=10
DB_POOL_MAX=50
DB_ACQUIRE_TIMEOUT=60000
DB_IDLE_TIMEOUT=30000
DB_SSL=false
DB_DEBUG=false

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_TTL_SECONDS=86400

# Kafka Configuration
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=payment.events
KAFKA_CLIENT_ID=payment-service
KAFKA_BATCH_SIZE=100
KAFKA_COMPRESSION=gzip
KAFKA_RETRIES=5
KAFKA_ACKS=-1
KAFKA_TIMEOUT=30000

# Processing Configuration
STAGING_BATCH_SIZE=1000
STAGING_MAX_RETRIES=3
STAGING_RETRY_DELAY=5000
STAGING_PARALLEL=false
STAGING_WORKERS=2
STAGING_SCHEDULE=*/30 * * * * *
STAGING_JOB_ENABLED=true
STAGING_MAX_FAILURES=5
STAGING_TIMEOUT=300000

# Webhook Configuration
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_RATE_LIMIT_ENABLED=true
WEBHOOK_RATE_LIMIT_MAX=1000
WEBHOOK_RATE_LIMIT_WINDOW=60000
WEBHOOK_AUTH_ENABLED=true
WEBHOOK_AUTH_SECRET=your-webhook-secret
WEBHOOK_AUTH_HEADER=x-signature
WEBHOOK_IP_WHITELIST=192.168.1.0/24,10.0.0.0/8

# Cache Configuration
MEMORY_CACHE_MAX_SIZE=10000
ENABLE_MEMORY_CACHE=true
ENABLE_REDIS_CACHE=true
REFERENCE_CACHE_TTL_DAYS=90
PROCESS_LOG_TTL_DAYS=30
ENABLE_CACHE_WARMING=true
CACHE_WARMING_LIMIT=10000

# Partition Configuration
PARTITION_RETENTION_MONTHS=12
PARTITION_FUTURE_MONTHS=3
PARTITION_SCHEDULE=0 2 * * *
PARTITION_JOB_ENABLED=true

# Cache Cleanup Configuration
CACHE_CLEANUP_SCHEDULE=0 3 * * *
CACHE_CLEANUP_ENABLED=true

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
CORS_ORIGIN=*
```

### Service Configuration Interface

```typescript
interface PaymentServiceConfig {
  staging: {
    batchSize: number;
    maxRetries: number;
    retryDelayMs: number;
    enableParallelProcessing: boolean;
    workerCount: number;
  };
  webhook: {
    timeout_ms: number;
    rate_limit: {
      enabled: boolean;
      max_requests: number;
      window_ms: number;
    };
    auth: {
      enabled: boolean;
      secret?: string;
      header_name?: string;
      ip_whitelist?: string[];
    };
    channels: Record<string, ChannelConfig>;
  };
  deduplication: {
    memoryCache: {
      maxSize: number;
    };
    redis: {
      ttlSeconds: number;
    };
  };
}
```

## Data Models

### Payment Model
```typescript
interface Payment {
  id: string;                    // UUID
  reference_number: string;      // Unique payment reference
  loan_account_number: string;   // Loan account identifier
  cif: string;                   // Customer identifier
  amount: number;                // Payment amount
  payment_date: Date;            // When payment was made
  payment_channel?: string;      // Payment method/channel
  source: 'staging' | 'webhook'; // Payment source
  metadata?: Record<string, any>; // Additional data
  created_at: Date;              // Record creation time
}
```

### Webhook Validation Schema
```typescript
const WebhookPaymentSchema = z.object({
  reference_number: z.string().min(1).max(255),
  loan_account_number: z.string().min(1).max(20),
  cif: z.string().min(1).max(20),
  amount: z.number().positive(),
  payment_date: z.string().datetime().or(z.date()),
  payment_channel: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});
```

### Staging Process Log
```typescript
interface StagingProcessLog {
  id: string;
  batch_start_id: bigint;
  batch_end_id: bigint;
  total_records: number;
  processed_records: number;
  duplicate_records: number;
  error_records: number;
  status: 'processing' | 'completed' | 'failed';
  started_at: Date;
  completed_at?: Date;
  error_details?: Record<string, any>;
}
```

### Payment Reference
```typescript
interface PaymentReference {
  reference_number: string;  // Primary key
  payment_id: string;        // Referenced payment UUID
  payment_date: Date;        // Payment date for cleanup
  created_at: Date;          // Cache entry creation
}
```

## Error Handling

### Comprehensive Error Management

#### 1. Request Validation Errors
```javascript
// Express validator + Zod validation
app.use((err, req, res, next) => {
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors
    });
  }
  next(err);
});
```

#### 2. Database Error Handling
```typescript
try {
  await this.knex.transaction(async (trx) => {
    // Database operations
  });
} catch (error) {
  this.logger.error({ error }, 'Database operation failed');
  throw new Error('Payment processing failed');
}
```

#### 3. Cache Failure Graceful Degradation
```typescript
try {
  return await this.redisClient.get(key);
} catch (error) {
  this.logger.warn({ error }, 'Redis cache failed, falling back to database');
  return await this.database.query();
}
```

#### 4. Webhook Authentication Errors
```typescript
if (!this.validateSignature(payload, signature)) {
  return {
    success: false,
    error: 'Authentication failed',
    processing_time_ms: Date.now() - startTime
  };
}
```

### Health Check Implementation
```typescript
async getHealthCheck(): Promise<HealthCheckResult> {
  const checks = {
    database: 'error' as const,
    kafka: 'error' as const,
    redis: 'error' as const,
    staging_backlog: 0,
    last_staging_run: undefined as string | undefined,
  };

  // Database check
  try {
    await this.knex.raw('SELECT 1');
    checks.database = 'ok';
  } catch (error) {
    this.logger.error({ error }, 'Database health check failed');
  }

  // Redis check
  try {
    await this.redisClient.ping();
    checks.redis = 'ok';
  } catch (error) {
    this.logger.error({ error }, 'Redis health check failed');
  }

  // Additional checks...
  
  return {
    status: checks.database === 'ok' && checks.redis === 'ok' ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
}
```

## Performance Optimizations

### Database Performance

#### 1. Table Partitioning
- Monthly partitions for payments table
- Automatic partition creation and cleanup
- Query performance optimization

#### 2. Indexing Strategy
```sql
-- Primary indexes for common queries
CREATE INDEX idx_payments_reference ON payments (reference_number);
CREATE INDEX idx_payments_loan_account ON payments (loan_account_number, payment_date DESC);
CREATE INDEX idx_payments_cif ON payments (cif, payment_date DESC);
```

#### 3. Connection Pooling
```typescript
const dbConfig = {
  pool: {
    min: 10,
    max: 50,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
  }
};
```

#### 4. Bulk Operations
```typescript
// Bulk insert for staging processing
await this.knex(tableName).insert(paymentData);

// Bulk duplicate checking
const duplicates = await this.paymentRefModel.bulkExists(referenceNumbers);
```

### Caching Performance

#### Multi-Layer Cache Strategy
```typescript
async isDuplicate(reference: string): Promise<boolean> {
  // Layer 1: Memory cache (fastest)
  if (this.memoryCache.has(reference)) {
    this.stats.memory_hits++;
    return true;
  }

  // Layer 2: Redis cache (fast)
  const redisResult = await this.redisClient.get(`payment_ref:${reference}`);
  if (redisResult) {
    this.stats.redis_hits++;
    this.memoryCache.set(reference, true);
    return true;
  }

  // Layer 3: Database (authoritative)
  const exists = await this.paymentRefModel.exists(reference);
  if (exists) {
    await this.cacheReference(reference);
  }
  return exists;
}
```

#### Cache Warming
```typescript
async warmCache(limit: number = 10000): Promise<void> {
  const recentReferences = await this.paymentRefModel.getRecentReferences(limit);
  
  const cachePromises = recentReferences.map(ref => this.cacheReference(ref));
  await Promise.all(cachePromises);
}
```

### Processing Performance

#### 1. Batch Processing Optimization
```typescript
// Configurable batch sizes
const batch = await this.stagingModel.getUnprocessedBatch(this.config.batchSize);

// Bulk duplicate checking
const duplicates = await this.deduplicationService.bulkCheckDuplicates(
  batch.map(r => r.reference_number)
);

// Bulk database operations
await this.knex.transaction(async (trx) => {
  await trx(tableName).insert(uniquePayments);
});
```

#### 2. Parallel Processing Support
```typescript
// Configurable parallel workers
if (this.config.enableParallelProcessing) {
  const workers = Array(this.config.workerCount).fill(0)
    .map(() => this.processWorker());
  await Promise.all(workers);
}
```

### Monitoring & Metrics

#### Prometheus Metrics Collection
```typescript
import { collectDefaultMetrics, register } from 'prom-client';

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// Custom metrics
const processingTimeHistogram = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Payment processing duration',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});
```

## Security Features

### Authentication & Authorization

#### 1. Webhook Signature Validation
```typescript
private async validateAuth(
  paymentData: WebhookPaymentData,
  signature?: string,
  authConfig?: WebhookAuthConfig
): Promise<boolean> {
  if (!authConfig?.enabled || !signature || !authConfig.secret) {
    return !authConfig?.enabled;
  }

  const payload = JSON.stringify(paymentData);
  const expectedSignature = crypto
    .createHmac('sha256', authConfig.secret)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison
  const providedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}
```

#### 2. Rate Limiting
```typescript
private async checkRateLimit(
  clientKey: string,
  channel?: string,
  rateLimitConfig?: RateLimitConfig
): Promise<RateLimitInfo> {
  const key = `rate_limit:webhook:${channel || 'default'}:${clientKey}`;
  const windowStart = Math.floor(Date.now() / rateLimitConfig.window_ms) * rateLimitConfig.window_ms;
  const windowKey = `${key}:${windowStart}`;

  const current = await this.redisClient.get(windowKey);
  const currentCount = current ? parseInt(current) : 0;

  if (currentCount >= rateLimitConfig.max_requests) {
    return { allowed: false, remaining: 0, reset_time: windowStart + rateLimitConfig.window_ms };
  }

  // Increment counter with expiration
  await this.redisClient.multi()
    .incr(windowKey)
    .expire(windowKey, Math.ceil(rateLimitConfig.window_ms / 1000))
    .exec();

  return {
    allowed: true,
    remaining: rateLimitConfig.max_requests - currentCount - 1,
    reset_time: windowStart + rateLimitConfig.window_ms
  };
}
```

### Data Protection

#### 1. Input Validation
```typescript
// Express validator middleware
app.use([
  body('reference_number').isString().isLength({ min: 1, max: 255 }),
  body('loan_account_number').isString().isLength({ min: 1, max: 20 }),
  body('amount').isNumeric().isFloat({ min: 0.01 }),
  // ... additional validations
]);

// Zod runtime validation
const parseResult = WebhookPaymentSchema.safeParse(req.body);
if (!parseResult.success) {
  return res.status(400).json({
    success: false,
    error: 'Invalid payment data',
    details: parseResult.error.errors
  });
}
```

#### 2. Request Tracking
```typescript
// Request ID middleware for audit trails
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random()}`;
  res.setHeader('x-request-id', req.headers['x-request-id']);
  next();
});
```

#### 3. Secure Configuration
```typescript
// Environment-based configuration
const config = {
  webhook: {
    auth: {
      enabled: process.env.WEBHOOK_AUTH_ENABLED === 'true',
      secret: process.env.WEBHOOK_AUTH_SECRET,
      header_name: process.env.WEBHOOK_AUTH_HEADER || 'x-signature',
      ip_whitelist: process.env.WEBHOOK_IP_WHITELIST?.split(','),
    }
  }
};
```

## Kafka Integration

### Event Publishing

#### Payment Recorded Event
```typescript
interface PaymentRecordedEvent {
  event_id: string;
  event_type: 'payment.recorded';
  timestamp: string;
  payment: {
    id: string;
    reference_number: string;
    loan_account_number: string;
    cif: string;
    amount: number;
    payment_date: string;
    payment_channel: string;
    source: 'staging' | 'webhook';
    metadata: Record<string, any>;
  };
}
```

#### Producer Configuration
```typescript
export class PaymentEventProducer {
  private producer: Producer;
  private config: KafkaConfig;

  constructor(config: KafkaConfig, logger: pino.Logger) {
    this.kafka = kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: {
        retries: config.retries,
        maxRetryTime: config.timeout,
      }
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
      maxInFlightRequests: 1,
      idempotent: true,
      compression: config.compression,
    });
  }

  async publishPaymentRecorded(payment: Payment): Promise<void> {
    const event: PaymentRecordedEvent = {
      event_id: uuidv4(),
      event_type: 'payment.recorded',
      timestamp: new Date().toISOString(),
      payment: {
        id: payment.id,
        reference_number: payment.reference_number,
        loan_account_number: payment.loan_account_number,
        cif: payment.cif,
        amount: payment.amount,
        payment_date: payment.payment_date.toISOString(),
        payment_channel: payment.payment_channel || '',
        source: payment.source,
        metadata: payment.metadata || {},
      }
    };

    await this.producer.send({
      topic: this.config.topic,
      messages: [{
        key: payment.reference_number,
        value: JSON.stringify(event),
        headers: {
          'event-type': 'payment.recorded',
          'source-service': 'payment-service',
        }
      }]
    });
  }
}
```

### Reliable Delivery

#### 1. Producer Configuration
```typescript
const producerConfig = {
  allowAutoTopicCreation: false,
  transactionTimeout: 30000,
  maxInFlightRequests: 1,
  idempotent: true,
  compression: 'gzip',
  acks: -1,  // Wait for all replicas
  retries: 5,
  retry: {
    maxRetryTime: 30000,
    retries: 5,
  }
};
```

#### 2. Error Handling
```typescript
try {
  await this.producer.send({
    topic: this.config.topic,
    messages: [message]
  });
  this.logger.info({ payment_id: payment.id }, 'Payment event published');
} catch (error) {
  this.logger.error({ error, payment_id: payment.id }, 'Failed to publish payment event');
  // Consider dead letter queue or retry logic
  throw error;
}
```

## Development Features

### Code Quality

#### 1. TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 2. Input Validation
```typescript
// Runtime validation with Zod
export const WebhookPaymentSchema = z.object({
  reference_number: z.string().min(1).max(255),
  loan_account_number: z.string().min(1).max(20),
  cif: z.string().min(1).max(20),
  amount: z.number().positive(),
  payment_date: z.string().datetime().or(z.date()),
  payment_channel: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

// Express validator for additional checks
const webhookValidation = [
  body('reference_number').isString().isLength({ min: 1, max: 255 }),
  body('amount').isNumeric().isFloat({ min: 0.01 }),
  // ...
];
```

#### 3. Structured Logging
```typescript
// Pino logger with structured output
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: true,
  formatters: {
    time: () => `,"timestamp":"${new Date().toISOString()}"`,
  }
});

// Context-aware logging
this.logger.info({
  request_id: requestId,
  payment_id: payment.id,
  reference_number: payment.reference_number,
  processing_time_ms: Date.now() - startTime
}, 'Payment processed successfully');
```

### Testing Infrastructure

#### 1. Unit Tests Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── PaymentService.test.ts
│   │   └── DeduplicationService.test.ts
│   ├── processors/
│   │   ├── StagingProcessor.test.ts
│   │   └── WebhookProcessor.test.ts
│   └── models/
│       └── Payment.test.ts
├── integration/
│   ├── webhook.test.ts
│   ├── staging.test.ts
│   └── monitoring.test.ts
└── performance/
    ├── bulk-processing.test.ts
    └── cache-performance.test.ts
```

#### 2. Test Configuration
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/types/**"
    ]
  }
}
```

## Deployment Guide

### Docker Configuration

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY src/migrations/ ./src/migrations/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S payment-service -u 1001
USER payment-service

EXPOSE 3004

CMD ["node", "dist/app.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  payment-service:
    build: .
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production
      - PORT=3004
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - postgres
      - redis
      - kafka
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3004/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: collectioncrm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: admin_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

#### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  labels:
    app: payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
      - name: payment-service
        image: collectioncrm/payment-service:latest
        ports:
        - containerPort: 3004
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "postgres-service"
        - name: REDIS_HOST
          value: "redis-service"
        - name: KAFKA_BROKERS
          value: "kafka:9092"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3004
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/monitoring/ready
            port: 3004
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: payment-service
spec:
  selector:
    app: payment-service
  ports:
  - port: 3004
    targetPort: 3004
  type: ClusterIP
```

### Environment-Specific Configuration

#### Production Environment
```env
NODE_ENV=production
LOG_LEVEL=warn

# Database - Production settings
DB_POOL_MIN=20
DB_POOL_MAX=100
DB_SSL=true

# Redis - Production settings
REDIS_TTL_SECONDS=86400

# Processing - Production tuning
STAGING_BATCH_SIZE=2000
MEMORY_CACHE_MAX_SIZE=50000

# Security - Production hardening
WEBHOOK_AUTH_ENABLED=true
WEBHOOK_RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://app.collectioncrm.com

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

#### Staging Environment
```env
NODE_ENV=staging
LOG_LEVEL=info

# Smaller resource allocation
DB_POOL_MIN=5
DB_POOL_MAX=20
STAGING_BATCH_SIZE=500
MEMORY_CACHE_MAX_SIZE=5000

# More frequent monitoring
STAGING_SCHEDULE=*/10 * * * * *
```

## Monitoring & Observability

### Health Checks

#### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3004
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/v1/monitoring/ready
    port: 3004
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

#### Health Check Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "checks": {
      "database": "ok",
      "redis": "ok",
      "kafka": "ok",
      "staging_backlog": 1250,
      "last_staging_run": "2024-01-15T10:30:00.000Z"
    },
    "timestamp": "2024-01-15T10:35:00.000Z"
  }
}
```

### Prometheus Metrics

#### Key Metrics Collected
```typescript
// Default Node.js metrics
collectDefaultMetrics({ register });

// Custom application metrics
const paymentProcessingDuration = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Payment processing duration',
  labelNames: ['source', 'channel'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const paymentProcessingTotal = new Counter({
  name: 'payment_processing_total',
  help: 'Total number of payments processed',
  labelNames: ['source', 'status']
});

const duplicateDetectionHitRate = new Gauge({
  name: 'duplicate_detection_hit_rate',
  help: 'Cache hit rate for duplicate detection',
  labelNames: ['cache_layer']
});

const stagingBacklogSize = new Gauge({
  name: 'staging_backlog_size',
  help: 'Number of unprocessed staging records'
});
```

#### Metrics Endpoint
```http
GET /api/v1/monitoring/metrics

# HELP payment_processing_duration_seconds Payment processing duration
# TYPE payment_processing_duration_seconds histogram
payment_processing_duration_seconds_bucket{source="webhook",channel="online",le="0.01"} 100
payment_processing_duration_seconds_bucket{source="webhook",channel="online",le="0.05"} 500
payment_processing_duration_seconds_bucket{source="webhook",channel="online",le="0.1"} 950
payment_processing_duration_seconds_bucket{source="webhook",channel="online",le="+Inf"} 1000

# HELP payment_processing_total Total number of payments processed
# TYPE payment_processing_total counter
payment_processing_total{source="webhook",status="success"} 8500
payment_processing_total{source="webhook",status="duplicate"} 1200
payment_processing_total{source="staging",status="success"} 45000
```

### Logging Strategy

#### Structured Logging Examples
```typescript
// Successful payment processing
this.logger.info({
  event: 'payment_processed',
  request_id: requestId,
  payment_id: payment.id,
  reference_number: payment.reference_number,
  amount: payment.amount,
  source: payment.source,
  processing_time_ms: Date.now() - startTime,
  duplicate: false
}, 'Payment processed successfully');

// Error logging
this.logger.error({
  event: 'payment_processing_failed',
  request_id: requestId,
  reference_number: paymentData.reference_number,
  error: error.message,
  stack: error.stack,
  processing_time_ms: Date.now() - startTime,
  client_ip: clientIp
}, 'Payment processing failed');

// Performance monitoring
this.logger.warn({
  event: 'slow_query',
  query_type: 'duplicate_check',
  duration_ms: queryTime,
  threshold_ms: 1000,
  reference_count: referenceNumbers.length
}, 'Slow duplicate check detected');
```

### Alerting Rules

#### Prometheus Alerting Rules
```yaml
groups:
- name: payment-service
  rules:
  - alert: PaymentServiceDown
    expr: up{job="payment-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Payment service is down"

  - alert: HighStagingBacklog
    expr: staging_backlog_size > 10000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High staging backlog detected"
      description: "Staging backlog has {{ $value }} unprocessed records"

  - alert: LowCacheHitRate
    expr: duplicate_detection_hit_rate{cache_layer="memory"} < 0.8
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Low cache hit rate"
      description: "Memory cache hit rate is {{ $value | humanizePercentage }}"

  - alert: HighErrorRate
    expr: rate(payment_processing_total{status="error"}[5m]) / rate(payment_processing_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High payment processing error rate"
      description: "Error rate is {{ $value | humanizePercentage }}"
```

### Dashboard Configuration

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Payment Service Monitoring",
    "panels": [
      {
        "title": "Payment Processing Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(payment_processing_total[5m])",
            "legendFormat": "{{source}} - {{status}}"
          }
        ]
      },
      {
        "title": "Processing Duration",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, payment_processing_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, payment_processing_duration_seconds_bucket)",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Cache Hit Rates",
        "type": "graph",
        "targets": [
          {
            "expr": "duplicate_detection_hit_rate",
            "legendFormat": "{{cache_layer}}"
          }
        ]
      },
      {
        "title": "Staging Backlog",
        "type": "singlestat",
        "targets": [
          {
            "expr": "staging_backlog_size"
          }
        ]
      }
    ]
  }
}
```

## Summary

The payment-service is a production-ready, high-performance microservice designed for scalable payment data ingestion within the CollectionCRM ecosystem. Its key strengths include:

### Architecture Excellence
- Clean separation of concerns with distinct layers
- Comprehensive error handling and monitoring
- Multi-layer caching for optimal performance
- Event-driven architecture with Kafka integration

### Scalability Features
- Database partitioning for handling millions of payments
- Bulk processing capabilities for high-throughput scenarios
- Configurable batch sizes and processing intervals
- Efficient deduplication across multiple storage layers

### Production Readiness
- Comprehensive health checks and monitoring
- Graceful shutdown handling
- Background job management with failure recovery
- Prometheus metrics for observability

### Security & Reliability
- HMAC signature validation for webhooks
- Rate limiting and IP whitelisting
- Transaction-based consistency guarantees
- Audit logging for compliance

The service successfully addresses the requirements for handling ~6 million loans and ~3 million customers with ~2000 concurrent collection agents through its robust architecture and performance optimizations.