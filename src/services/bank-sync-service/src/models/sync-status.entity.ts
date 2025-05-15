import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Sync status enum
 */
export enum SyncStatusType {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED'
}

/**
 * Entity type enum
 */
export enum EntityType {
  CUSTOMER = 'CUSTOMER',
  LOAN = 'LOAN',
  COLLATERAL = 'COLLATERAL',
  REFERENCE_CUSTOMER = 'REFERENCE_CUSTOMER'
}

/**
 * Source system enum
 */
export enum SourceSystemType {
  T24 = 'T24',
  W4 = 'W4',
  OTHER = 'OTHER'
}

/**
 * Sync Status entity
 * Tracks the status of synchronization operations
 */
@Entity('sync_status')
export class SyncStatus extends BaseEntity {
  @Column({ name: 'sync_id', unique: true })
  @Index()
  syncId: string;

  @Column({
    name: 'source_system',
    type: 'enum',
    enum: SourceSystemType
  })
  @Index()
  sourceSystem: SourceSystemType;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EntityType
  })
  @Index()
  entityType: EntityType;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: SyncStatusType,
    default: SyncStatusType.INITIATED
  })
  status: SyncStatusType;

  @Column({ name: 'records_processed', default: 0 })
  recordsProcessed: number;

  @Column({ name: 'records_succeeded', default: 0 })
  recordsSucceeded: number;

  @Column({ name: 'records_failed', default: 0 })
  recordsFailed: number;

  @Column({ name: 'last_synced_at', type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ name: 'error_details', type: 'text', nullable: true })
  errorDetails: string;

  @Column({ name: 'sync_options', type: 'jsonb', nullable: true })
  syncOptions: Record<string, any>;
}