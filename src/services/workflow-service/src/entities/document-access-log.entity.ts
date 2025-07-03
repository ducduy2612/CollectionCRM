import { Entity, Column, ManyToOne, JoinColumn, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Document } from './document.entity';
import { Agent } from './agent.entity';

@Entity('document_access_logs', { schema: 'workflow_service' })
@Index('idx_access_logs_document', ['documentId'])
@Index('idx_access_logs_agent', ['agentId'])
@Index('idx_access_logs_action', ['action'])
@Index('idx_access_logs_created', ['createdAt'])
export class DocumentAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @Column({ type: 'uuid', name: 'document_id' })
  documentId: string;

  @ManyToOne(() => Document, (document) => document.accessLogs)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ type: 'uuid', name: 'agent_id' })
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agent_id' })
  agent: Agent;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}