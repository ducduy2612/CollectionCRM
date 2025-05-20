import { Repository } from 'typeorm';
import { SynchronizedEntity } from '../models/base.entity';
import { SourceSystemType } from '../models/sync-status.entity';
import { AppDataSource } from '../config/data-source';

/**
 * Interface for repositories that handle synchronized entities
 */
export interface SyncEntityRepository<T extends SynchronizedEntity> {
  /**
   * Find an entity by its natural key
   * @param naturalKey The natural key value
   * @returns The entity if found, undefined otherwise
   */
  findByNaturalKey(naturalKey: string): Promise<T | undefined>;

  /**
   * Upsert an entity by its natural key
   * @param entity The entity to upsert
   * @returns The upserted entity
   */
  upsertByNaturalKey(entity: T): Promise<T>;

  /**
   * Find entities by source system
   * @param source The source system
   * @returns Array of entities from the specified source system
   */
  findBySourceSystem(source: SourceSystemType): Promise<T[]>;

  /**
   * Find stale records that haven't been updated since the specified date
   * @param olderThan Date threshold for stale records
   * @returns Array of stale entities
   */
  findStaleRecords(olderThan: Date): Promise<T[]>;
}

/**
 * Interface for paginated results
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * Base pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Base repository functions with common functionality for all repositories
 */
export const createBaseSyncRepository = <T extends SynchronizedEntity>(entityClass: new () => T) => {
  return {
    /**
     * Find entities by source system
     * @param source The source system
     * @returns Array of entities from the specified source system
     */
    async findBySourceSystem(source: SourceSystemType): Promise<T[]> {
      return AppDataSource.getRepository(entityClass)
        .createQueryBuilder()
        .where('source_system = :source', { source })
        .getMany();
    },

    /**
     * Find stale records that haven't been updated since the specified date
     * @param olderThan Date threshold for stale records
     * @returns Array of stale entities
     */
    async findStaleRecords(olderThan: Date): Promise<T[]> {
      return AppDataSource.getRepository(entityClass)
        .createQueryBuilder()
        .where('last_synced_at < :olderThan OR last_synced_at IS NULL', { olderThan })
        .getMany();
    },

    /**
     * Apply pagination to a query
     * @param query The query builder
     * @param options Pagination options
     * @returns The query builder with pagination applied
     */
    applyPagination(query: any, options: PaginationOptions) {
      const page = options.page || 1;
      const pageSize = Math.min(options.pageSize || 10, 100); // Max page size of 100
      
      return query
        .skip((page - 1) * pageSize)
        .take(pageSize);
    },

    /**
     * Create a paginated result
     * @param items The items for the current page
     * @param total The total number of items
     * @param options Pagination options
     * @returns A paginated result object
     */
    createPaginatedResult<R>(items: R[], total: number, options: PaginationOptions): PaginatedResult<R> {
      const page = options.page || 1;
      const pageSize = Math.min(options.pageSize || 10, 100);
      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalItems: total
        }
      };
    }
  };
};