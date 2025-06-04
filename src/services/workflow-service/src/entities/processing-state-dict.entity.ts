import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProcessingStateStatus } from './processing-state-status.entity';
import { ProcessingStateSubstateMapping } from './processing-state-substate-mapping.entity';

/**
 * Processing State Dictionary Entity
 * Stores customizable processing state values manageable from frontend
 */
@Entity({ name: 'processing_state_dict', schema: 'workflow_service' })
export class ProcessingStateDict extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 7, nullable: true, comment: 'Hex color code for UI' })
  color?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  // Relations
  @OneToMany(() => ProcessingStateStatus, processingStateStatus => processingStateStatus.state)
  processingStateStatuses: ProcessingStateStatus[];

  @OneToMany(() => ProcessingStateSubstateMapping, mapping => mapping.state)
  substatesMappings: ProcessingStateSubstateMapping[];
}