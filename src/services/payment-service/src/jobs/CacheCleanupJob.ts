import * as cron from 'node-cron';
import pino from 'pino';
import { PaymentService } from '@/services/PaymentService';

export interface CacheCleanupJobConfig {
  schedule: string; // Cron expression (e.g., '0 3 * * *' for daily at 3 AM)
  enabled: boolean;
  referenceCacheRetentionDays: number;
  processLogRetentionDays: number;
  enableCacheWarming: boolean;
  cacheWarmingLimit: number;
}

export class CacheCleanupJob {
  private paymentService: PaymentService;
  private logger: pino.Logger;
  private config: CacheCleanupJobConfig;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private lastCleanupStats: {
    references_deleted: number;
    process_logs_deleted: number;
    cache_warmed: boolean;
  } | null = null;

  constructor(
    paymentService: PaymentService,
    logger: pino.Logger,
    config: CacheCleanupJobConfig
  ) {
    this.paymentService = paymentService;
    this.logger = logger;
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Cache cleanup job is disabled');
      return;
    }

    if (this.task) {
      this.logger.warn('Cache cleanup job is already running');
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
    }, 'Cache cleanup job started');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.logger.info('Cache cleanup job stopped');
    }
  }

  private async executeJob(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Cache cleanup job is already running, skipping execution');
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();
    
    const startTime = Date.now();

    try {
      this.logger.info('Starting cache cleanup');

      // Step 1: Clean up old reference cache entries
      const referencesDeleted = await this.cleanupReferenceCache();

      // Step 2: Clean up old process logs
      const processLogsDeleted = await this.cleanupProcessLogs();

      // Step 3: Warm cache if enabled
      let cacheWarmed = false;
      if (this.config.enableCacheWarming) {
        await this.warmCache();
        cacheWarmed = true;
      }

      const processingTime = Date.now() - startTime;

      this.lastCleanupStats = {
        references_deleted: referencesDeleted,
        process_logs_deleted: processLogsDeleted,
        cache_warmed: cacheWarmed,
      };

      this.logger.info({
        ...this.lastCleanupStats,
        processing_time_ms: processingTime
      }, 'Cache cleanup completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({
        error: errorMessage,
        processing_time_ms: Date.now() - startTime
      }, 'Cache cleanup failed');

    } finally {
      this.isRunning = false;
    }
  }

  private async cleanupReferenceCache(): Promise<number> {
    try {
      this.logger.debug({ 
        retention_days: this.config.referenceCacheRetentionDays 
      }, 'Cleaning up old reference cache entries');

      const deleted = await this.paymentService.cleanupOldReferences(
        this.config.referenceCacheRetentionDays
      );

      this.logger.info({ 
        deleted_count: deleted,
        retention_days: this.config.referenceCacheRetentionDays 
      }, 'Reference cache cleanup completed');

      return deleted;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        retention_days: this.config.referenceCacheRetentionDays
      }, 'Error cleaning up reference cache');
      throw error;
    }
  }

  private async cleanupProcessLogs(): Promise<number> {
    try {
      this.logger.debug({ 
        retention_days: this.config.processLogRetentionDays 
      }, 'Cleaning up old process logs');

      const deleted = await this.paymentService.cleanupOldProcessLogs(
        this.config.processLogRetentionDays
      );

      this.logger.info({ 
        deleted_count: deleted,
        retention_days: this.config.processLogRetentionDays 
      }, 'Process logs cleanup completed');

      return deleted;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        retention_days: this.config.processLogRetentionDays
      }, 'Error cleaning up process logs');
      throw error;
    }
  }

  private async warmCache(): Promise<void> {
    try {
      this.logger.debug({ 
        limit: this.config.cacheWarmingLimit 
      }, 'Warming cache with recent references');

      await this.paymentService.warmCache(this.config.cacheWarmingLimit);

      this.logger.info({ 
        limit: this.config.cacheWarmingLimit 
      }, 'Cache warming completed');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        limit: this.config.cacheWarmingLimit
      }, 'Error warming cache');
      throw error;
    }
  }

  async runOnce(): Promise<void> {
    this.logger.info('Running cache cleanup job once');
    await this.executeJob();
  }

  async clearAllCaches(): Promise<void> {
    try {
      this.logger.info('Clearing all caches');
      await this.paymentService.clearCache();
      this.logger.info('All caches cleared successfully');
    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error clearing all caches');
      throw error;
    }
  }

  getStatus(): {
    enabled: boolean;
    running: boolean;
    last_run_time: string | null;
    schedule: string;
    last_cleanup_stats: {
      references_deleted: number;
      process_logs_deleted: number;
      cache_warmed: boolean;
    } | null;
    config: {
      reference_cache_retention_days: number;
      process_log_retention_days: number;
      enable_cache_warming: boolean;
      cache_warming_limit: number;
    };
  } {
    return {
      enabled: this.config.enabled && this.task !== null,
      running: this.isRunning,
      last_run_time: this.lastRunTime?.toISOString() || null,
      schedule: this.config.schedule,
      last_cleanup_stats: this.lastCleanupStats,
      config: {
        reference_cache_retention_days: this.config.referenceCacheRetentionDays,
        process_log_retention_days: this.config.processLogRetentionDays,
        enable_cache_warming: this.config.enableCacheWarming,
        cache_warming_limit: this.config.cacheWarmingLimit,
      },
    };
  }

  updateConfig(newConfig: Partial<CacheCleanupJobConfig>): void {
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

    this.logger.info({ config: this.config }, 'Cache cleanup job config updated');
  }

  async getCleanupEstimate(): Promise<{
    estimated_references_to_delete: number;
    estimated_process_logs_to_delete: number;
    current_cache_size: number;
  }> {
    try {
      // This would require additional methods in the service to estimate cleanup
      // For now, return a basic structure
      this.logger.info('Getting cleanup estimate (not implemented yet)');

      return {
        estimated_references_to_delete: 0,
        estimated_process_logs_to_delete: 0,
        current_cache_size: 0,
      };

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error getting cleanup estimate');
      throw error;
    }
  }
}