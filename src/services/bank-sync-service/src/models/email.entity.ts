import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';

/**
 * Email entity for customer contact information
 */
@Entity('emails')
export class Email extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate: Date;

  @ManyToOne(() => Customer, customer => customer.emails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  @Index()
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: string;
}