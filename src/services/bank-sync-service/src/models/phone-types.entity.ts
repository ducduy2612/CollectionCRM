import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('phone_types', { schema: 'bank_sync_service' })
export class PhoneType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  value: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @Column({ type: 'varchar', length: 50, default: 'SYSTEM' })
  created_by: string;

  @Column({ type: 'varchar', length: 50, default: 'SYSTEM' })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}