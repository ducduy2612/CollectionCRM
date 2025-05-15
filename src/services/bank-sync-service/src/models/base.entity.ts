import { 
  CreateDateColumn, 
  UpdateDateColumn, 
  Column, 
  PrimaryGeneratedColumn 
} from 'typeorm';

/**
 * Base entity with common fields for all entities
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;
}

/**
 * Base entity for entities that are synchronized from external systems
 */
export abstract class SynchronizedEntity extends BaseEntity {
  @Column({ name: 'source_system', nullable: true })
  sourceSystem: string;

  @Column({ name: 'last_synced_at', type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ name: 'is_editable', default: false })
  isEditable: boolean;
}