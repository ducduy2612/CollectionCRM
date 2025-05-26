import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

/**
 * Customer status enum
 */
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COOPERATIVE = 'COOPERATIVE',
  UNCOOPERATIVE = 'UNCOOPERATIVE'
}

/**
 * Collateral status enum
 */
export enum CollateralStatus {
  SECURED = 'SECURED',
  UNSECURED = 'UNSECURED',
  PARTIAL = 'PARTIAL'
}

/**
 * Processing state status enum
 */
export enum ProcessingStateStatus {
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  ESCALATED = 'ESCALATED'
}

/**
 * Lending violation status enum
 */
export enum LendingViolationStatus {
  NONE = 'NONE',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL'
}

/**
 * Recovery ability status enum
 */
export enum RecoveryAbilityStatus {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE'
}

/**
 * CustomerCase entity - Stores the current status of customers for strategy allocation
 */
@Entity('customer_cases', { schema: 'workflow_service' })
export class CustomerCase extends BaseEntity {
  @Column({ unique: true })
  @Index()
  cif: string;

  @Column({ name: 'assigned_call_agent_id', nullable: true })
  @Index()
  assignedCallAgentId: string | null;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'assigned_call_agent_id' })
  assignedCallAgent: Agent | null;

  @Column({ name: 'assigned_field_agent_id', nullable: true })
  @Index()
  assignedFieldAgentId: string | null;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'assigned_field_agent_id' })
  assignedFieldAgent: Agent | null;

  @Column({ name: 'f_update', type: 'timestamp', nullable: true })
  @Index()
  fUpdate: Date | null;

  @Column({
    name: 'customer_status',
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE
  })
  @Index()
  customerStatus: CustomerStatus;

  @Column({
    name: 'collateral_status',
    type: 'enum',
    enum: CollateralStatus,
    default: CollateralStatus.UNSECURED
  })
  collateralStatus: CollateralStatus;

  @Column({
    name: 'processing_state_status',
    type: 'enum',
    enum: ProcessingStateStatus,
    default: ProcessingStateStatus.IN_PROCESS
  })
  @Index()
  processingStateStatus: ProcessingStateStatus;

  @Column({
    name: 'lending_violation_status',
    type: 'enum',
    enum: LendingViolationStatus,
    default: LendingViolationStatus.NONE
  })
  lendingViolationStatus: LendingViolationStatus;

  @Column({
    name: 'recovery_ability_status',
    type: 'enum',
    enum: RecoveryAbilityStatus,
    default: RecoveryAbilityStatus.MEDIUM
  })
  @Index()
  recoveryAbilityStatus: RecoveryAbilityStatus;
}