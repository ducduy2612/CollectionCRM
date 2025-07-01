import { Knex } from 'knex';
import { PaymentReference } from '@/types/payment.types';

export class PaymentReferenceModel {
  private knex: Knex;
  private tableName = 'payment_service.payment_references';

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async create(reference: Omit<PaymentReference, 'created_at'>): Promise<PaymentReference> {
    const [result] = await this.knex(this.tableName)
      .insert({
        reference_number: reference.reference_number,
        payment_id: reference.payment_id,
        payment_date: reference.payment_date,
      })
      .returning('*');

    return this.mapDbResult(result);
  }

  async bulkInsert(references: Omit<PaymentReference, 'created_at'>[]): Promise<void> {
    if (references.length === 0) return;

    const insertData = references.map(ref => ({
      reference_number: ref.reference_number,
      payment_id: ref.payment_id,
      payment_date: ref.payment_date,
    }));

    await this.knex(this.tableName)
      .insert(insertData)
      .onConflict('reference_number')
      .ignore();
  }

  async exists(reference_number: string): Promise<boolean> {
    const result = await this.knex(this.tableName)
      .where('reference_number', reference_number)
      .first();

    return !!result;
  }

  async bulkExists(reference_numbers: string[]): Promise<string[]> {
    if (reference_numbers.length === 0) return [];

    const results = await this.knex(this.tableName)
      .whereIn('reference_number', reference_numbers)
      .select('reference_number');

    return results.map(row => row.reference_number);
  }

  async findByReference(reference_number: string): Promise<PaymentReference | null> {
    const result = await this.knex(this.tableName)
      .where('reference_number', reference_number)
      .first();

    return result ? this.mapDbResult(result) : null;
  }

  async cleanup(days_to_keep: number = 90): Promise<number> {
    const cutoff_date = new Date();
    cutoff_date.setDate(cutoff_date.getDate() - days_to_keep);

    const deleted = await this.knex(this.tableName)
      .where('created_at', '<', cutoff_date)
      .del();

    return deleted;
  }

  async getStats(): Promise<{
    total_references: number;
    oldest_reference_date?: Date;
    newest_reference_date?: Date;
  }> {
    const result = await this.knex(this.tableName)
      .select(
        this.knex.raw('COUNT(*) as total_references'),
        this.knex.raw('MIN(created_at) as oldest_reference_date'),
        this.knex.raw('MAX(created_at) as newest_reference_date')
      )
      .first();

    return {
      total_references: parseInt(result.total_references) || 0,
      ...(result.oldest_reference_date && {
        oldest_reference_date: new Date(result.oldest_reference_date)
      }),
      ...(result.newest_reference_date && {
        newest_reference_date: new Date(result.newest_reference_date)
      }),
    };
  }

  async getRecentReferences(limit: number = 1000): Promise<string[]> {
    const results = await this.knex(this.tableName)
      .select('reference_number')
      .orderBy('created_at', 'desc')
      .limit(limit);

    return results.map(row => row.reference_number);
  }

  private mapDbResult(row: any): PaymentReference {
    return {
      reference_number: row.reference_number,
      payment_id: row.payment_id,
      payment_date: new Date(row.payment_date),
      created_at: new Date(row.created_at),
    };
  }
}