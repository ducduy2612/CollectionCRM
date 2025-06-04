import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CollateralStatus } from './collateral-status.entity';

/**
 * Collateral Status Dictionary Entity
 * Stores customizable collateral status values manageable from frontend
 */
@Entity({ name: 'collateral_status_dict', schema: 'workflow_service' })
export class CollateralStatusDict extends BaseEntity {
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
  @OneToMany(() => CollateralStatus, collateralStatus => collateralStatus.status)
  collateralStatuses: CollateralStatus[];
}