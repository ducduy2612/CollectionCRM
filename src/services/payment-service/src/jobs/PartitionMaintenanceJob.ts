import * as cron from 'node-cron';
import { Knex } from 'knex';
import pino from 'pino';

export interface PartitionMaintenanceJobConfig {
  schedule: string; // Cron expression (e.g., '0 2 * * *' for daily at 2 AM)
  enabled: boolean;
  retentionMonths: number; // How many months to keep
  futureMonths: number; // How many months ahead to create
}

export class PartitionMaintenanceJob {
  private knex: Knex;
  private logger: pino.Logger;
  private config: PartitionMaintenanceJobConfig;
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;

  constructor(
    knex: Knex,
    logger: pino.Logger,
    config: PartitionMaintenanceJobConfig
  ) {
    this.knex = knex;
    this.logger = logger;
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Partition maintenance job is disabled');
      return;
    }

    if (this.task) {
      this.logger.warn('Partition maintenance job is already running');
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
    }, 'Partition maintenance job started');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.logger.info('Partition maintenance job stopped');
    }
  }

  private async executeJob(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Partition maintenance job is already running, skipping execution');
      return;
    }

    this.isRunning = true;
    this.lastRunTime = new Date();
    
    const startTime = Date.now();

    try {
      this.logger.info('Starting partition maintenance');

      // Create future partitions
      await this.createFuturePartitions();

      // Clean up old partitions
      await this.cleanupOldPartitions();

      const processingTime = Date.now() - startTime;
      this.logger.info({ 
        processing_time_ms: processingTime 
      }, 'Partition maintenance completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({
        error: errorMessage,
        processing_time_ms: Date.now() - startTime
      }, 'Partition maintenance failed');

    } finally {
      this.isRunning = false;
    }
  }

  private async createFuturePartitions(): Promise<void> {
    const currentDate = new Date();
    const partitionsCreated: string[] = [];

    try {
      for (let i = 0; i <= this.config.futureMonths; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1; // JavaScript months are 0-indexed

        const partitionName = `payments_${year}_${month.toString().padStart(2, '0')}`;
        
        // Check if partition already exists
        const exists = await this.partitionExists(partitionName);
        
        if (!exists) {
          await this.createMonthlyPartition(year, month);
          partitionsCreated.push(partitionName);
          
          this.logger.info({ 
            partition: partitionName, 
            year, 
            month 
          }, 'Created partition');
        }
      }

      if (partitionsCreated.length > 0) {
        this.logger.info({ 
          partitions_created: partitionsCreated 
        }, 'Future partitions created');
      } else {
        this.logger.debug('No new partitions needed');
      }

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        partitions_created: partitionsCreated
      }, 'Error creating future partitions');
      throw error;
    }
  }

  private async cleanupOldPartitions(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - this.config.retentionMonths);
    
    const partitionsDropped: string[] = [];

    try {
      // Get list of existing partitions
      const partitions = await this.getPaymentPartitions();
      
      for (const partition of partitions) {
        const partitionDate = this.parsePartitionDate(partition);
        
        if (partitionDate && partitionDate < cutoffDate) {
          await this.dropPartition(partition);
          partitionsDropped.push(partition);
          
          this.logger.info({ 
            partition, 
            partition_date: partitionDate.toISOString() 
          }, 'Dropped old partition');
        }
      }

      if (partitionsDropped.length > 0) {
        this.logger.info({ 
          partitions_dropped: partitionsDropped,
          cutoff_date: cutoffDate.toISOString()
        }, 'Old partitions cleaned up');
      } else {
        this.logger.debug({ 
          cutoff_date: cutoffDate.toISOString() 
        }, 'No old partitions to clean up');
      }

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        partitions_dropped: partitionsDropped,
        cutoff_date: cutoffDate.toISOString()
      }, 'Error cleaning up old partitions');
      throw error;
    }
  }

  private async createMonthlyPartition(year: number, month: number): Promise<void> {
    await this.knex.raw('SELECT payment_service.create_monthly_partition(?, ?)', [year, month]);
  }

  private async partitionExists(partitionName: string): Promise<boolean> {
    const result = await this.knex.raw(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'payment_service' 
        AND table_name = ?
      ) as exists
    `, [partitionName]);

    return result.rows[0]?.exists || false;
  }

  private async getPaymentPartitions(): Promise<string[]> {
    const result = await this.knex.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payment_service' 
      AND table_name LIKE 'payments_%'
      AND table_name ~ '^payments_[0-9]{4}_[0-9]{2}$'
      ORDER BY table_name
    `);

    return result.rows.map((row: any) => row.table_name);
  }

  private parsePartitionDate(partitionName: string): Date | null {
    const match = partitionName.match(/^payments_(\d{4})_(\d{2})$/);
    if (!match) return null;

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    
    return new Date(year, month - 1, 1); // JavaScript months are 0-indexed
  }

  private async dropPartition(partitionName: string): Promise<void> {
    await this.knex.raw(`DROP TABLE IF EXISTS payment_service.${partitionName}`);
  }

  async runOnce(): Promise<void> {
    this.logger.info('Running partition maintenance job once');
    await this.executeJob();
  }

  getStatus(): {
    enabled: boolean;
    running: boolean;
    last_run_time: string | null;
    schedule: string;
    retention_months: number;
    future_months: number;
  } {
    return {
      enabled: this.config.enabled && this.task !== null,
      running: this.isRunning,
      last_run_time: this.lastRunTime?.toISOString() || null,
      schedule: this.config.schedule,
      retention_months: this.config.retentionMonths,
      future_months: this.config.futureMonths,
    };
  }

  updateConfig(newConfig: Partial<PartitionMaintenanceJobConfig>): void {
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

    this.logger.info({ config: this.config }, 'Partition maintenance job config updated');
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
    try {
      const partitions = await this.getPaymentPartitions();
      
      const partitionInfo = partitions.map(partition => {
        const date = this.parsePartitionDate(partition);
        return {
          name: partition,
          date: date?.toISOString() || 'unknown',
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_partitions: partitions.length,
        oldest_partition: partitionInfo[0]?.name || null,
        newest_partition: partitionInfo[partitionInfo.length - 1]?.name || null,
        partitions: partitionInfo,
      };

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error getting partition info');
      throw error;
    }
  }
}