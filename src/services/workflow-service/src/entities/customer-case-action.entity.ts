import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { 
  CustomerStatus, 
  CollateralStatus, 
  ProcessingStateStatus, 
  LendingViolationStatus, 
  RecoveryAbilityStatus 
} from './customer-case.entity';

/**
 * CustomerCaseAction entity - Stores actions and status inputs from agents at the customer level
 */
@Entity('customer_case_actions', { schema: 'workflow_service' })
export class CustomerCaseAction extends BaseEntity {
  @Column()
  @Index()
  cif: string;

  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ name: 'action_date', type: 'timestamp' })
  @Index()
  actionDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    name: 'customer_status',
    type: 'enum',
    enum: CustomerStatus,
    nullable: true
  })
  customerStatus: CustomerStatus | null;

  @Column({
    name: 'collateral_status',
    type: 'enum',
    enum: CollateralStatus,
    nullable: true
  })
  collateralStatus: CollateralStatus | null;

  @Column({
    name: 'processing_state_status',
    type: 'enum',
    enum: ProcessingStateStatus,
    nullable: true
  })
  processingStateStatus: ProcessingStateStatus | null;

  @Column({
    name: 'lending_violation_status',
    type: 'enum',
    enum: LendingViolationStatus,
    nullable: true
  })
  lendingViolationStatus: LendingViolationStatus | null;

  @Column({
    name: 'recovery_ability_status',
    type: 'enum',
    enum: RecoveryAbilityStatus,
    nullable: true
  })
  recoveryAbilityStatus: RecoveryAbilityStatus | null;
}