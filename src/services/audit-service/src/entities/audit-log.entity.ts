import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs', { schema: 'audit_service' })
@Index('idx_audit_logs_event_type', ['eventType'])
@Index('idx_audit_logs_user_id', ['userId'])
@Index('idx_audit_logs_agent_id', ['agentId'])
@Index('idx_audit_logs_entity_type', ['entityType'])
@Index('idx_audit_logs_entity_id', ['entityId'])
@Index('idx_audit_logs_timestamp', ['timestamp'])
@Index('idx_audit_logs_service_name', ['serviceName'])
@Index('idx_audit_logs_action', ['action'])
@Index('idx_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'event_id' })
  eventId: string;

  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType: string;

  @Column({ type: 'varchar', length: 50, name: 'service_name' })
  serviceName: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', name: 'agent_id', nullable: true })
  agentId?: string;

  @Column({ type: 'varchar', length: 50, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'varchar', length: 255, name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'timestamp with time zone' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 45, name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}