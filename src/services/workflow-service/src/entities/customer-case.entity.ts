import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

/**
 * CustomerCase entity - Stores the current status of customers for strategy allocation
 */
@Entity('customer_cases', { schema: 'workflow_service' })
export class CustomerCase extends BaseEntity {
  @Column({ unique: true })
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

  @Column({ name: 'f_update', type: 'timestamp', nullable: true })
  @Index()
  fUpdate: Date | null;

  @Column({ name: 'master_notes', type: 'text', nullable: true })
  masterNotes: string | null;
}