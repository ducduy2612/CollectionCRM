import { Knex } from 'knex';
import { Payment } from '@/types/payment.types';

export class PaymentModel {
  private knex: Knex;
  private tableName = 'payment_service.payments';

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async create(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const [result] = await this.knex(this.tableName)
      .insert({
        reference_number: payment.reference_number,
        loan_account_number: payment.loan_account_number,
        cif: payment.cif,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_channel: payment.payment_channel,
        source: payment.source,
        metadata: payment.metadata ? JSON.stringify(payment.metadata) : null,
      })
      .returning('*');

    return this.mapDbResult(result);
  }

  async bulkInsert(payments: Omit<Payment, 'id' | 'created_at'>[]): Promise<void> {
    if (payments.length === 0) return;

    const insertData = payments.map(payment => ({
      reference_number: payment.reference_number,
      loan_account_number: payment.loan_account_number,
      cif: payment.cif,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_channel: payment.payment_channel,
      source: payment.source,
      metadata: payment.metadata ? JSON.stringify(payment.metadata) : null,
    }));

    await this.knex(this.tableName).insert(insertData);
  }

  async findByReference(reference_number: string): Promise<Payment | null> {
    const result = await this.knex(this.tableName)
      .where('reference_number', reference_number)
      .first();

    return result ? this.mapDbResult(result) : null;
  }

  async findByLoanAccount(
    loan_account_number: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Payment[]> {
    const results = await this.knex(this.tableName)
      .where('loan_account_number', loan_account_number)
      .orderBy('payment_date', 'desc')
      .limit(limit)
      .offset(offset);

    return results.map(this.mapDbResult);
  }

  async findByCif(
    cif: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Payment[]> {
    const results = await this.knex(this.tableName)
      .where('cif', cif)
      .orderBy('payment_date', 'desc')
      .limit(limit)
      .offset(offset);

    return results.map(this.mapDbResult);
  }

  async findByCifWithFilters(
    cif: string,
    filters: {
      loan_account_number?: string;
      start_date?: Date;
      end_date?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<Payment[]> {
    const {
      loan_account_number,
      start_date,
      end_date,
      limit = 100,
      offset = 0
    } = filters;

    let query = this.knex(this.tableName)
      .where('cif', cif);

    // Add loan account number filter if provided
    if (loan_account_number) {
      query = query.where('loan_account_number', loan_account_number);
    }

    // Add date range filter if provided
    if (start_date && end_date) {
      query = query.whereBetween('payment_date', [start_date, end_date]);
    }

    const results = await query
      .orderBy('payment_date', 'desc')
      .limit(limit)
      .offset(offset);

    return results.map(this.mapDbResult);
  }

  async findByDateRange(
    start_date: Date,
    end_date: Date,
    limit: number = 1000,
    offset: number = 0
  ): Promise<Payment[]> {
    const results = await this.knex(this.tableName)
      .whereBetween('payment_date', [start_date, end_date])
      .orderBy('payment_date', 'desc')
      .limit(limit)
      .offset(offset);

    return results.map(this.mapDbResult);
  }


  async getTodayStats(): Promise<{
    total_payments: number;
    total_amount: number;
    staging_payments: number;
    webhook_payments: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.knex(this.tableName)
      .whereBetween('created_at', [today, tomorrow])
      .select(
        this.knex.raw('COUNT(*) as total_payments'),
        this.knex.raw('SUM(amount) as total_amount'),
        this.knex.raw("COUNT(CASE WHEN source = 'staging' THEN 1 END) as staging_payments"),
        this.knex.raw("COUNT(CASE WHEN source = 'webhook' THEN 1 END) as webhook_payments")
      )
      .first();

    return {
      total_payments: parseInt(result.total_payments) || 0,
      total_amount: parseFloat(result.total_amount) || 0,
      staging_payments: parseInt(result.staging_payments) || 0,
      webhook_payments: parseInt(result.webhook_payments) || 0,
    };
  }

  private mapDbResult(row: any): Payment {
    return {
      id: row.id,
      reference_number: row.reference_number,
      loan_account_number: row.loan_account_number,
      cif: row.cif,
      amount: parseFloat(row.amount),
      payment_date: new Date(row.payment_date),
      payment_channel: row.payment_channel,
      source: row.source,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      created_at: new Date(row.created_at),
    };
  }
}