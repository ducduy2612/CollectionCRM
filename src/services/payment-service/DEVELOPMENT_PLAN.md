# Payment Service Development Plan

## Overview
The payment service is designed to record and track payments from external systems, not to process actual transactions. It ingests payment data through two methods: bulk import from a staging table and webhooks. The service performs deduplication, records payments, and publishes events for the workflow service to consume.

## Architecture Overview

### Core Responsibilities
1. Ingest payment data from staging table (ETL populates this)
2. Receive payment notifications via webhooks
3. Perform deduplication based on reference numbers
4. Record valid payments with high performance
5. Publish Kafka events for downstream processing
6. Maintain data integrity and performance at scale

## Database Design

### 1. Staging Table (Managed by ETL - Out of Scope)
```sql
-- Staging table structure for reference
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

### 2. Payment Service Schema

#### Main Payment Table (Partitioned)
```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS payment_service;

-- Create partitioned payment table
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

-- Create indexes for performance
CREATE INDEX idx_payments_reference ON payment_service.payments (reference_number);
CREATE INDEX idx_payments_loan_account ON payment_service.payments (loan_account_number, payment_date DESC);
CREATE INDEX idx_payments_cif ON payment_service.payments (cif, payment_date DESC);
CREATE INDEX idx_payments_created_at ON payment_service.payments (created_at);

-- Create monthly partitions (example for 2024)
CREATE TABLE payment_service.payments_2024_01 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE payment_service.payments_2024_02 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Continue for all months...
```

#### Deduplication Cache Table
```sql
-- High-performance deduplication table
CREATE TABLE payment_service.payment_references (
  reference_number VARCHAR(255) PRIMARY KEY,
  payment_id UUID NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for cleanup operations
CREATE INDEX idx_payment_refs_created ON payment_service.payment_references (created_at);
```

#### Processing Status Table
```sql
-- Track staging batch processing
CREATE TABLE payment_service.staging_process_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_start_id BIGINT NOT NULL,
  batch_end_id BIGINT NOT NULL,
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_details JSONB
);
```

## Implementation Structure

```
src/services/payment-service/src/
├── processors/
│   ├── StagingProcessor.ts         # Batch process staging table
│   ├── WebhookProcessor.ts         # Process webhook payments
│   └── DeduplicationService.ts     # Fast dedup checking
├── models/
│   ├── Payment.ts                  # Payment model
│   ├── PaymentReference.ts         # Reference cache model
│   └── StagingProcessLog.ts        # Process log model
├── services/
│   ├── PaymentService.ts           # Core payment logic
│   ├── PartitionManager.ts         # Manage table partitions
│   └── CacheManager.ts             # Reference cache management
├── jobs/
│   ├── StagingIngestionJob.ts      # Scheduled staging processor
│   ├── PartitionMaintenanceJob.ts  # Partition management
│   └── CacheCleanupJob.ts          # Reference cache cleanup
├── controllers/
│   ├── WebhookController.ts        # Webhook endpoints
│   └── MonitoringController.ts     # Health & metrics
├── routes/
│   ├── webhook.routes.ts           # Webhook routes
│   └── monitoring.routes.ts        # Monitoring routes
├── kafka/
│   ├── producer.ts                 # Kafka producer
│   └── events/
│       └── PaymentRecordedEvent.ts # Event definitions
├── utils/
│   ├── batchProcessor.ts           # Batch processing utilities
│   ├── performanceMonitor.ts       # Performance monitoring
│   └── validator.ts                # Data validation
└── types/
    ├── payment.types.ts            # Payment types
    └── webhook.types.ts            # Webhook types
```

## Core Components

### 1. Staging Processor

The staging processor runs as a scheduled job to process payments from the staging table in batches.

#### Key Features:
- Batch processing (configurable batch size, default 1000)
- Bulk duplicate checking
- Efficient bulk inserts
- Automatic retry on failures
- Progress tracking and logging

#### Processing Flow:
1. Query unprocessed records from staging table
2. Extract reference numbers for bulk duplicate check
3. Filter out existing payments
4. Bulk insert new payments
5. Update reference cache
6. Publish Kafka events
7. Mark staging records as processed

### 2. Webhook Processor

Handles real-time payment notifications from external systems.

#### Key Features:
- Synchronous processing with immediate response
- Authentication/signature validation
- Single payment deduplication
- Error response handling
- Rate limiting support

#### Processing Flow:
1. Validate webhook authentication
2. Parse and validate payload
3. Check for duplicate reference
4. Insert payment record
5. Update reference cache
6. Publish Kafka event
7. Return success/duplicate response

### 3. Deduplication Service

High-performance deduplication using multiple layers:

#### Layers:
1. **In-memory LRU Cache**: Ultra-fast for recent references
2. **Redis Cache**: Distributed cache with 24-hour TTL
3. **Database Table**: Persistent storage for 90 days

#### Features:
- Bulk checking support for staging processor
- Automatic cache warming
- Configurable retention periods
- Performance metrics tracking

## API Endpoints

### Webhook Endpoints
```
POST /api/v1/payments/webhook
  Description: Generic webhook endpoint
  Body: {
    reference_number: string,
    loan_account_number: string,
    cif: string,
    amount: number,
    payment_date: string,
    payment_channel?: string,
    metadata?: object
  }
  Response: {
    status: 'created' | 'duplicate',
    payment_id: string
  }

