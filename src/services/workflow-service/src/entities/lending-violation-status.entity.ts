import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { LendingViolationStatusDict } from './lending-violation-status-dict.entity';

/**
 * Lending Violation Status Entity
 * Stores lending violation status updates from agents
 */
@Entity({ name: 'lending_violation_status', schema: 'workflow_service' })
export class LendingViolationStatus extends BaseEntity {
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

  @ManyToOne(() => LendingViolationStatusDict)
  @JoinColumn({ name: 'status_id' })
  status: LendingViolationStatusDict;
}