import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Agent entity
 */
@Entity('agents', { schema: 'workflow_service' })
export class Agent extends BaseEntity {
  @Column({ name: 'employee_id', unique: true })
  @Index()
  employeeId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  @Index()
  type: string;

  @Column()
  @Index()
  team: string;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string;
}