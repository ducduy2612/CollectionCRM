import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { SynchronizedEntity } from './base.entity';
import { Customer } from './customer.entity';

/**
 * Loan status enum
 */
export enum LoanStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

/**
 * Payment frequency enum
 */
export enum PaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUALLY = 'SEMIANNUALLY',
  ANNUALLY = 'ANNUALLY'
}

/**
 * Delinquency status enum
 */
export enum DelinquencyStatus {
  CURRENT = 'CURRENT',
  DELINQUENT = 'DELINQUENT',
  DEFAULT = 'DEFAULT'
}

/**
 * Due segmentation entity for loan payments
 */
@Entity('due_segmentations')
export class DueSegmentation extends SynchronizedEntity {
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'principal_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  principalAmount: number;

  @Column({ name: 'interest_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  interestAmount: number;

  @Column({ name: 'fees_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  feesAmount: number;

  @Column({ name: 'penalty_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  penaltyAmount: number;

  @ManyToOne(() => Loan, loan => loan.dueSegmentations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  @Index()
  loan: Loan;

  @Column({ name: 'loan_id' })
  loanId: string;
}

/**
 * Loan entity
 */
@Entity('loans')
export class Loan extends SynchronizedEntity {
  @Column({ name: 'account_number', unique: true })
  @Index()
  accountNumber: string;

  @ManyToOne(() => Customer, customer => customer.loans)
  @JoinColumn({ name: 'customer_id' })
  @Index()
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'cif' })
  @Index()
  cif: string;

  @Column({ name: 'product_type' })
  productType: string;

  @Column({ name: 'original_amount', type: 'decimal', precision: 18, scale: 2 })
  originalAmount: number;

  @Column()
  currency: string;

  @Column({ name: 'disbursement_date', type: 'date' })
  disbursementDate: Date;

  @Column({ name: 'maturity_date', type: 'date' })
  maturityDate: Date;

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2 })
  interestRate: number;

  @Column()
  term: number;

  @Column({
    name: 'payment_frequency',
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY
  })
  paymentFrequency: PaymentFrequency;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  limit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  outstanding: number;

  @Column({ name: 'remaining_amount', type: 'decimal', precision: 18, scale: 2 })
  remainingAmount: number;

  @Column({ name: 'due_amount', type: 'decimal', precision: 18, scale: 2 })
  dueAmount: number;

  @Column({ name: 'min_pay', type: 'decimal', precision: 18, scale: 2, default: 0 })
  minPay: number;

  @Column({ name: 'next_payment_date', type: 'date', nullable: true })
  nextPaymentDate: Date;

  @Column({ default: 0 })
  dpd: number;

  @Column({
    name: 'delinquency_status',
    type: 'enum',
    enum: DelinquencyStatus,
    default: DelinquencyStatus.CURRENT
  })
  delinquencyStatus: DelinquencyStatus;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.OPEN
  })
  status: LoanStatus;

  @Column({ name: 'close_date', type: 'date', nullable: true })
  closeDate: Date;

  @Column({ name: 'resolution_code', nullable: true })
  resolutionCode: string;

  @Column({ name: 'resolution_notes', nullable: true })
  resolutionNotes: string;

  // Relationships
  @OneToMany(() => DueSegmentation, dueSegmentation => dueSegmentation.loan, { cascade: true })
  dueSegmentations: DueSegmentation[];
}