import { Entity, Column, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ActionResult } from './action-result.entity';

export enum FudCalculationType {
  PROMISE_DATE = 'PROMISE_DATE',
  ACTION_DATE = 'ACTION_DATE'
}

@Entity({ schema: 'workflow_service', name: 'fud_auto_config' })
@Index('idx_fud_config_active', ['is_active'])
@Index('idx_fud_config_action_result', ['action_result_id'])
@Check('"calculation_type" IN (\'PROMISE_DATE\', \'ACTION_DATE\')')
export class FudAutoConfig extends BaseEntity {
  @Column({ type: 'uuid', name: 'action_result_id', unique: true })
  action_result_id: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'calculation_type',
    enum: FudCalculationType
  })
  calculation_type: FudCalculationType;

  @Column({ type: 'int', name: 'days_offset' })
  days_offset: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  is_active: boolean;

  @Column({ type: 'int', name: 'priority', default: 0 })
  priority: number;

  // Relations
  @ManyToOne(() => ActionResult, { eager: true })
  @JoinColumn({ name: 'action_result_id' })
  action_result: ActionResult;
}