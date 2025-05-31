import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ActionSubtypeResultMapping } from './action-subtype-result-mapping.entity';

/**
 * Action Result entity - corresponds to workflow_service.action_results table
 */
@Entity('action_results', { schema: 'workflow_service' })
export class ActionResult extends BaseEntity {
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

  @OneToMany(() => ActionSubtypeResultMapping, mapping => mapping.actionResult)
  subtypeMappings: ActionSubtypeResultMapping[];
}