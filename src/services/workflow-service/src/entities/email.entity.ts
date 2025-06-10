import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Email entity
 */
@Entity('emails', { schema: 'workflow_service' })
@Unique(['cif', 'address'])
export class Email extends BaseEntity {
  @Column({ length: 20 })
  @Index()
  cif: string;

  @Column({ length: 100 })
  address: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', nullable: true })
  verificationDate: Date;
}