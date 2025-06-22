import { Knex } from 'knex';
import { PaymentStaging } from '@/types/payment.types';

export class PaymentStagingModel {
  private knex: Knex;
  private tableName = 'payment_service.payment_staging';

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getUnprocessedBatch(
    batch_size: number = 1000,
    start_id?: bigint
  ): Promise<PaymentStaging[]> {
    let query = this.knex(this.tableName)
      .where('processed', false)
      .orderBy('id');

    if (start_id) {
      query = query.where('id', '>', start_id.toString());
    }

    const results = await query.limit(batch_size);
    return results.map(this.mapDbResult);
  }

  async markAsProcessed(ids: bigint[]): Promise<void> {
    if (ids.length === 0) return;

    const stringIds = ids.map(id => id.toString());
    
    await this.knex(this.tableName)
      .whereIn('id', stringIds)
      .update({
        processed: true,
        processed_at: new Date(),
      });
  }

  async getUnprocessedCount(): Promise<number> {
    const result = await this.knex(this.tableName)
      .where('processed', false)
      .count('* as count')
      .first();

    return parseInt(result?.count as string) || 0;
  }

  async getProcessingStats(): Promise<{
    total_records: number;
    processed_records: number;
    unprocessed_records: number;
    oldest_unprocessed_date?: Date;
    processing_rate_per_hour: number;
  }> {
    const totalResult = await this.knex(this.tableName)
      .select(
        this.knex.raw('COUNT(*) as total_records'),
        this.knex.raw('COUNT(CASE WHEN processed = true THEN 1 END) as processed_records'),
        this.knex.raw('COUNT(CASE WHEN processed = false THEN 1 END) as unprocessed_records'),
        this.knex.raw('MIN(CASE WHEN processed = false THEN created_at END) as oldest_unprocessed_date')
      )
      .first();

    // Calculate processing rate (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentProcessedResult = await this.knex(this.tableName)
      .where('processed', true)
      .where('processed_at', '>=', yesterday)
      .count('* as recent_processed')
      .first();

    const recentProcessed = parseInt(recentProcessedResult?.recent_processed as string) || 0;

    return {
      total_records: parseInt(totalResult?.total_records as string) || 0,
      processed_records: parseInt(totalResult?.processed_records as string) || 0,
      unprocessed_records: parseInt(totalResult?.unprocessed_records as string) || 0,
      oldest_unprocessed_date: totalResult?.oldest_unprocessed_date 
        ? new Date(totalResult.oldest_unprocessed_date) 
        : undefined,
      processing_rate_per_hour: recentProcessed,
    };
  }

  async findByReferenceNumbers(reference_numbers: string[]): Promise<PaymentStaging[]> {
    if (reference_numbers.length === 0) return [];

    const results = await this.knex(this.tableName)
      .whereIn('reference_number', reference_numbers);

    return results.map(this.mapDbResult);
  }

  async getLastProcessedId(): Promise<bigint | null> {
    const result = await this.knex(this.tableName)
      .where('processed', true)
      .orderBy('id', 'desc')
      .select('id')
      .first();

    return result ? BigInt(result.id) : null;
  }

  async getMaxId(): Promise<bigint | null> {
    const result = await this.knex(this.tableName)
      .max('id as max_id')
      .first();

    return result?.max_id ? BigInt(result.max_id) : null;
  }

  private mapDbResult(row: any): PaymentStaging {
    return {
      id: BigInt(row.id),
      reference_number: row.reference_number,
      loan_account_number: row.loan_account_number,
      cif: row.cif,
      amount: parseFloat(row.amount),
      payment_date: new Date(row.payment_date),
      payment_channel: row.payment_channel,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      processed: row.processed,
      processed_at: row.processed_at ? new Date(row.processed_at) : undefined,
      created_at: new Date(row.created_at),
    };
  }
}