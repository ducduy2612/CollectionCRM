import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CustomerStatus } from './customer-status.entity';

/**
 * Customer Status Dictionary Entity
 * Stores customizable customer status values manageable from frontend
 */
@Entity({ name: 'customer_status_dict', schema: 'workflow_service' })
export class CustomerStatusDict extends BaseEntity {
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
  @OneToMany(() => CustomerStatus, customerStatus => customerStatus.status)
  customerStatuses: CustomerStatus[];
}