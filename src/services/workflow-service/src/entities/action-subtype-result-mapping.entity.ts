import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ActionSubtype } from './action-subtype.entity';
import { ActionResult } from './action-result.entity';

/**
 * Action Subtype to Result Mapping entity - corresponds to workflow_service.action_subtype_result_mappings table
 */
@Entity('action_subtype_result_mappings', { schema: 'workflow_service' })
@Unique(['actionSubtypeId', 'actionResultId'])
export class ActionSubtypeResultMapping extends BaseEntity {
  @Column({ name: 'action_subtype_id' })
  @Index()
  actionSubtypeId: string;

  @Column({ name: 'action_result_id' })
  @Index()
  actionResultId: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @ManyToOne(() => ActionSubtype, actionSubtype => actionSubtype.resultMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_subtype_id' })
  actionSubtype: ActionSubtype;

  @ManyToOne(() => ActionResult, actionResult => actionResult.subtypeMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_result_id' })
  actionResult: ActionResult;
}