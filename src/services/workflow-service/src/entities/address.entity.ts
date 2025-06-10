import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Address entity
 */
@Entity('addresses', { schema: 'workflow_service' })
@Unique(['cif', 'type'])
export class Address extends BaseEntity {
  @Column({ length: 20 })
  @Index()
  cif: string;

  @Column({ length: 20 })
  type: string;

  @Column({ name: 'address_line1', length: 100 })
  addressLine1: string;

  @Column({ name: 'address_line2', length: 100, nullable: true })
  addressLine2: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 50 })
  state: string;

  @Column({ length: 50 })
  district: string;

  @Column({ length: 50 })
  country: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', nullable: true })
  verificationDate: Date;
}