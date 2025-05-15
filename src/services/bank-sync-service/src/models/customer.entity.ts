import { Entity, Column, OneToMany, Index } from 'typeorm';
import { SynchronizedEntity } from './base.entity';
import { Phone } from './phone.entity';
import { Address } from './address.entity';
import { Email } from './email.entity';
import { Loan } from './loan.entity';
import { Collateral } from './collateral.entity';
import { ReferenceCustomer } from './reference-customer.entity';

/**
 * Customer types enum
 */
export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION'
}

/**
 * Customer status enum
 */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/**
 * Gender enum
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

/**
 * Customer entity
 */
@Entity('customers')
export class Customer extends SynchronizedEntity {
  @Column({ unique: true })
  @Index()
  cif: string;

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

  @Column({ nullable: true })
  segment: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE
  })
  status: CustomerStatus;

  // Relationships
  @OneToMany(() => Phone, phone => phone.customer, { cascade: true })
  phones: Phone[];

  @OneToMany(() => Address, address => address.customer, { cascade: true })
  addresses: Address[];

  @OneToMany(() => Email, email => email.customer, { cascade: true })
  emails: Email[];

  @OneToMany(() => Loan, loan => loan.customer)
  loans: Loan[];

  @OneToMany(() => Collateral, collateral => collateral.customer)
  collaterals: Collateral[];

  @OneToMany(() => ReferenceCustomer, ref => ref.primaryCustomer)
  referenceCustomers: ReferenceCustomer[];
}