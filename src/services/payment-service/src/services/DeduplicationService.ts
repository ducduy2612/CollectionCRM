import { LRUCache } from 'lru-cache';
import { RedisClientType } from 'redis';
import { PaymentReferenceModel } from '@/models/PaymentReference';
import { Knex } from 'knex';
import pino from 'pino';

interface CacheStats {
  memory_hits: number;
  memory_misses: number;
  redis_hits: number;
  redis_misses: number;
  db_checks: number;
  total_checks: number;
}

export class DeduplicationService {
  private memoryCache: LRUCache<string, boolean>;
  private redisClient: RedisClientType;
  private paymentRefModel: PaymentReferenceModel;
  private logger: pino.Logger;
  private stats: CacheStats;
  private readonly REDIS_TTL_SECONDS: number;
  private readonly MEMORY_CACHE_SIZE: number;

  constructor(
    knex: Knex,
    redisClient: RedisClientType,
    logger: pino.Logger,
    config: {
      memoryCache: {
        maxSize: number;
      };
      redis: {
        ttlSeconds: number;
      };
    }
  ) {
    this.paymentRefModel = new PaymentReferenceModel(knex);
    this.redisClient = redisClient;
    this.logger = logger;
    this.REDIS_TTL_SECONDS = config.redis.ttlSeconds;
    this.MEMORY_CACHE_SIZE = config.memoryCache.maxSize;

    this.memoryCache = new LRUCache<string, boolean>({
      max: this.MEMORY_CACHE_SIZE,
      ttl: 1000 * 60 * 60, // 1 hour TTL for memory cache
    });

    this.stats = {
      memory_hits: 0,
      memory_misses: 0,
      redis_hits: 0,
      redis_misses: 0,
      db_checks: 0,
      total_checks: 0,
    };
  }

  async isDuplicate(reference_number: string): Promise<boolean> {
    this.stats.total_checks++;

    try {
      // Layer 1: Check in-memory cache
      if (this.memoryCache.has(reference_number)) {
        this.stats.memory_hits++;
        this.logger.debug({ reference_number }, 'Duplicate check: memory cache hit');
        return true;
      }
      this.stats.memory_misses++;

      // Layer 2: Check Redis cache
      const redisKey = `payment_ref:${reference_number}`;
      const redisResult = await this.redisClient.get(redisKey);
      
      if (redisResult !== null) {
        this.stats.redis_hits++;
        this.logger.debug({ reference_number }, 'Duplicate check: Redis cache hit');
        
        // Warm memory cache
        this.memoryCache.set(reference_number, true);
        return true;
      }
      this.stats.redis_misses++;

      // Layer 3: Check database
      this.stats.db_checks++;
      const exists = await this.paymentRefModel.exists(reference_number);
      
      this.logger.debug({ reference_number, exists }, 'Duplicate check: database result');

      if (exists) {
        // Cache in both layers
        await this.cacheReference(reference_number);
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error), 
        reference_number 
      }, 'Error during duplicate check');
      
