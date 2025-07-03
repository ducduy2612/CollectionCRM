import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Agent } from './agent.entity';
import { DocumentAccessLog } from './document-access-log.entity';

@Entity('documents', { schema: 'workflow_service' })
@Index('idx_documents_cif', ['cif'])
@Index('idx_documents_loan', ['loanAccountNumber'])
@Index('idx_documents_type', ['documentType'])
@Index('idx_documents_category', ['documentCategory'])
@Index('idx_documents_status', ['status'])
@Index('idx_documents_created_at', ['createdAt'])
export class Document extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  cif: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  loanAccountNumber?: string;

  @Column({ type: 'varchar', length: 50 })
  documentType: string;

  @Column({ type: 'varchar', length: 50 })
  documentCategory: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  originalFileName: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'varchar', length: 500 })
  storagePath: string;

  @Column({ type: 'varchar', length: 100 })
  storageBucket: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'uuid' })
  uploadedBy: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByAgent: Agent;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  @OneToMany(() => DocumentAccessLog, (log) => log.document)
  accessLogs: DocumentAccessLog[];
}