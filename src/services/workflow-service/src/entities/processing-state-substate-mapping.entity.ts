import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProcessingStateDict } from './processing-state-dict.entity';
import { ProcessingSubstateDict } from './processing-substate-dict.entity';

/**
 * Processing State Substate Mapping Entity
 * Maps processing states to their allowed substates
 */
@Entity({ name: 'processing_state_substate_mappings', schema: 'workflow_service' })
@Unique(['stateId', 'substateId'])
export class ProcessingStateSubstateMapping extends BaseEntity {
  @Column({ name: 'state_id', type: 'uuid' })
  stateId: string;

  @Column({ name: 'substate_id', type: 'uuid' })
  substateId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => ProcessingStateDict, state => state.substatesMappings)
  @JoinColumn({ name: 'state_id' })
  state: ProcessingStateDict;

  @ManyToOne(() => ProcessingSubstateDict, substate => substate.statesMappings)
  @JoinColumn({ name: 'substate_id' })
  substate: ProcessingSubstateDict;
}