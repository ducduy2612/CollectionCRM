import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Document } from './document.entity';
import { Agent } from './agent.entity';

@Entity('document_access_logs', { schema: 'workflow_service' })
@Index('idx_access_logs_document', ['documentId'])
@Index('idx_access_logs_agent', ['agentId'])
@Index('idx_access_logs_action', ['action'])
@Index('idx_access_logs_created', ['createdAt'])
export class DocumentAccessLog extends BaseEntity {
  @Column({ type: 'uuid' })
  documentId: string;

  @ManyToOne(() => Document, (document) => document.accessLogs)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ type: 'uuid' })
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}