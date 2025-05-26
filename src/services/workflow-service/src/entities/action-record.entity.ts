import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';

/**
 * Action types enum
 */
export enum ActionType {
  CALL = 'CALL',
  VISIT = 'VISIT',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  LETTER = 'LETTER'
}

/**
 * Action subtypes enum
 */
export enum ActionSubtype {
  REMINDER_CALL = 'REMINDER_CALL',
  FOLLOW_UP_CALL = 'FOLLOW_UP_CALL',
  FIELD_VISIT = 'FIELD_VISIT',
  COURTESY_CALL = 'COURTESY_CALL'
}

/**
 * Action result enum
 */
export enum ActionResult {
  PROMISE_TO_PAY = 'PROMISE_TO_PAY',
  PAYMENT_MADE = 'PAYMENT_MADE',
  NO_CONTACT = 'NO_CONTACT',
  REFUSED_TO_PAY = 'REFUSED_TO_PAY',
  DISPUTE = 'DISPUTE'
}

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

  @Column({
    type: 'enum',
    enum: ActionType
  })
  @Index()
  type: ActionType;

  @Column({
    type: 'enum',
    enum: ActionSubtype
  })
  subtype: ActionSubtype;

  @Column({
    name: 'action_result',
    type: 'enum',
    enum: ActionResult
  })
  @Index()
  actionResult: ActionResult;

  @Column({ name: 'action_date', type: 'timestamp' })
  @Index()
  actionDate: Date;

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