import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { ReferenceCustomer } from './reference-customer.entity';

/**
 * Address entity for customer contact information
 */
@Entity('addresses')
export class Address extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ name: 'address_line1', type: 'varchar', length: 255 })
  addressLine1: string;

  @Column({ name: 'address_line2', type: 'varchar', length: 255, nullable: true })
  addressLine2: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_date', type: 'timestamp', nullable: true })
  verificationDate: Date;

  @ManyToOne(() => Customer, customer => customer.addresses, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'cif', referencedColumnName: 'cif' })
  @Index()
  customer?: Customer;

  @ManyToOne(() => ReferenceCustomer, referenceCustomer => referenceCustomer.addresses, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'ref_cif', referencedColumnName: 'refCif' })
  referenceCustomer?: ReferenceCustomer;

  @Column({ name: 'cif' })
  cif: string;

  @Column({ name: 'ref_cif', nullable: true })
  @Index()
  refCif?: string;
}