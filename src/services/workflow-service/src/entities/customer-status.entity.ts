import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { CustomerStatusDict } from './customer-status-dict.entity';

/**
 * Customer Status Entity
 * Stores customer status updates from agents
 */
@Entity({ name: 'customer_status', schema: 'workflow_service' })
export class CustomerStatus extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  cif: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @Column({ name: 'action_date', type: 'timestamp' })
  actionDate: Date;

  @Column({ name: 'status_id', type: 'uuid' })
  statusId: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @ManyToOne(() => CustomerStatusDict)
  @JoinColumn({ name: 'status_id' })
  status: CustomerStatusDict;
}