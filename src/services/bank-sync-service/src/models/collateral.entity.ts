import { Entity, Column, ManyToOne, JoinColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { SynchronizedEntity } from './base.entity';
import { Customer } from './customer.entity';
import { Loan } from './loan.entity';

/**
 * Collateral type enum
 */
export enum CollateralType {
  REAL_ESTATE = 'REAL_ESTATE',
  VEHICLE = 'VEHICLE',
  CASH_DEPOSIT = 'CASH_DEPOSIT',
  SECURITIES = 'SECURITIES',
  EQUIPMENT = 'EQUIPMENT',
  INVENTORY = 'INVENTORY',
  RECEIVABLES = 'RECEIVABLES',
  OTHER = 'OTHER'
}

/**
 * Property type enum for real estate collaterals
 */
export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  LAND = 'LAND',
  MIXED_USE = 'MIXED_USE',
  OTHER = 'OTHER'
}

/**
 * Collateral entity
 */
@Entity('collaterals')
export class Collateral extends SynchronizedEntity {
  @Column({ name: 'collateral_number', unique: true })
  @Index()
  collateralNumber: string;

  @ManyToOne(() => Customer, customer => customer.collaterals)
  @JoinColumn({ name: 'cif', referencedColumnName: 'cif' })
  @Index()
  customer: Customer;

  @Column({ name: 'cif' })
  @Index()
  cif: string;

  @Column({
    type: 'enum',
    enum: CollateralType
  })
  type: CollateralType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  value: number;

  @Column({ name: 'valuation_date', type: 'date' })
  valuationDate: Date;

  // Vehicle specific fields
  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  vin: string;

  @Column({ name: 'license_plate', nullable: true })
  licensePlate: string;

  // Real estate specific fields
  @Column({
    name: 'property_type',
    type: 'enum',
    enum: PropertyType,
    nullable: true
  })
  propertyType: PropertyType;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  size: number;

  @Column({ name: 'title_number', nullable: true })
  titleNumber: string;

  // Many-to-many relationship with loans
  @ManyToMany(() => Loan)
  @JoinTable({
    name: 'loan_collaterals',
    joinColumn: {
      name: 'collateral_number',
      referencedColumnName: 'collateralNumber'
    },
    inverseJoinColumn: {
      name: 'loan_account_number',
      referencedColumnName: 'accountNumber'
    }
  })
  associatedLoans: Loan[];
}