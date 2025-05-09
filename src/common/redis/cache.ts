import { RedisClientType } from 'redis';
import { getRedisClient } from './index';

/**
 * Cache options
 */
export interface CacheOptions {
  /** TTL in seconds */
  ttl?: number;
  /** Redis client name */
  clientName?: string;
  /** Key prefix */
  prefix?: string;
}

/**
 * Cache-aside pattern implementation
 * Used for caching frequently accessed data
 */
export class CacheService {
  private client!: RedisClientType;
  private options: Required<CacheOptions>;
  private ready: boolean = false;
  private initPromise: Promise<void>;

  /**
   * Create a new CacheService instance
   * @param options - Cache options
   */
  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 3600, // Default: 1 hour
      clientName: options.clientName ?? 'cache',
      prefix: options.prefix ?? 'cache:'
    };

    this.initPromise = this.init();
  }

  /**
   * Initialize the cache service
   */
  private async init(): Promise<void> {
    try {
      this.client = await getRedisClient(this.options.clientName);
      this.ready = true;
    } catch (error) {
      console.error('Failed to initialize cache service:', error);
      this.ready = false;
    }
  }

  /**
   * Ensure the cache service is ready
   */
  private async ensureReady(): Promise<void> {
    if (!this.ready) {
      await this.initPromise;
      if (!this.ready) {
        throw new Error('Cache service is not ready');
      }
    }
  }

  /**
   * Generate a cache key
   * @param key - Base key
   */
  private generateKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Get a value from cache, or fetch it from the data source if not available
   * @param key - Cache key
   * @param fetchFn - Function to fetch data if not in cache
   * @param ttl - Optional TTL override (in seconds)
   */
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    await this.ensureReady();
    const cacheKey = this.generateKey(key);

    try {
      // Try to get from cache first
      const cachedValue = await this.client.get(cacheKey);
      
      if (cachedValue) {
        // Return parsed cached value
        return JSON.parse(cachedValue) as T;
      }
    } catch (error) {
      // Log error but continue to fetch from source
      console.error(`Error getting value from cache for key ${key}:`, error);
    }

    // Not in cache or error occurred, fetch from source
    try {
      const value = await fetchFn();
      
      // Store in cache with TTL
      try {
        await this.client.set(
          cacheKey,
          JSON.stringify(value),
          { EX: ttl ?? this.options.ttl }
        );
      } catch (cacheError) {
        // Log cache set error but don't fail the operation
        console.error(`Error setting cache for key ${key}:`, cacheError);
      }
      
      return value;
    } catch (fetchError) {
      console.error(`Error fetching data for key ${key}:`, fetchError);
      throw fetchError;
    }
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   */
  public async get<T>(key: string): Promise<T | null> {
    await this.ensureReady();
    const cacheKey = this.generateKey(key);
    
    try {
      const value = await this.client.get(cacheKey);
      return value ? JSON.parse(value) as T : null;
    } catch (error) {
      console.error(`Error getting value from cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Optional TTL override (in seconds)
   */
  public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    await this.ensureReady();
    const cacheKey = this.generateKey(key);
    
    try {
      await this.client.set(
        cacheKey,
        JSON.stringify(value),
        { EX: ttl ?? this.options.ttl }
      );
      return true;
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   */
  public async delete(key: string): Promise<boolean> {
    await this.ensureReady();
    const cacheKey = this.generateKey(key);
    
    try {
      await this.client.del(cacheKey);
      return true;
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries with the current prefix
   */
  public async clear(): Promise<boolean> {
    await this.ensureReady();
    
    try {
      // Get all keys with the current prefix
      const keys = await this.client.keys(`${this.options.prefix}*`);
      
      if (keys.length > 0) {
        // Delete all keys
        await this.client.del(keys);
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   */
  public async exists(key: string): Promise<boolean> {
    await this.ensureReady();
    const cacheKey = this.generateKey(key);
    
    try {
      return (await this.client.exists(cacheKey)) === 1;
    } catch (error) {
      console.error(`Error checking if key ${key} exists:`, error);
      return false;
    }
  }

  /**
   * Get the TTL of a key in seconds
   * @param key - Cache key
   */
  public async ttl(key: string): Promise<number> {
    await this.ensureReady();
    const cacheKey = this.generateKey(key);
    
    try {
      return await this.client.ttl(cacheKey);
    } catch (error) {
      console.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }
}

/**
 * Create a new CacheService instance with the given options
 * @param options - Cache options
 */
export function createCacheService(options?: CacheOptions): CacheService {
  return new CacheService(options);
}