import * as cron from 'node-cron';
import pino from 'pino';
import { PaymentService } from '@/services/PaymentService';

export interface StagingIngestionJobConfig {
  schedule: string; // Cron expression
  enabled: boolean;
  maxConsecutiveFailures: number;
  batchProcessingTimeout: number;
}

export class StagingIngestionJob {
  private paymentService: PaymentService;
  private logger: pino.Logger;
  private config: StagingIngestionJobConfig;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private consecutiveFailures: number = 0;
  private lastRunTime: Date | null = null;
  private lastSuccessTime: Date | null = null;

  constructor(
    paymentService: PaymentService,
    logger: pino.Logger,
    config: StagingIngestionJobConfig
  ) {
    this.paymentService = paymentService;
    this.logger = logger;
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Staging ingestion job is disabled');
      return;
    }

    if (this.task) {
      this.logger.warn('Staging ingestion job is already running');
      return;
    }

    this.task = cron.schedule(
      this.config.schedule,
      () => this.executeJob(),
      {
        scheduled: false,
        timezone: 'UTC',
      }
    );

    this.task.start();
    this.logger.info({ 
      schedule: this.config.schedule 
    }, 'Staging ingestion job started');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.logger.info('Staging ingestion job stopped');
    }
  }

  private async executeJob(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Staging ingestion job is already running, skipping execution');
      return;
    }

    if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.logger.error({
        consecutive_failures: this.consecutiveFailures,
        max_failures: this.config.maxConsecutiveFailures
      }, 'Staging ingestion job disabled due to consecutive failures');
      this.stop();
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();
    
    const startTime = Date.now();

    try {
      this.logger.info('Starting staging batch processing');

      // Set a timeout for the entire batch processing
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Batch processing timeout after ${this.config.batchProcessingTimeout}ms`));
        }, this.config.batchProcessingTimeout);
      });

      // Race between actual processing and timeout
      const result = await Promise.race([
        this.paymentService.processStagingBatch(),
        timeoutPromise
      ]);

      const processingTime = Date.now() - startTime;

      this.logger.info({
        ...result,
        total_processing_time_ms: processingTime
      }, 'Staging batch processing completed');

      // Reset consecutive failures on success
      this.consecutiveFailures = 0;
      this.lastSuccessTime = new Date();

      // If there were records processed, immediately check for more
      if (result.total_processed > 0) {
        this.logger.debug('Records found, scheduling immediate next run');
        // Schedule immediate execution for next batch
        setImmediate(() => this.executeJob());
      }

    } catch (error) {
      this.consecutiveFailures++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({
        error: errorMessage,
        consecutive_failures: this.consecutiveFailures,
        processing_time_ms: Date.now() - startTime
      }, 'Staging batch processing failed');

      // If we've hit the max failures, the job will be disabled on the next run
      if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        this.logger.error('Maximum consecutive failures reached, job will be disabled');
      }

    } finally {
      this.isRunning = false;
    }
  }

  async runOnce(): Promise<void> {
    this.logger.info('Running staging ingestion job once');
    await this.executeJob();
  }

  getStatus(): {
    enabled: boolean;
    running: boolean;
    last_run_time: string | null;
    last_success_time: string | null;
    consecutive_failures: number;
    schedule: string;
  } {
    return {
      enabled: this.config.enabled && this.task !== null,
      running: this.isRunning,
      last_run_time: this.lastRunTime?.toISOString() || null,
      last_success_time: this.lastSuccessTime?.toISOString() || null,
      consecutive_failures: this.consecutiveFailures,
      schedule: this.config.schedule,
    };
  }

  updateConfig(newConfig: Partial<StagingIngestionJobConfig>): void {
    const wasRunning = this.task !== null;
    
    // Stop current job if running
    if (wasRunning) {
      this.stop();
    }

    // Update config
    this.config = { ...this.config, ...newConfig };

    // Restart if it was running and still enabled
    if (wasRunning && this.config.enabled) {
      this.start();
    }

    this.logger.info({ config: this.config }, 'Staging ingestion job config updated');
  }

  resetFailureCount(): void {
    this.consecutiveFailures = 0;
    this.logger.info('Staging ingestion job failure count reset');
  }
}