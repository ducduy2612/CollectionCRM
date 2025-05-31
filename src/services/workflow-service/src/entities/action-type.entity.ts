import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ActionTypeSubtypeMapping } from './action-type-subtype-mapping.entity';

/**
 * Action Type entity - corresponds to workflow_service.action_types table
 */
@Entity('action_types', { schema: 'workflow_service' })
export class ActionType extends BaseEntity {
  @Column({ unique: true, length: 50 })
  @Index()
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'display_order', default: 0 })
  @Index()
  displayOrder: number;

  @OneToMany(() => ActionTypeSubtypeMapping, mapping => mapping.actionType)
  subtypeMappings: ActionTypeSubtypeMapping[];
}