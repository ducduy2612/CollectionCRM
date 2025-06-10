import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Phone entity
 */
@Entity('phones', { schema: 'workflow_service' })
@Unique(['cif', 'type'])
export class Phone extends BaseEntity {
  @Column({ length: 20 })
  @Index()
  cif: string;

  @Column({ length: 20 })
  type: string;

  @Column({ length: 20 })
  number: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', nullable: true })
  verificationDate: Date;
}