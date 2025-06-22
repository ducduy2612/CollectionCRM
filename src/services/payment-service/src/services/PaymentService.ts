import { Knex } from 'knex';
import { RedisClientType } from 'redis';
import pino from 'pino';
import { PaymentModel } from '@/models/Payment';
import { PaymentReferenceModel } from '@/models/PaymentReference';
import { StagingProcessLogModel } from '@/models/StagingProcessLog';
import { PaymentStagingModel } from '@/models/PaymentStaging';
import { DeduplicationService } from '@/services/DeduplicationService';
import { StagingProcessor } from '@/processors/StagingProcessor';
import { WebhookProcessor } from '@/processors/WebhookProcessor';
import { 
  Payment, 
  PaymentCreateRequest, 
  PaymentResponse, 
  PaymentStats,
  HealthCheckResult,
  BatchProcessResult 
} from '@/types/payment.types';
import { WebhookPaymentData, WebhookProcessingResult } from '@/types/webhook.types';

export interface PaymentServiceConfig {
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
    channels: Record<string, {
      auth: {
        enabled: boolean;
        secret?: string;
        header_name?: string;
        ip_whitelist?: string[];
      };
      rate_limit: {
        enabled: boolean;
        max_requests: number;
        window_ms: number;
      };
    }>;
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

export class PaymentService {
  private knex: Knex;
  private redisClient: RedisClientType;
  private logger: pino.Logger;
  private config: PaymentServiceConfig;

  private paymentModel: PaymentModel;
  private paymentRefModel: PaymentReferenceModel;
  private processLogModel: StagingProcessLogModel;
  private stagingModel: PaymentStagingModel;
  
  private deduplicationService: DeduplicationService;
  private stagingProcessor: StagingProcessor;
  private webhookProcessor: WebhookProcessor;

  constructor(
    knex: Knex,
    redisClient: RedisClientType,
    logger: pino.Logger,
    config: PaymentServiceConfig
  ) {
    this.knex = knex;
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;

    // Initialize models
    this.paymentModel = new PaymentModel(knex);
    this.paymentRefModel = new PaymentReferenceModel(knex);
    this.processLogModel = new StagingProcessLogModel(knex);
    this.stagingModel = new PaymentStagingModel(knex);

    // Initialize services
    this.deduplicationService = new DeduplicationService(
      knex,
      redisClient,
      logger,
      config.deduplication
    );

    this.stagingProcessor = new StagingProcessor(
      knex,
      redisClient,
      this.deduplicationService,
      logger,
      config.staging
    );

    this.webhookProcessor = new WebhookProcessor(
      knex,
      redisClient,
      this.deduplicationService,
      logger,
      config.webhook
    );
  }

  // Webhook Payment Processing
  async processWebhookPayment(
    paymentData: WebhookPaymentData,
    channel?: string,
    clientIp?: string,
    signature?: string
  ): Promise<PaymentResponse> {
    try {
      const result = await this.webhookProcessor.processWebhookPayment(
        paymentData,
        channel,
        clientIp,
        signature
      );

      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }

      return {
        status: result.duplicate ? 'duplicate' : 'created',
        payment_id: result.payment_id!,
        message: result.duplicate ? 'Payment already exists' : 'Payment created successfully',
      };

    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        reference_number: paymentData.reference_number
      }, 'Error in webhook payment processing');

