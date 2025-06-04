import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RecoveryAbilityStatus } from './recovery-ability-status.entity';

/**
 * Recovery Ability Status Dictionary Entity
 * Stores customizable recovery ability status values manageable from frontend
 */
@Entity({ name: 'recovery_ability_status_dict', schema: 'workflow_service' })
export class RecoveryAbilityStatusDict extends BaseEntity {
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
  @OneToMany(() => RecoveryAbilityStatus, recoveryAbilityStatus => recoveryAbilityStatus.status)
  recoveryAbilityStatuses: RecoveryAbilityStatus[];
}