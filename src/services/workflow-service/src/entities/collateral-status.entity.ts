import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { CollateralStatusDict } from './collateral-status-dict.entity';

/**
 * Collateral Status Entity
 * Stores collateral status updates from agents - linked to specific collaterals
 */
@Entity({ name: 'collateral_status', schema: 'workflow_service' })
export class CollateralStatus extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  cif: string;

  @Column({ name: 'collateral_number', type: 'varchar', length: 20  })
  collateralNumber?: string;

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

  @ManyToOne(() => CollateralStatusDict)
  @JoinColumn({ name: 'status_id' })
  status: CollateralStatusDict;
}