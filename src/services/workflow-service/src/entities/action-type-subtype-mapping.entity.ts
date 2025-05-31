import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ActionType } from './action-type.entity';
import { ActionSubtype } from './action-subtype.entity';

/**
 * Action Type to Subtype Mapping entity - corresponds to workflow_service.action_type_subtype_mappings table
 */
@Entity('action_type_subtype_mappings', { schema: 'workflow_service' })
@Unique(['actionTypeId', 'actionSubtypeId'])
export class ActionTypeSubtypeMapping extends BaseEntity {
  @Column({ name: 'action_type_id' })
  @Index()
  actionTypeId: string;

  @Column({ name: 'action_subtype_id' })
  @Index()
  actionSubtypeId: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @ManyToOne(() => ActionType, actionType => actionType.subtypeMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_type_id' })
  actionType: ActionType;

  @ManyToOne(() => ActionSubtype, actionSubtype => actionSubtype.typeMappings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'action_subtype_id' })
  actionSubtype: ActionSubtype;
}