POST /api/v1/payments/webhook/:channel
  Description: Channel-specific webhook endpoint
  Parameters: channel - payment channel identifier
  Body: Channel-specific format
```

### Monitoring Endpoints
```
GET /health
  Description: Service health check
  Response: {
    status: 'healthy' | 'unhealthy',
    checks: {
      database: 'ok' | 'error',
      kafka: 'ok' | 'error',
      redis: 'ok' | 'error',
      staging_backlog: number,
      last_staging_run: string
    }
  }

GET /metrics
  Description: Prometheus metrics endpoint

GET /api/v1/payments/stats
  Description: Processing statistics
  Response: {
    staging: {
      processed_today: number,
      pending_count: number,
      average_batch_time_ms: number
    },
    webhooks: {
      received_today: number,
      duplicate_rate: number,
      average_response_time_ms: number
    }
  }
```

## Kafka Events

### PaymentRecordedEvent
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

Topic: `payment.events`

## Performance Optimization Strategies

### 1. Database Optimization
- **Table Partitioning**: Monthly partitions for payments table
- **Optimized Indexes**: Cover common query patterns
- **Connection Pooling**: Min 10, Max 50 connections
- **Read Replicas**: For query distribution (future)

### 2. Batch Processing
- **Configurable Batch Size**: Default 1000 records
- **Bulk Operations**: Single query for duplicate checks
- **Transaction Management**: Batch inserts in single transaction
- **Parallel Processing**: Multiple workers for large backlogs

### 3. Caching Strategy
- **Multi-layer Cache**: Memory → Redis → Database
- **Smart Eviction**: LRU for memory, TTL for Redis
- **Cache Warming**: Pre-load frequent references
- **Hit Rate Monitoring**: Track cache effectiveness

### 4. Monitoring & Alerting

#### Key Metrics:
- Staging processing rate (records/second)
- Webhook processing latency (p50, p95, p99)
- Duplicate detection rate
- Kafka publishing success rate
- Database connection pool usage
- Cache hit rates

#### Alerts:
- Staging backlog > 10,000 records
- Webhook response time > 500ms (p95)
- Kafka publishing failures > 1%
- Database connection pool exhaustion
- Partition space usage > 80%

## Configuration

### Environment Variables
```env
# Server
PORT=3004
NODE_ENV=development

# Database
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=collectioncrm
DB_USERNAME=postgres
DB_PASSWORD=admin_password
DB_POOL_MIN=10
DB_POOL_MAX=50

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_TTL_SECONDS=86400

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=payment.events
KAFKA_CLIENT_ID=payment-service
KAFKA_BATCH_SIZE=100

# Processing
STAGING_BATCH_SIZE=1000
STAGING_INTERVAL_SECONDS=30
STAGING_MAX_RETRIES=3
WEBHOOK_TIMEOUT_MS=5000

# Performance
ENABLE_MEMORY_CACHE=true
MEMORY_CACHE_MAX_SIZE=10000
ENABLE_REDIS_CACHE=true
REFERENCE_CACHE_TTL_DAYS=90
PARTITION_RETENTION_MONTHS=12

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Deployment Considerations

### 1. Container Resources
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### 2. Scaling Strategy
- Horizontal scaling for webhook processors
- Single instance for staging processor (or leader election)
- Auto-scaling based on CPU and memory usage

### 3. Health Checks
- Liveness: Database connectivity
- Readiness: All dependencies available
- Startup: Initial cache warming complete

## Migration Plan

### Phase 1: Initial Setup
1. Create database schema and tables
2. Set up initial partitions (3 months)
3. Deploy service with staging processor disabled
4. Test webhook endpoints

### Phase 2: Integration
1. Enable staging processor with small batch size
2. Monitor performance and adjust parameters
3. Integrate with Kafka
4. Deploy to staging environment

### Phase 3: Production Rollout
1. Create production partitions (12 months)
2. Configure monitoring and alerts
3. Load test with expected volumes
4. Gradual rollout with feature flags

## Testing Strategy

### Unit Tests
- Payment validation logic
- Deduplication algorithms
- Batch processing logic
- Error handling scenarios

### Integration Tests
- Database operations with test data
- Kafka publishing
- Redis caching
- Webhook authentication

### Performance Tests
- Load test with 1M+ records
- Concurrent webhook testing (1000 req/s)
- Batch processing throughput
- Memory usage under load

### End-to-End Tests
- Complete payment flow from staging
- Webhook to Kafka event flow
- Duplicate detection accuracy
- Partition rollover scenarios

## Security Considerations

1. **Webhook Security**
   - HMAC signature validation
   - IP whitelist support
   - Rate limiting per source

2. **Data Protection**
   - No sensitive payment data stored
   - Audit logging for all operations
   - Role-based access control

3. **Infrastructure Security**
   - Network isolation
   - Encrypted connections
   - Secrets management

## Future Enhancements

1. **Smart Matching**
   - ML-based payment matching
   - Fuzzy matching for references
   - Anomaly detection

2. **Advanced Analytics**
   - Real-time payment dashboards
   - Trend analysis
   - Channel performance metrics

3. **Integration Expansion**
   - Direct bank API integration
   - Real-time payment notifications
   - Multi-currency support

## Conclusion

This payment service design provides a robust, scalable solution for recording external payments with high performance and reliability. The architecture supports millions of payments while maintaining data integrity through effective deduplication and partitioning strategies.