      // On error, fallback to database check only
      try {
        return await this.paymentRefModel.exists(reference_number);
      } catch (dbError) {
        this.logger.error({ 
          error: dbError instanceof Error ? dbError.message : String(dbError), 
          reference_number 
        }, 'Database fallback also failed');
        
        // Conservative approach: assume it's not a duplicate on error
        return false;
      }
    }
  }

  async bulkCheckDuplicates(reference_numbers: string[]): Promise<string[]> {
    if (reference_numbers.length === 0) return [];

    const duplicates: string[] = [];
    const uncheckedRefs: string[] = [];

    // First pass: Check memory cache
    for (const ref of reference_numbers) {
      this.stats.total_checks++;
      
      if (this.memoryCache.has(ref)) {
        this.stats.memory_hits++;
        duplicates.push(ref);
      } else {
        this.stats.memory_misses++;
        uncheckedRefs.push(ref);
      }
    }

    if (uncheckedRefs.length === 0) {
      return duplicates;
    }

    try {
      // Second pass: Check Redis cache
      const redisKeys = uncheckedRefs.map(ref => `payment_ref:${ref}`);
      const redisResults = await this.redisClient.mGet(redisKeys);
      
      const stillUnchecked: string[] = [];
      
      for (let i = 0; i < uncheckedRefs.length; i++) {
        const ref = uncheckedRefs[i];
        const redisResult = redisResults[i];
        
        if (redisResult !== null) {
          this.stats.redis_hits++;
          duplicates.push(ref);
          // Warm memory cache
          this.memoryCache.set(ref, true);
        } else {
          this.stats.redis_misses++;
          stillUnchecked.push(ref);
        }
      }

      if (stillUnchecked.length === 0) {
        return duplicates;
      }

      // Third pass: Check database
      this.stats.db_checks += stillUnchecked.length;
      const dbDuplicates = await this.paymentRefModel.bulkExists(stillUnchecked);
      
      // Cache the found duplicates
      for (const ref of dbDuplicates) {
        await this.cacheReference(ref);
        duplicates.push(ref);
      }

      this.logger.debug({
        total_checked: reference_numbers.length,
        duplicates_found: duplicates.length,
        memory_hits: this.stats.memory_hits,
        redis_hits: this.stats.redis_hits,
        db_checks: this.stats.db_checks
      }, 'Bulk duplicate check completed');

      return duplicates;

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        unchecked_count: uncheckedRefs.length 
      }, 'Error during bulk duplicate check');

      // Fallback to database for remaining items
      try {
        const dbDuplicates = await this.paymentRefModel.bulkExists(uncheckedRefs);
        return [...duplicates, ...dbDuplicates];
      } catch (dbError) {
        this.logger.error({ 
          error: dbError instanceof Error ? dbError.message : String(dbError) 
        }, 'Database fallback also failed in bulk check');
        
        // Return what we found so far
        return duplicates;
      }
    }
  }

  async addReference(reference_number: string, payment_id: string, payment_date: Date): Promise<void> {
    try {
      // Add to database
      await this.paymentRefModel.create({
        reference_number,
        payment_id,
        payment_date,
      });

      // Cache in both layers
      await this.cacheReference(reference_number);

      this.logger.debug({ reference_number, payment_id }, 'Reference added to deduplication cache');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        reference_number,
        payment_id 
      }, 'Error adding reference to cache');
      throw error;
    }
  }

  async bulkAddReferences(references: Array<{
    reference_number: string;
    payment_id: string;
    payment_date: Date;
  }>): Promise<void> {
    if (references.length === 0) return;

    try {
      // Add to database in bulk
      await this.paymentRefModel.bulkInsert(references);

      // Cache all references
      const cachePromises = references.map(ref => this.cacheReference(ref.reference_number));
      await Promise.all(cachePromises);

      this.logger.debug({ count: references.length }, 'Bulk references added to deduplication cache');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        count: references.length 
      }, 'Error bulk adding references to cache');
      throw error;
    }
  }

  async warmCache(limit: number = 10000): Promise<void> {
    try {
      this.logger.info({ limit }, 'Starting cache warming');

      const recentReferences = await this.paymentRefModel.getRecentReferences(limit);
      
      const cachePromises = recentReferences.map(ref => this.cacheReference(ref));
      await Promise.all(cachePromises);

      this.logger.info({ 
        cached_count: recentReferences.length,
        memory_size: this.memoryCache.size 
      }, 'Cache warming completed');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error during cache warming');
    }
  }

  async clearCache(): Promise<void> {
    try {
      this.memoryCache.clear();
      
      // Get all payment reference keys from Redis and delete them
      const keys = await this.redisClient.keys('payment_ref:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }

      this.logger.info({ redis_keys_deleted: keys.length }, 'Caches cleared');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error clearing cache');
    }
  }

  getStats(): CacheStats & {
    memory_hit_rate: number;
    redis_hit_rate: number;
    overall_hit_rate: number;
    memory_cache_size: number;
  } {
    const memory_hit_rate = this.stats.total_checks > 0 
      ? (this.stats.memory_hits / this.stats.total_checks) * 100 
      : 0;
    
    const redis_hit_rate = this.stats.total_checks > 0 
      ? (this.stats.redis_hits / this.stats.total_checks) * 100 
      : 0;
    
    const total_cache_hits = this.stats.memory_hits + this.stats.redis_hits;
    const overall_hit_rate = this.stats.total_checks > 0 
      ? (total_cache_hits / this.stats.total_checks) * 100 
      : 0;

    return {
      ...this.stats,
      memory_hit_rate: Math.round(memory_hit_rate * 100) / 100,
      redis_hit_rate: Math.round(redis_hit_rate * 100) / 100,
      overall_hit_rate: Math.round(overall_hit_rate * 100) / 100,
      memory_cache_size: this.memoryCache.size,
    };
  }

  resetStats(): void {
    this.stats = {
      memory_hits: 0,
      memory_misses: 0,
      redis_hits: 0,
      redis_misses: 0,
      db_checks: 0,
      total_checks: 0,
    };
  }

  private async cacheReference(reference_number: string): Promise<void> {
    try {
      // Cache in memory
      this.memoryCache.set(reference_number, true);

      // Cache in Redis
      const redisKey = `payment_ref:${reference_number}`;
      await this.redisClient.setEx(redisKey, this.REDIS_TTL_SECONDS, '1');

    } catch (error) {
      this.logger.warn({ 
        error: error instanceof Error ? error.message : String(error),
        reference_number 
      }, 'Failed to cache reference');
    }
  }
}