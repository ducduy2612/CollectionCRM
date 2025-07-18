import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { SynchronizedEntity } from './base.entity';
import { Customer } from './customer.entity';
import { Phone } from './phone.entity';
import { Email } from './email.entity';
import { Address } from './address.entity';
import { CustomerType, Gender } from './customer-types';

/**
 * Relationship type enum
 */
export enum RelationshipType {
  SPOUSE = 'SPOUSE',
  GUARANTOR = 'GUARANTOR',
  EMPLOYER = 'EMPLOYER',
  EMPLOYEE = 'EMPLOYEE',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  SIBLING = 'SIBLING',
  BUSINESS_PARTNER = 'BUSINESS_PARTNER',
  OTHER = 'OTHER'
}

/**
 * Reference Customer entity
 * Represents customers who are related to a primary customer
 */
@Entity('reference_customers')
export class ReferenceCustomer extends SynchronizedEntity {
  @Column({ name: 'ref_cif', unique: true })
  @Index()
  refCif: string;

  @ManyToOne(() => Customer, customer => customer.referenceCustomers)
  @JoinColumn({ name: 'primary_cif', referencedColumnName: 'cif' })
  @Index()
  primaryCustomer: Customer;

  @Column({ name: 'primary_cif' })
  @Index()
  primaryCif: string;

  @Column({
    name: 'relationship_type',
    type: 'enum',
    enum: RelationshipType
  })
  relationshipType: RelationshipType;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.INDIVIDUAL
  })
  type: CustomerType;

  @Column({ nullable: true })
  name: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'national_id', nullable: true })
  @Index()
  nationalId: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true
  })
  gender: Gender;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'registration_number', nullable: true })
  @Index()
  registrationNumber: string;

  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  // Relations with contact information using refCif
  @OneToMany(() => Phone, phone => phone.referenceCustomer, { cascade: true })
  phones: Phone[];

  @OneToMany(() => Email, email => email.referenceCustomer, { cascade: true })
  emails: Email[];

  @OneToMany(() => Address, address => address.referenceCustomer, { cascade: true })
  addresses: Address[];
}