import { Entity, Column, Index, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Phone } from './phone.entity';
import { Address } from './address.entity';
import { Email } from './email.entity';

/**
 * Customer types enum
 */
export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATE = 'CORPORATE'
}

/**
 * Reference Customer entity
 */
@Entity('reference_customers', { schema: 'workflow_service' })
export class ReferenceCustomer extends BaseEntity {
  @Column({ name: 'ref_cif', length: 20 })
  refCif: string;

  @Column({ name: 'primary_cif', length: 20 })
  @Index()
  primaryCif: string;

  @Column({ name: 'relationship_type', length: 30 })
  relationshipType: string;

  @Column({
    type: 'enum',
    enum: CustomerType
  })
  type: CustomerType;

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'national_id', length: 20, nullable: true })
  nationalId: string;

  @Column({ length: 10, nullable: true })
  gender: string;

  @Column({ name: 'company_name', length: 100, nullable: true })
  companyName: string;

  @Column({ name: 'registration_number', length: 20, nullable: true })
  registrationNumber: string;

  @Column({ name: 'tax_id', length: 20, nullable: true })
  taxId: string;

  // Relations - join with contact information using refCif
  @OneToMany(() => Phone, phone => phone.cif, { eager: false })
  @JoinColumn({ name: 'ref_cif', referencedColumnName: 'cif' })
  phones: Phone[];

  @OneToMany(() => Address, address => address.cif, { eager: false })
  @JoinColumn({ name: 'ref_cif', referencedColumnName: 'cif' })
  addresses: Address[];

  @OneToMany(() => Email, email => email.cif, { eager: false })
  @JoinColumn({ name: 'ref_cif', referencedColumnName: 'cif' })
  emails: Email[];
}