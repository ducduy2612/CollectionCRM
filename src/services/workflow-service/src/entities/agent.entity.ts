import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Agent types enum
 */
export enum AgentType {
  AGENT = 'AGENT',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

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

  @Column({
    type: 'enum',
    enum: AgentType,
    default: AgentType.AGENT
  })
  @Index()
  type: AgentType;

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