      throw error;
    }
  }

  // Staging Processing
  async processStagingBatch(): Promise<BatchProcessResult> {
    try {
      return await this.stagingProcessor.processNext();
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error processing staging batch');
      throw error;
    }
  }

  // Payment Queries
  async getPaymentByReference(reference_number: string): Promise<Payment | null> {
    try {
      return await this.paymentModel.findByReference(reference_number);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        reference_number
      }, 'Error fetching payment by reference');
      throw error;
    }
  }

  async getPaymentsByLoanAccount(
    loan_account_number: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Payment[]> {
    try {
      return await this.paymentModel.findByLoanAccount(loan_account_number, limit, offset);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        loan_account_number
      }, 'Error fetching payments by loan account');
      throw error;
    }
  }

  async getPaymentsByCif(
    cif: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Payment[]> {
    try {
      return await this.paymentModel.findByCif(cif, limit, offset);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        cif
      }, 'Error fetching payments by CIF');
      throw error;
    }
  }

  async getPaymentsByDateRange(
    start_date: Date,
    end_date: Date,
    limit: number = 1000,
    offset: number = 0
  ): Promise<Payment[]> {
    try {
      return await this.paymentModel.findByDateRange(start_date, end_date, limit, offset);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        start_date,
        end_date
      }, 'Error fetching payments by date range');
      throw error;
    }
  }

  async getPaymentSummary(loan_account_number: string): Promise<{
    total_payments: number;
    total_amount: number;
    first_payment_date?: Date;
    last_payment_date?: Date;
  }> {
    try {
      return await this.paymentModel.getPaymentSummary(loan_account_number);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        loan_account_number
      }, 'Error fetching payment summary');
      throw error;
    }
  }

  // Statistics and Monitoring
  async getStats(): Promise<PaymentStats> {
    try {
      const [paymentStats, stagingStats, webhookStats, cacheStats] = await Promise.all([
        this.paymentModel.getTodayStats(),
        this.stagingProcessor.getProcessingStats(),
        this.webhookProcessor.getTodayStats(),
        this.deduplicationService.getStats(),
      ]);

      const stagingProcessStats = await this.processLogModel.getProcessingStats();

      return {
        staging: {
          processed_today: paymentStats.staging_payments,
          pending_count: stagingStats.pending_count,
          average_batch_time_ms: stagingProcessStats.average_batch_time_ms || 0,
          last_processed_id: stagingStats.last_processed_id ? BigInt(stagingStats.last_processed_id) : undefined,
        },
        webhooks: {
          received_today: webhookStats.requests_today,
          duplicate_rate: webhookStats.duplicate_rate,
          average_response_time_ms: webhookStats.average_response_time,
        },
        cache: {
          memory_hit_rate: cacheStats.memory_hit_rate,
          redis_hit_rate: cacheStats.redis_hit_rate,
          total_references: cacheStats.memory_cache_size,
        },
      };

    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error fetching payment stats');
      throw error;
    }
  }

  async getHealthCheck(): Promise<HealthCheckResult> {
    const checks = {
      database: 'error' as const,
      kafka: 'error' as const,
      redis: 'error' as const,
      staging_backlog: 0,
      last_staging_run: undefined as string | undefined,
    };

    try {
      // Check database
      await this.knex.raw('SELECT 1');
      checks.database = 'ok';
    } catch (error) {
      this.logger.error({ error }, 'Database health check failed');
    }

    try {
      // Check Redis
      await this.redisClient.ping();
      checks.redis = 'ok';
    } catch (error) {
      this.logger.error({ error }, 'Redis health check failed');
    }

    try {
      // Check Kafka (we'll implement this when we add Kafka)
      checks.kafka = 'ok';
    } catch (error) {
      this.logger.error({ error }, 'Kafka health check failed');
    }

    try {
      // Get staging backlog
      const stagingStats = await this.stagingModel.getProcessingStats();
      checks.staging_backlog = stagingStats.unprocessed_records;

      // Get last staging run
      const lastLog = await this.processLogModel.findByStatus('completed', 1);
      if (lastLog.length > 0) {
        checks.last_staging_run = lastLog[0].completed_at?.toISOString();
      }
    } catch (error) {
      this.logger.error({ error }, 'Staging health check failed');
    }

    const isHealthy = checks.database === 'ok' && checks.redis === 'ok' && checks.kafka === 'ok';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  // Cache Management
  async warmCache(limit: number = 10000): Promise<void> {
    try {
      await this.deduplicationService.warmCache(limit);
      this.logger.info({ limit }, 'Cache warming completed');
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error warming cache');
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.deduplicationService.clearCache();
      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error clearing cache');
      throw error;
    }
  }

  // Duplicate Check
  async isDuplicate(reference_number: string): Promise<boolean> {
    try {
      return await this.deduplicationService.isDuplicate(reference_number);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        reference_number
      }, 'Error checking duplicate');
      throw error;
    }
  }

  // Cleanup Operations
  async cleanupOldReferences(days_to_keep: number = 90): Promise<number> {
    try {
      const deleted = await this.paymentRefModel.cleanup(days_to_keep);
      this.logger.info({ deleted, days_to_keep }, 'Old payment references cleaned up');
      return deleted;
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        days_to_keep
      }, 'Error cleaning up old references');
      throw error;
    }
  }

  async cleanupOldProcessLogs(days_to_keep: number = 30): Promise<number> {
    try {
      const deleted = await this.processLogModel.cleanup(days_to_keep);
      this.logger.info({ deleted, days_to_keep }, 'Old process logs cleaned up');
      return deleted;
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        days_to_keep
      }, 'Error cleaning up old process logs');
      throw error;
    }
  }

  // Service Initialization
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Payment Service');

      // Warm up staging processor
      await this.stagingProcessor.warmUp();

      // Warm cache with recent references
      await this.warmCache(10000);

      this.logger.info('Payment Service initialized successfully');

    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error initializing Payment Service');
      throw error;
    }
  }

  // Graceful Shutdown
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Payment Service');

      // Wait for any ongoing staging processing to complete
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait

      while (this.stagingProcessor.getIsProcessing() && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (this.stagingProcessor.getIsProcessing()) {
        this.logger.warn('Staging processor still running after shutdown timeout');
      }

      this.logger.info('Payment Service shutdown completed');

    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error during Payment Service shutdown');
      throw error;
    }
  }
}