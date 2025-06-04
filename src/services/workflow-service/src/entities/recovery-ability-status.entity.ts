import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { RecoveryAbilityStatusDict } from './recovery-ability-status-dict.entity';

/**
 * Recovery Ability Status Entity
 * Stores recovery ability status updates from agents
 */
@Entity({ name: 'recovery_ability_status', schema: 'workflow_service' })
export class RecoveryAbilityStatus extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  cif: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @Column({ name: 'action_date', type: 'timestamp' })
  actionDate: Date;

  @Column({ name: 'status_id', type: 'uuid' })
  statusId: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @ManyToOne(() => RecoveryAbilityStatusDict)
  @JoinColumn({ name: 'status_id' })
  status: RecoveryAbilityStatusDict;
}