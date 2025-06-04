import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { ProcessingStateDict } from './processing-state-dict.entity';
import { ProcessingSubstateDict } from './processing-substate-dict.entity';

/**
 * Processing State Status Entity
 * Stores processing state updates with state and substate
 */
@Entity({ name: 'processing_state_status', schema: 'workflow_service' })
export class ProcessingStateStatus extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  cif: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @Column({ name: 'action_date', type: 'timestamp' })
  actionDate: Date;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @Column({ name: 'substate_id', type: 'uuid', nullable: true })
  substateId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @ManyToOne(() => ProcessingStateDict)
  @JoinColumn({ name: 'state_id' })
  state: ProcessingStateDict;

  @ManyToOne(() => ProcessingSubstateDict)
  @JoinColumn({ name: 'substate_id' })
  substate?: ProcessingSubstateDict;
}