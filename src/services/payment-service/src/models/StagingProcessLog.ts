import { Knex } from 'knex';
import { StagingProcessLog } from '@/types/payment.types';

export class StagingProcessLogModel {
  private knex: Knex;
  private tableName = 'payment_service.staging_process_log';

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async create(log: Omit<StagingProcessLog, 'id' | 'started_at'>): Promise<StagingProcessLog> {
    const [result] = await this.knex(this.tableName)
      .insert({
        batch_start_id: log.batch_start_id.toString(),
        batch_end_id: log.batch_end_id.toString(),
        total_records: log.total_records,
        processed_records: log.processed_records,
        duplicate_records: log.duplicate_records,
        error_records: log.error_records,
        status: log.status,
        completed_at: log.completed_at,
        error_details: log.error_details ? JSON.stringify(log.error_details) : null,
      })
      .returning('*');

    return this.mapDbResult(result);
  }

  async update(id: string, updates: Partial<Omit<StagingProcessLog, 'id' | 'started_at'>>): Promise<StagingProcessLog> {
    const updateData: any = {};
    
    if (updates.batch_start_id !== undefined) {
      updateData.batch_start_id = updates.batch_start_id.toString();
    }
    if (updates.batch_end_id !== undefined) {
      updateData.batch_end_id = updates.batch_end_id.toString();
    }
    if (updates.total_records !== undefined) {
      updateData.total_records = updates.total_records;
    }
    if (updates.processed_records !== undefined) {
      updateData.processed_records = updates.processed_records;
    }
    if (updates.duplicate_records !== undefined) {
      updateData.duplicate_records = updates.duplicate_records;
    }
    if (updates.error_records !== undefined) {
      updateData.error_records = updates.error_records;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.completed_at !== undefined) {
      updateData.completed_at = updates.completed_at;
    }
    if (updates.error_details !== undefined) {
      updateData.error_details = updates.error_details ? JSON.stringify(updates.error_details) : null;
    }

    const [result] = await this.knex(this.tableName)
      .where('id', id)
      .update(updateData)
      .returning('*');

    return this.mapDbResult(result);
  }

  async findById(id: string): Promise<StagingProcessLog | null> {
    const result = await this.knex(this.tableName)
      .where('id', id)
      .first();

    return result ? this.mapDbResult(result) : null;
  }

  async findByStatus(status: string, limit: number = 100): Promise<StagingProcessLog[]> {
    const results = await this.knex(this.tableName)
      .where('status', status)
      .orderBy('started_at', 'desc')
      .limit(limit);

    return results.map(this.mapDbResult);
  }

  async findRecentLogs(limit: number = 50): Promise<StagingProcessLog[]> {
    const results = await this.knex(this.tableName)
      .orderBy('started_at', 'desc')
      .limit(limit);

    return results.map(this.mapDbResult);
  }

  async getProcessingStats(): Promise<{
    total_logs: number;
    processing_count: number;
    completed_count: number;
    failed_count: number;
    total_processed_records: number;
    total_duplicate_records: number;
    total_error_records: number;
    average_batch_time_ms?: number;
  }> {
    const result = await this.knex(this.tableName)
      .select(
        this.knex.raw('COUNT(*) as total_logs'),
        this.knex.raw("COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count"),
        this.knex.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count"),
        this.knex.raw("COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count"),
        this.knex.raw('SUM(processed_records) as total_processed_records'),
        this.knex.raw('SUM(duplicate_records) as total_duplicate_records'),
        this.knex.raw('SUM(error_records) as total_error_records'),
        this.knex.raw(`
          AVG(CASE 
            WHEN completed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 
          END) as average_batch_time_ms
        `)
      )
      .first();

    return {
      total_logs: parseInt(result.total_logs) || 0,
      processing_count: parseInt(result.processing_count) || 0,
      completed_count: parseInt(result.completed_count) || 0,
      failed_count: parseInt(result.failed_count) || 0,
      total_processed_records: parseInt(result.total_processed_records) || 0,
      total_duplicate_records: parseInt(result.total_duplicate_records) || 0,
      total_error_records: parseInt(result.total_error_records) || 0,
      ...(result.average_batch_time_ms && {
        average_batch_time_ms: parseFloat(result.average_batch_time_ms)
      }),
    };
  }

  async getLastProcessedBatch(): Promise<{ batch_end_id: bigint } | null> {
    const result = await this.knex(this.tableName)
      .where('status', 'completed')
      .orderBy('completed_at', 'desc')
      .select('batch_end_id')
      .first();

    return result ? { batch_end_id: BigInt(result.batch_end_id) } : null;
  }

  async cleanup(days_to_keep: number = 30): Promise<number> {
    const cutoff_date = new Date();
    cutoff_date.setDate(cutoff_date.getDate() - days_to_keep);

    const deleted = await this.knex(this.tableName)
      .where('started_at', '<', cutoff_date)
      .whereIn('status', ['completed', 'failed'])
      .del();

    return deleted;
  }

  private mapDbResult(row: any): StagingProcessLog {
    return {
      id: row.id,
      batch_start_id: BigInt(row.batch_start_id),
      batch_end_id: BigInt(row.batch_end_id),
      total_records: row.total_records,
      processed_records: row.processed_records,
      duplicate_records: row.duplicate_records,
      error_records: row.error_records,
      status: row.status,
      started_at: new Date(row.started_at),
      ...(row.completed_at && { completed_at: new Date(row.completed_at) }),
      ...(row.error_details && { error_details: JSON.parse(row.error_details) }),
    };
  }
}