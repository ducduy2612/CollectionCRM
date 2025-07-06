import { Entity, Column, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ReferenceCustomer } from './reference-customer.entity';

/**
 * Phone entity
 */
@Entity('phones', { schema: 'workflow_service' })
@Unique(['cif', 'refCif', 'type'])
export class Phone extends BaseEntity {
  @Column({ length: 20 })
  @Index()
  cif: string;

  @Column({ name: 'ref_cif', length: 20, nullable: true })
  @Index()
  refCif?: string;

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

  @ManyToOne(() => ReferenceCustomer, referenceCustomer => referenceCustomer.phones, { nullable: true })
  @JoinColumn({ name: 'ref_cif', referencedColumnName: 'refCif' })
  referenceCustomer?: ReferenceCustomer;
}