import { EntityRepository, Repository } from 'typeorm';
import { SyncStatus, SyncStatusType, EntityType, SourceSystemType } from '../models/sync-status.entity';
import { PaginatedResult, PaginationOptions } from './sync-entity.repository';

/**
 * Search criteria for sync status
 */
export interface SyncStatusCriteria extends PaginationOptions {
  sourceSystem?: SourceSystemType;
  entityType?: EntityType;
  status?: SyncStatusType;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Repository for SyncStatus entity
 * Note: SyncStatus extends BaseEntity, not SynchronizedEntity, so it doesn't implement SyncEntityRepository
 */
@EntityRepository(SyncStatus)
export class SyncStatusRepository extends Repository<SyncStatus> {
  /**
   * Find a sync status by sync ID
   * @param syncId Sync ID
   * @returns The sync status if found, undefined otherwise
   */
  async findBySyncId(syncId: string): Promise<SyncStatus | undefined> {
    try {
      const result = await this.findOne({ where: { syncId } });
      return result || undefined;
    } catch (error) {
      console.error(`Error finding sync status by ID ${syncId}:`, error);
      throw new Error(`Failed to find sync status by ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a new sync status
   * @param syncStatus The sync status to create
   * @returns The created sync status
   */
  async createSyncStatus(syncStatus: SyncStatus): Promise<SyncStatus> {
    try {
      return await this.save(syncStatus);
    } catch (error) {
      console.error(`Error creating sync status:`, error);
      throw new Error(`Failed to create sync status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a sync status
   * @param syncId Sync ID
   * @param updates Partial sync status with updates
   * @returns The updated sync status
   */
  async updateSyncStatus(syncId: string, updates: Partial<SyncStatus>): Promise<SyncStatus | undefined> {
    try {
      const syncStatus = await this.findBySyncId(syncId);
      
      if (!syncStatus) {
        return undefined;
      }
      
      const mergedSyncStatus = this.merge(syncStatus, updates);
      return await this.save(mergedSyncStatus);
    } catch (error) {
      console.error(`Error updating sync status with ID ${syncId}:`, error);
      throw new Error(`Failed to update sync status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search sync status records based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of sync status records
   */
  async searchSyncStatus(criteria?: SyncStatusCriteria): Promise<PaginatedResult<SyncStatus>> {
    try {
      const queryBuilder = this.createQueryBuilder('syncStatus');
      
      // Apply filters
      if (criteria?.sourceSystem) {
        queryBuilder.andWhere('syncStatus.source_system = :sourceSystem', { sourceSystem: criteria.sourceSystem });
      }
      
      if (criteria?.entityType) {
        queryBuilder.andWhere('syncStatus.entity_type = :entityType', { entityType: criteria.entityType });
      }
      
      if (criteria?.status) {
        queryBuilder.andWhere('syncStatus.status = :status', { status: criteria.status });
      }
      
      if (criteria?.startDate) {
        queryBuilder.andWhere('syncStatus.start_time >= :startDate', { startDate: criteria.startDate });
      }
      
      if (criteria?.endDate) {
        queryBuilder.andWhere('syncStatus.end_time <= :endDate', { endDate: criteria.endDate });
      }
      
      // Order by start time descending (most recent first)
      queryBuilder.orderBy('syncStatus.start_time', 'DESC');
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria?.page || 1;
      const pageSize = Math.min(criteria?.pageSize || 10, 100); // Max page size of 100
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize);
      
      // Get paginated results
      const syncStatusRecords = await queryBuilder.getMany();
      
      return {
        items: syncStatusRecords,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total
        }
      };
    } catch (error) {
      console.error('Error searching sync status records:', error);
      throw new Error(`Failed to search sync status records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the latest sync status for a specific entity type and source system
   * @param entityType Entity type
   * @param sourceSystem Source system
   * @returns The latest sync status if found, undefined otherwise
   */
  async getLatestSyncStatus(entityType: EntityType, sourceSystem: SourceSystemType): Promise<SyncStatus | undefined> {
    try {
      const result = await this.createQueryBuilder('syncStatus')
        .where('syncStatus.entity_type = :entityType', { entityType })
        .andWhere('syncStatus.source_system = :sourceSystem', { sourceSystem })
        .orderBy('syncStatus.start_time', 'DESC')
        .getOne();
      return result || undefined;
    } catch (error) {
      console.error(`Error getting latest sync status for ${entityType} from ${sourceSystem}:`, error);
      throw new Error(`Failed to get latest sync status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get sync status statistics
   * @param startDate Start date for the statistics
   * @param endDate End date for the statistics
   * @returns Statistics about sync operations
   */
  async getSyncStatistics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const stats = await this.createQueryBuilder('syncStatus')
        .select('syncStatus.entity_type', 'entityType')
        .addSelect('syncStatus.source_system', 'sourceSystem')
        .addSelect('COUNT(*)', 'totalSyncs')
        .addSelect('SUM(syncStatus.records_processed)', 'totalRecordsProcessed')
        .addSelect('SUM(syncStatus.records_succeeded)', 'totalRecordsSucceeded')
        .addSelect('SUM(syncStatus.records_failed)', 'totalRecordsFailed')
        .addSelect(`COUNT(CASE WHEN syncStatus.status = '${SyncStatusType.COMPLETED}' THEN 1 END)`, 'completedSyncs')
        .addSelect(`COUNT(CASE WHEN syncStatus.status = '${SyncStatusType.FAILED}' THEN 1 END)`, 'failedSyncs')
        .where('syncStatus.start_time BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('syncStatus.entity_type')
        .addGroupBy('syncStatus.source_system')
        .getRawMany();
      
      return stats;
    } catch (error) {
      console.error('Error getting sync statistics:', error);
      throw new Error(`Failed to get sync statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find in-progress sync operations
   * @returns Array of in-progress sync status records
   */
  async findInProgressSyncs(): Promise<SyncStatus[]> {
    try {
      return await this.createQueryBuilder('syncStatus')
        .where('syncStatus.status = :status', { status: SyncStatusType.IN_PROGRESS })
        .getMany();
    } catch (error) {
      console.error('Error finding in-progress syncs:', error);
      throw new Error(`Failed to find in-progress syncs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}