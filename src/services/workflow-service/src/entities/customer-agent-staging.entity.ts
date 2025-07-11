import { Entity, Column, Index, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Staging table for bulk customer agent assignment operations
 * This table is used to load and validate large CSV files before processing
 */
@Entity('customer_agent_staging', { schema: 'workflow_service' })
export class CustomerAgentStaging {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50 })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 50 })
  updatedBy: string;

  @Column({ name: 'batch_id', type: 'uuid' })
  @Index()
  batchId: string;

  @Column({ name: 'line_number', type: 'integer' })
  @Index()
  lineNumber: number;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  cif: string;

  @Column({ name: 'assigned_call_agent_name', type: 'varchar', length: 100, nullable: true })
  assignedCallAgentName: string | null;

  @Column({ name: 'assigned_field_agent_name', type: 'varchar', length: 100, nullable: true })
  assignedFieldAgentName: string | null;

  @Column({ name: 'assigned_call_agent_id', type: 'uuid', nullable: true })
  assignedCallAgentId: string | null;

  @Column({ name: 'assigned_field_agent_id', type: 'uuid', nullable: true })
  assignedFieldAgentId: string | null;

  @Column({ name: 'validation_status', type: 'varchar', length: 20, default: 'pending' })
  @Index()
  validationStatus: 'pending' | 'valid' | 'invalid' | 'skipped';

  @Column({ name: 'validation_errors', type: 'text', nullable: true })
  validationErrors: string | null;

  @Column({ name: 'processing_status', type: 'varchar', length: 20, default: 'pending' })
  @Index()
  processingStatus: 'pending' | 'processed' | 'failed' | 'skipped';

  @Column({ name: 'processing_errors', type: 'text', nullable: true })
  processingErrors: string | null;
}