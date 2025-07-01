import pino from 'pino';
import { Knex } from 'knex';
import { PaymentService } from '@/services/PaymentService';
import { StagingIngestionJob, StagingIngestionJobConfig } from './StagingIngestionJob';
import { PartitionMaintenanceJob, PartitionMaintenanceJobConfig } from './PartitionMaintenanceJob';
import { CacheCleanupJob, CacheCleanupJobConfig } from './CacheCleanupJob';

export interface JobManagerConfig {
  stagingIngestion: StagingIngestionJobConfig;
  partitionMaintenance: PartitionMaintenanceJobConfig;
  cacheCleanup: CacheCleanupJobConfig;
}

export class JobManager {
  private logger: pino.Logger;
  private config: JobManagerConfig;

  private stagingIngestionJob: StagingIngestionJob;
  private partitionMaintenanceJob: PartitionMaintenanceJob;
  private cacheCleanupJob: CacheCleanupJob;

  private isInitialized: boolean = false;

  constructor(
    paymentService: PaymentService,
    knex: Knex,
    logger: pino.Logger,
    config: JobManagerConfig
  ) {
    this.logger = logger;
    this.config = config;

    // Initialize jobs
    this.stagingIngestionJob = new StagingIngestionJob(
      paymentService,
      logger.child({ job: 'staging-ingestion' }),
      config.stagingIngestion
    );

    this.partitionMaintenanceJob = new PartitionMaintenanceJob(
      knex,
      logger.child({ job: 'partition-maintenance' }),
      config.partitionMaintenance
    );

    this.cacheCleanupJob = new CacheCleanupJob(
      paymentService,
      logger.child({ job: 'cache-cleanup' }),
      config.cacheCleanup
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Job manager already initialized');
      return;
    }

    try {
      this.logger.info('Initializing job manager');

      // Start all enabled jobs
      this.stagingIngestionJob.start();
      this.partitionMaintenanceJob.start();
      this.cacheCleanupJob.start();

      this.isInitialized = true;
      this.logger.info('Job manager initialized successfully');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error initializing job manager');
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Job manager not initialized');
      return;
    }

    try {
      this.logger.info('Shutting down job manager');

      // Stop all jobs
      this.stagingIngestionJob.stop();
      this.partitionMaintenanceJob.stop();
      this.cacheCleanupJob.stop();

      this.isInitialized = false;
      this.logger.info('Job manager shut down successfully');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error shutting down job manager');
      throw error;
    }
  }

  // Staging Ingestion Job Methods
  async runStagingIngestionOnce(): Promise<void> {
    await this.stagingIngestionJob.runOnce();
  }

  updateStagingIngestionConfig(config: Partial<StagingIngestionJobConfig>): void {
    this.stagingIngestionJob.updateConfig(config);
    this.config.stagingIngestion = { ...this.config.stagingIngestion, ...config };
  }

  resetStagingIngestionFailures(): void {
    this.stagingIngestionJob.resetFailureCount();
  }

  // Partition Maintenance Job Methods
  async runPartitionMaintenanceOnce(): Promise<void> {
    await this.partitionMaintenanceJob.runOnce();
  }

  updatePartitionMaintenanceConfig(config: Partial<PartitionMaintenanceJobConfig>): void {
    this.partitionMaintenanceJob.updateConfig(config);
    this.config.partitionMaintenance = { ...this.config.partitionMaintenance, ...config };
  }

  async getPartitionInfo(): Promise<{
    total_partitions: number;
    oldest_partition: string | null;
    newest_partition: string | null;
    partitions: Array<{
      name: string;
      date: string;
      size_mb?: number;
    }>;
  }> {
    return await this.partitionMaintenanceJob.getPartitionInfo();
  }

  // Cache Cleanup Job Methods
  async runCacheCleanupOnce(): Promise<void> {
    await this.cacheCleanupJob.runOnce();
  }

  updateCacheCleanupConfig(config: Partial<CacheCleanupJobConfig>): void {
    this.cacheCleanupJob.updateConfig(config);
    this.config.cacheCleanup = { ...this.config.cacheCleanup, ...config };
  }

