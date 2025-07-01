# Payment Processing Flows Documentation

This document details the complete processing flows for both staging (batch) and webhook (real-time) payment processing in the CollectionCRM Payment Service.

## Table of Contents

1. [Overview](#overview)
2. [Staging Processing Flow (Batch)](#staging-processing-flow-batch)
3. [Webhook Processing Flow (Real-time)](#webhook-processing-flow-real-time)
4. [Performance Comparison](#performance-comparison)
5. [Error Handling](#error-handling)
6. [Monitoring & Metrics](#monitoring--metrics)

## Overview

The Payment Service handles payment ingestion through two distinct processing paths:

- **Staging Flow**: Batch processing from ETL staging table (every 30 seconds)
- **Webhook Flow**: Real-time processing from external HTTP requests

Both flows converge on the same deduplication and storage mechanisms but differ in their entry points, processing patterns, and performance characteristics.

## Staging Processing Flow (Batch)

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ StagingIngestion│    │   PaymentService │    │ StagingProcessor│
│      Job        │───▶│                  │───▶│                 │
│ (Cron: 30s)     │    │ .processStagingBatch() │.processNext()   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────────────────────┘
                       ▼
              ┌─────────────────┐    ┌─────────────────┐
              │ DeduplicationService   │ PaymentModel    │
              │ .bulkCheckDuplicates() │ .bulkInsert()   │
              │ .addReference()        │                 │
              └─────────────────┘    └─────────────────┘
```

### Detailed Flow Steps

#### 1. Job Initialization
```typescript
// StagingIngestionJob starts on service startup
schedule: '*/30 * * * * *'  // Every 30 seconds
enabled: true               // STAGING_JOB_ENABLED=true
```

#### 2. Job Execution Trigger
```typescript
// StagingIngestionJob.executeJob()
async executeJob(): Promise<void> {
  if (this.isRunning) return; // Prevent concurrent runs
  
  this.isRunning = true;
  
  try {
    // Call PaymentService with timeout protection
    const result = await Promise.race([
      this.paymentService.processStagingBatch(),
      timeoutPromise(this.config.batchProcessingTimeout) // 5 minutes
    ]);
    
    this.handleSuccess(result);
  } catch (error) {
    this.handleFailure(error);
  } finally {
    this.isRunning = false;
  }
}
```

#### 3. Batch Retrieval
```typescript
// StagingProcessor.processNext()
async processNext(): Promise<BatchProcessResult> {
  // Get starting point for processing
  if (!this.lastProcessedId) {
    const lastBatch = await this.processLogModel.getLastProcessedBatch();
    this.lastProcessedId = lastBatch?.batch_end_id || BigInt(0);
  }
  
  // Get next batch of unprocessed records
  const stagingRecords = await this.stagingModel.getUnprocessedBatch(
    this.config.batchSize,        // 1000-2000 records
    this.lastProcessedId
  );
  
  if (stagingRecords.length === 0) {
    return { /* no processing needed */ };
  }
}
```

#### 4. Process Log Creation
```typescript
// Create audit trail for batch processing
const processLog = await this.processLogModel.create({
  batch_start_id: batchStartId,
  batch_end_id: batchEndId,
  total_records: stagingRecords.length,
  processed_records: 0,
  duplicate_records: 0,
  error_records: 0,
  status: 'processing',
  started_at: new Date()
});
```

#### 5. Bulk Duplicate Detection
```typescript
// StagingProcessor.processBatch()
async processBatch(stagingRecords: PaymentStaging[]): Promise<BatchProcessResult> {
  // Extract all reference numbers for bulk checking
  const referenceNumbers = stagingRecords.map(record => record.reference_number);
  
  // Bulk check for duplicates (efficient batch operation)
  const duplicateRefs = await this.deduplicationService.bulkCheckDuplicates(referenceNumbers);
  const duplicateRefSet = new Set(duplicateRefs);
  
  duplicates_found = duplicateRefs.length;
  
  // Filter out duplicates
  const uniqueRecords = stagingRecords.filter(
    record => !duplicateRefSet.has(record.reference_number)
  );
}
```

#### 6. Bulk Database Insert
```typescript
// Database transaction for consistency
await this.knex.transaction(async (trx) => {
  // Convert staging records to payment records
  const payments = uniqueRecords.map(record => ({
    reference_number: record.reference_number,
    loan_account_number: record.loan_account_number,
    cif: record.cif,
    amount: record.amount,
    payment_date: record.payment_date,
    payment_channel: record.payment_channel,
    source: 'staging',
    metadata: record.metadata,
  }));
  
  // Bulk insert payments
  await trx('payment_service.payments').insert(payments);
  
  // Add references to deduplication cache
  await trx('payment_service.payment_references').insert(references)
    .onConflict('reference_number').ignore();
});
```

#### 7. Cache Updates
```typescript
// Update Redis and memory caches (outside transaction)
try {
  const cachePromises = uniqueRecords.map(async (record) => {
    await this.deduplicationService.addReference(
      record.reference_number,
      paymentId,
      record.payment_date
    );
  });
  
  await Promise.all(cachePromises);
} catch (cacheError) {
  // Log but don't fail batch - cache is not critical
  this.logger.warn('Failed to update cache after successful insert');
}
```

#### 8. Batch Completion
```typescript
// Update process log with completion status
await this.processLogModel.update(processLogId, {
  processed_records: result.successful_inserts,
  duplicate_records: result.duplicates_found,
  error_records: result.errors,
  status: result.errors > 0 ? 'failed' : 'completed',
  completed_at: new Date(),
});

// Mark staging records as processed
const processedIds = stagingRecords.map(record => record.id);
await this.stagingModel.markAsProcessed(processedIds);

// Update last processed ID for next batch
this.lastProcessedId = batchEndId;
```

### Staging Flow Performance Characteristics

- **Batch Size**: 1000-2000 records per batch
- **Processing Time**: 2-10 seconds per batch
- **Throughput**: 100-1000 payments/second
- **Memory Usage**: Efficient bulk operations
- **Database Load**: Optimized with bulk inserts

## Webhook Processing Flow (Real-time)

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTTP Client   │    │ WebhookController│    │  PaymentService │
│  (Bank/Gateway) │───▶│                  │───▶│                 │
│ POST /webhook   │    │ .processWebhook- │    │.processWebhook- │
└─────────────────┘    │  Payment()       │    │  Payment()      │
                       └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────────────────────┘
                       ▼
              ┌─────────────────┐    ┌─────────────────┐
              │ WebhookProcessor│    │ DeduplicationService
              │ .processWebhook-│    │ .isDuplicate()  │
              │  Payment()      │    │ .addReference() │
              └─────────────────┘    └─────────────────┘
```

### Detailed Flow Steps

#### 1. HTTP Request Reception
```http
POST /api/v1/payments/webhook
Content-Type: application/json
X-Signature: sha256=abc123...
X-Request-ID: req-2024-001

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

#### 2. Request Validation
```typescript
// WebhookController.processWebhookPayment()
async processWebhookPayment(req: Request, res: Response): Promise<void> {
  const requestId = req.headers['x-request-id'] || crypto.randomBytes(8).toString('hex');
  const clientIp = req.ip || 'unknown';
  const signature = req.headers['x-signature'] as string;
  
  // Express validator validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  
  // Zod schema validation
  const parseResult = WebhookPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payment data',
      details: parseResult.error.errors,
    });
  }
}
```

#### 3. Authentication Validation
```typescript
// WebhookProcessor.validateAuth()
private async validateAuth(
  paymentData: WebhookPaymentData,
  signature?: string,
  authConfig?: WebhookAuthConfig
): Promise<boolean> {
  if (!authConfig?.enabled || !signature || !authConfig.secret) {
    return !authConfig?.enabled; // Allow if auth disabled
  }
  
  // Create HMAC signature
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

#### 4. Rate Limiting Check
```typescript
// WebhookProcessor.checkRateLimit()
private async checkRateLimit(
  clientKey: string,
  channel?: string,
  rateLimitConfig?: RateLimitConfig
): Promise<RateLimitInfo> {
  const key = `rate_limit:webhook:${channel || 'default'}:${clientKey}`;
  const windowStart = Math.floor(Date.now() / rateLimitConfig.window_ms) * rateLimitConfig.window_ms;
  const windowKey = `${key}:${windowStart}`;
  
  // Check current count in Redis
  const current = await this.redisClient.get(windowKey);
  const currentCount = current ? parseInt(current) : 0;
  
  if (currentCount >= rateLimitConfig.max_requests) {
    return {
      allowed: false,
      remaining: 0,
      reset_time: windowStart + rateLimitConfig.window_ms,
      total: rateLimitConfig.max_requests,
    };
  }
  
  // Increment counter with expiration
  const multi = this.redisClient.multi();
  multi.incr(windowKey);
  multi.expire(windowKey, Math.ceil(rateLimitConfig.window_ms / 1000));
  await multi.exec();
  
  return {
    allowed: true,
    remaining: rateLimitConfig.max_requests - currentCount - 1,
    reset_time: windowStart + rateLimitConfig.window_ms,
    total: rateLimitConfig.max_requests,
  };
}
```

#### 5. Duplicate Detection
```typescript
// Multi-layer cache lookup for single payment
const isDuplicate = await this.deduplicationService.isDuplicate(paymentData.reference_number);

// DeduplicationService.isDuplicate() - 3-layer cache
async isDuplicate(reference: string): Promise<boolean> {
  // Layer 1: Memory cache (0.1ms) - 80%+ hit rate
  if (this.memoryCache.has(reference)) {
    this.stats.memory_hits++;
    return true;
  }
  
  // Layer 2: Redis cache (2-5ms) - 15% hit rate
  const redisResult = await this.redisClient.get(`payment_ref:${reference}`);
  if (redisResult) {
    this.stats.redis_hits++;
    this.memoryCache.set(reference, true); // Promote to memory
    return true;
  }
  
  // Layer 3: Database (10-30ms) - 5% hit rate
  this.stats.db_checks++;
  const exists = await this.paymentRefModel.exists(reference);
  if (exists) {
    await this.cacheReference(reference); // Cache for future
  }
  return exists;
}
```

#### 6. Duplicate Response (Fast Path)
```typescript
if (isDuplicate) {
  this.logger.info({
    request_id: requestId,
    reference_number: paymentData.reference_number
  }, 'Duplicate payment detected');
  
  this.metrics.duplicate_requests++;
  
  // Get existing payment ID for response
  const existingPayment = await this.paymentModel.findByReference(paymentData.reference_number);
  
  return {
    success: true,
    payment_id: existingPayment?.id || 'unknown',
    duplicate: true,
    processing_time_ms: Date.now() - startTime, // ~5-15ms
  };
}
```

#### 7. New Payment Processing
```typescript
// Process new payment (database transaction)
const paymentDate = typeof paymentData.payment_date === 'string'
  ? new Date(paymentData.payment_date)
  : paymentData.payment_date;

const paymentCreateData: Omit<Payment, 'id' | 'created_at'> = {
  reference_number: paymentData.reference_number,
  loan_account_number: paymentData.loan_account_number,
  cif: paymentData.cif,
  amount: paymentData.amount,
  payment_date: paymentDate,
  source: 'webhook',
  metadata: {
    ...paymentData.metadata,
    webhook_channel: channel,
    client_ip: clientIp,
    request_id: requestId,
  },
};

// Add payment_channel if available
if (paymentData.payment_channel) {
  paymentCreateData.payment_channel = paymentData.payment_channel;
}

// Insert payment (single transaction)
const payment = await this.paymentModel.create(paymentCreateData);
```

#### 8. Cache Updates & Event Publishing
```typescript
// Add to deduplication cache
await this.deduplicationService.addReference(
  payment.reference_number,
  payment.id,
  payment.payment_date
);

// Publish Kafka event (optional - can be async)
try {
  await this.kafkaProducer.publishPaymentRecorded(payment);
} catch (kafkaError) {
  // Log but don't fail request - event publishing is not critical for response
  this.logger.error({ error: kafkaError }, 'Failed to publish payment event');
}

// Update metrics
this.metrics.successful_requests++;
this.updateAverageResponseTime(Date.now() - startTime);
```

#### 9. Response Generation
```typescript
return {
  success: true,
  payment_id: payment.id,
  duplicate: false,
  processing_time_ms: Date.now() - startTime, // ~20-60ms
};

// WebhookController formats final response
res.status(201).json({
  success: true,
  data: {
    status: 'created',
    payment_id: payment.id,
    duplicate: false,
    processing_time_ms: 45
  }
});
```

### Webhook Flow Performance Characteristics

- **Response Time**: 20-60ms (P95 < 100ms)
- **Throughput**: 100-500 requests/second per instance
- **Duplicate Detection**: 5-15ms (cached), 20-50ms (new)
- **Timeout Protection**: 5 seconds
- **Cache Hit Rates**: Memory (80%), Redis (15%), DB (5%)

## Performance Comparison

| Aspect | **Staging (Batch)** | **Webhook (Real-time)** |
|--------|-------------------|------------------------|
| **Processing Pattern** | Bulk operations | Individual transactions |
| **Latency** | 30 seconds (job interval) | 20-60ms |
| **Throughput** | 100-1000 payments/second | 100-500 requests/second |
| **Resource Usage** | CPU intensive (bulk processing) | I/O intensive (individual queries) |
| **Error Recovery** | Batch retry with failure tracking | Individual request failure |
| **Duplicate Check** | `bulkCheckDuplicates(refs[])` | `isDuplicate(single_ref)` |
| **Database Load** | Bulk inserts (efficient) | Individual inserts |
| **Cache Strategy** | Bulk cache updates | Real-time cache updates |
| **Event Publishing** | Batch events | Individual events |
| **Failure Impact** | Affects entire batch | Affects single payment |

## Error Handling

### Staging Flow Error Handling

#### Batch-Level Errors
```typescript
// StagingIngestionJob handles consecutive failures
if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
  this.logger.error({
    consecutive_failures: this.consecutiveFailures,
    max_failures: this.config.maxConsecutiveFailures
  }, 'Staging ingestion job disabled due to consecutive failures');
  this.stop(); // Disable job to prevent further failures
  return;
}
```

#### Transaction Rollback
```typescript
// StagingProcessor handles database transaction failures
try {
  await this.knex.transaction(async (trx) => {
    await trx('payment_service.payments').insert(payments);
    await trx('payment_service.payment_references').insert(references);
  });
} catch (error) {
  // Entire transaction rolls back
  this.logger.error({ error }, 'Database transaction failed');
  
  // Update process log with error
  await this.processLogModel.update(processLogId, {
    status: 'failed',
    completed_at: new Date(),
    error_details: { error: error.message },
  });
  
  throw error; // Propagate to job manager
}
```

#### Partial Batch Processing
```typescript
// Continue processing even if some records fail
const result = {
  total_processed: stagingRecords.length,
  successful_inserts: uniqueRecords.length,
  duplicates_found: duplicateRefs.length,
  errors: stagingRecords.length - uniqueRecords.length - duplicateRefs.length,
  processing_time_ms: Date.now() - startTime,
};
```

### Webhook Flow Error Handling

#### Authentication Failures
```typescript
if (!isValidSignature) {
  this.logger.warn({ request_id: requestId, channel }, 'Authentication failed');
  this.metrics.failed_requests++;
  return {
    success: false,
    duplicate: false,
    error: 'Authentication failed',
    processing_time_ms: Date.now() - startTime,
  };
}
```

#### Rate Limiting
```typescript
if (!rateLimitResult.allowed) {
  this.logger.warn({
    request_id: requestId,
    channel,
    client_ip: clientIp,
    rate_limit: rateLimitResult
  }, 'Rate limit exceeded');
  
  this.metrics.failed_requests++;
  return {
    success: false,
    duplicate: false,
    error: 'Rate limit exceeded',
    processing_time_ms: Date.now() - startTime,
  };
}
```

#### Database Failures
```typescript
try {
  const payment = await this.paymentModel.create(paymentCreateData);
} catch (error) {
  this.logger.error({
    request_id: requestId,
    error: error.message,
    reference_number: paymentData.reference_number
  }, 'Failed to create payment');
  
  this.metrics.failed_requests++;
  return {
    success: false,
    duplicate: false,
    error: 'Payment processing failed',
    processing_time_ms: Date.now() - startTime,
  };
}
```

#### Timeout Protection
```typescript
// Webhook timeout configuration
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error('Webhook processing timeout'));
  }, this.config.timeout_ms); // 5000ms
});

const result = await Promise.race([
  this.processWebhookPayment(paymentData, channel, clientIp, signature),
  timeoutPromise
]);
```

## Monitoring & Metrics

### Key Performance Indicators

#### Staging Flow Metrics
```typescript
// Process log tracking
{
  batch_id: "uuid",
  total_records: 1500,
  processed_records: 1350,
  duplicate_records: 120,
  error_records: 30,
  processing_time_ms: 4500,
  status: "completed"
}

// Job health metrics
{
  consecutive_failures: 0,
  last_run_time: "2024-01-15T10:30:00Z",
  last_success_time: "2024-01-15T10:30:00Z",
  avg_processing_time: 3200,
  records_per_second: 468
}
```

#### Webhook Flow Metrics
```typescript
// Real-time metrics
{
  total_requests: 8500,
  successful_requests: 8200,
  duplicate_requests: 250,
  failed_requests: 50,
  average_response_time: 45.2,
  p95_response_time: 89.5,
  cache_hit_rate: {
    memory: 0.85,
    redis: 0.12,
    database: 0.03
  }
}

// Rate limiting metrics
{
  rate_limited_requests: 12,
  top_clients_by_volume: [
    { client_ip: "192.168.1.100", requests: 1200 },
    { client_ip: "10.0.0.50", requests: 800 }
  ]
}
```

### Prometheus Metrics

#### Custom Metrics for Both Flows
```typescript
// Processing duration
const processingDuration = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Payment processing duration',
  labelNames: ['source', 'channel', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// Processing total
const processingTotal = new Counter({
  name: 'payment_processing_total',
  help: 'Total payments processed',
  labelNames: ['source', 'status']
});

// Cache performance
const cacheHitRate = new Gauge({
  name: 'deduplication_cache_hit_rate',
  help: 'Cache hit rate by layer',
  labelNames: ['cache_layer']
});

// Staging backlog
const stagingBacklog = new Gauge({
  name: 'staging_backlog_size',
  help: 'Number of unprocessed staging records'
});
```

### Health Check Endpoints

```http
GET /api/v1/monitoring/health
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "redis": "ok", 
    "kafka": "ok",
    "staging_backlog": 1250,
    "last_staging_run": "2024-01-15T10:30:00Z"
  }
}

GET /api/v1/monitoring/jobs/status
{
  "job_manager": { "initialized": true },
  "staging_ingestion": {
    "enabled": true,
    "running": false,
    "consecutive_failures": 0,
    "last_run": "2024-01-15T10:30:00Z"
  }
}

GET /api/v1/monitoring/stats
{
  "payments": {
    "total_today": 15000,
    "webhook_payments": 8500,
    "staging_payments": 6500
  },
  "staging": {
    "processed_today": 6500,
    "pending_count": 1250,
    "average_batch_time_ms": 3200
  }
}
```

This comprehensive documentation covers both processing flows with their complete lifecycle, performance characteristics, error handling strategies, and monitoring capabilities.