import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

/**
 * CustomerAgent entity - Stores the assignment of customers to agents with historical tracking (SCD Type 2)
 */
@Entity('customer_agents', { schema: 'workflow_service' })
export class CustomerAgent extends BaseEntity {
  @Column()
  @Index()
  cif: string;

  @Column({ name: 'assigned_call_agent_id', nullable: true })
  @Index()
  assignedCallAgentId: string | null;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'assigned_call_agent_id' })
  assignedCallAgent: Agent | null;

  @Column({ name: 'assigned_field_agent_id', nullable: true })
  @Index()
  assignedFieldAgentId: string | null;

  @ManyToOne(() => Agent, { nullable: true })
  @JoinColumn({ name: 'assigned_field_agent_id' })
  assignedFieldAgent: Agent | null;

  @Column({ name: 'start_date', type: 'date' })
  @Index()
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'is_current', default: true })
  @Index()
  isCurrent: boolean;
}