  async clearAllCaches(): Promise<void> {
    await this.cacheCleanupJob.clearAllCaches();
  }

  // Status and Monitoring
  getJobsStatus(): {
    job_manager: {
      initialized: boolean;
    };
    staging_ingestion: ReturnType<StagingIngestionJob['getStatus']>;
    partition_maintenance: ReturnType<PartitionMaintenanceJob['getStatus']>;
    cache_cleanup: ReturnType<CacheCleanupJob['getStatus']>;
  } {
    return {
      job_manager: {
        initialized: this.isInitialized,
      },
      staging_ingestion: this.stagingIngestionJob.getStatus(),
      partition_maintenance: this.partitionMaintenanceJob.getStatus(),
      cache_cleanup: this.cacheCleanupJob.getStatus(),
    };
  }

  async getJobsHealth(): Promise<{
    overall_health: 'healthy' | 'degraded' | 'unhealthy';
    jobs: {
      staging_ingestion: {
        status: 'healthy' | 'warning' | 'error';
        issues: string[];
      };
      partition_maintenance: {
        status: 'healthy' | 'warning' | 'error';
        issues: string[];
      };
      cache_cleanup: {
        status: 'healthy' | 'warning' | 'error';
        issues: string[];
      };
    };
  }> {
    const status = this.getJobsStatus();
    const issues: { [key: string]: { status: 'healthy' | 'warning' | 'error'; issues: string[] } } = {
      staging_ingestion: { status: 'healthy', issues: [] },
      partition_maintenance: { status: 'healthy', issues: [] },
      cache_cleanup: { status: 'healthy', issues: [] },
    };

    // Check staging ingestion health
    if (!status.staging_ingestion.enabled) {
      issues.staging_ingestion.status = 'warning';
      issues.staging_ingestion.issues.push('Job is disabled');
    } else if (status.staging_ingestion.consecutive_failures > 0) {
      issues.staging_ingestion.status = status.staging_ingestion.consecutive_failures >= 3 ? 'error' : 'warning';
      issues.staging_ingestion.issues.push(`${status.staging_ingestion.consecutive_failures} consecutive failures`);
    }

    // Check partition maintenance health
    if (!status.partition_maintenance.enabled) {
      issues.partition_maintenance.status = 'warning';
      issues.partition_maintenance.issues.push('Job is disabled');
    }

    // Check cache cleanup health
    if (!status.cache_cleanup.enabled) {
      issues.cache_cleanup.status = 'warning';
      issues.cache_cleanup.issues.push('Job is disabled');
    }

    // Determine overall health
    const statuses = Object.values(issues).map(issue => issue.status);
    let overall_health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (statuses.includes('error')) {
      overall_health = 'unhealthy';
    } else if (statuses.includes('warning')) {
      overall_health = 'degraded';
    }

    return {
      overall_health,
      jobs: issues as {
        staging_ingestion: {
          status: 'healthy' | 'warning' | 'error';
          issues: string[];
        };
        partition_maintenance: {
          status: 'healthy' | 'warning' | 'error';
          issues: string[];
        };
        cache_cleanup: {
          status: 'healthy' | 'warning' | 'error';
          issues: string[];
        };
      },
    };
  }

  updateAllJobsConfig(config: Partial<JobManagerConfig>): void {
    if (config.stagingIngestion) {
      this.updateStagingIngestionConfig(config.stagingIngestion);
    }

    if (config.partitionMaintenance) {
      this.updatePartitionMaintenanceConfig(config.partitionMaintenance);
    }

    if (config.cacheCleanup) {
      this.updateCacheCleanupConfig(config.cacheCleanup);
    }

    this.logger.info('All job configs updated');
  }

  getConfig(): JobManagerConfig {
    return { ...this.config };
  }

  async restart(): Promise<void> {
    this.logger.info('Restarting job manager');
    
    await this.shutdown();
    await this.initialize();
    
    this.logger.info('Job manager restarted successfully');
  }
}