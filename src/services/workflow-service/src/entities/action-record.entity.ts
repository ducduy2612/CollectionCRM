import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { ActionType } from './action-type.entity';
import { ActionSubtype } from './action-subtype.entity';
import { ActionResult } from './action-result.entity';

/**
 * Visit location interface
 */
export interface VisitLocation {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Action record entity
 */
@Entity('action_records', { schema: 'workflow_service' })
export class ActionRecord extends BaseEntity {
  @Column()
  @Index()
  cif: string;

  @Column({ name: 'loan_account_number' })
  @Index()
  loanAccountNumber: string;

  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ name: 'action_type_id' })
  @Index()
  actionTypeId: string;

  @Column({ name: 'action_subtype_id' })
  @Index()
  actionSubtypeId: string;

  @Column({ name: 'action_result_id' })
  @Index()
  actionResultId: string;

  @ManyToOne(() => ActionType)
  @JoinColumn({ name: 'action_type_id' })
  actionType: ActionType;

  @ManyToOne(() => ActionSubtype)
  @JoinColumn({ name: 'action_subtype_id' })
  actionSubtype: ActionSubtype;

  @ManyToOne(() => ActionResult)
  @JoinColumn({ name: 'action_result_id' })
  actionResult: ActionResult;

  @Column({ name: 'action_date', type: 'timestamp' })
  @Index()
  actionDate: Date;

  @Column({ name: 'f_update', type: 'timestamp', nullable: true })
  @Index()
  fUpdate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'call_trace_id', nullable: true })
  callTraceId: string;

  @Column({ name: 'visit_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  visitLatitude: number | null;

  @Column({ name: 'visit_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  visitLongitude: number | null;

  @Column({ name: 'visit_address', type: 'text', nullable: true })
  visitAddress: string | null;

  /**
   * Get visit location as an object
   */
  getVisitLocation(): VisitLocation | null {
    if (!this.visitLatitude || !this.visitLongitude) {
      return null;
    }

    return {
      latitude: this.visitLatitude,
      longitude: this.visitLongitude,
      address: this.visitAddress || ''
    };
  }

  /**
   * Set visit location from an object
   */
  setVisitLocation(location: VisitLocation | null): void {
    if (!location) {
      this.visitLatitude = null;
      this.visitLongitude = null;
      this.visitAddress = null;
      return;
    }

    this.visitLatitude = location.latitude;
    this.visitLongitude = location.longitude;
    this.visitAddress = location.address;
  }
}