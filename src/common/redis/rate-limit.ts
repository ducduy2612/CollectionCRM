import { RedisClientType } from 'redis';
import { getRedisClient } from './index';

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Time window in seconds */
  windowSizeInSeconds: number;
  /** Redis client name */
  clientName?: string;
  /** Key prefix */
  prefix?: string;
  /** Whether to include user ID in the rate limit key */
  includeUserId?: boolean;
  /** Whether to include route in the rate limit key */
  includeRoute?: boolean;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Total number of requests allowed in the window */
  limit: number;
  /** Time in seconds until the rate limit resets */
  resetIn: number;
}

/**
 * Rate limiter implementation for API Gateway
 * Uses a sliding window algorithm with Redis
 */
export class RateLimiter {
  private client!: RedisClientType;
  private options: Required<RateLimitOptions>;
  private ready: boolean = false;
  private initPromise: Promise<void>;

  /**
   * Create a new RateLimiter instance
   * @param options - Rate limit options
   */
  constructor(options: RateLimitOptions) {
    this.options = {
      max: options.max,
      windowSizeInSeconds: options.windowSizeInSeconds,
      clientName: options.clientName ?? 'rateLimit',
      prefix: options.prefix ?? 'rateLimit:',
      includeUserId: options.includeUserId ?? true,
      includeRoute: options.includeRoute ?? true
    };

    this.initPromise = this.init();
  }

  /**
   * Initialize the rate limiter
   */
  private async init(): Promise<void> {
    try {
      this.client = await getRedisClient(this.options.clientName);
      this.ready = true;
    } catch (error) {
      console.error('Failed to initialize rate limiter:', error);
      this.ready = false;
    }
  }

  /**
   * Ensure the rate limiter is ready
   */
  private async ensureReady(): Promise<void> {
    if (!this.ready) {
      await this.initPromise;
      if (!this.ready) {
        throw new Error('Rate limiter is not ready');
      }
    }
  }

  /**
   * Generate a rate limit key
   * @param identifier - Request identifier (IP, user ID, etc.)
   * @param route - Optional route identifier
   */
  private generateKey(identifier: string, route?: string): string {
    let key = `${this.options.prefix}${identifier}`;
    
    if (this.options.includeRoute && route) {
      key += `:${route}`;
    }
    
    return key;
  }

  /**
   * Check if a request is allowed
   * @param identifier - Request identifier (IP, user ID, etc.)
   * @param route - Optional route identifier
   */
  public async check(identifier: string, route?: string): Promise<RateLimitResult> {
    await this.ensureReady();
    
    const key = this.generateKey(identifier, route);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.options.windowSizeInSeconds;
    
    try {
      // Remove old entries outside the current window
      await this.client.zRemRangeByScore(key, 0, windowStart);
      
      // Count requests in the current window
      const requestCount = await this.client.zCard(key);
      
      // Check if the limit has been reached
      const allowed = requestCount < this.options.max;
      
      if (allowed) {
        // Add the current request to the sorted set with the current timestamp as score
        await this.client.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
        
        // Set expiration on the key to ensure cleanup
        await this.client.expire(key, this.options.windowSizeInSeconds);
      }
      
      // Get the oldest timestamp in the window to calculate reset time
      const oldestTimestamp = await this.client.zRange(key, 0, 0, { REV: true });
      let resetIn = this.options.windowSizeInSeconds;
      
      if (oldestTimestamp.length > 0) {
        const oldestTime = parseInt(oldestTimestamp[0].split('-')[0], 10);
        resetIn = Math.max(oldestTime + this.options.windowSizeInSeconds - now, 0);
      }
      
      return {
        allowed,
        remaining: Math.max(this.options.max - requestCount - (allowed ? 1 : 0), 0),
        limit: this.options.max,
        resetIn
      };
    } catch (error) {
      console.error(`Error checking rate limit for ${identifier}:`, error);
      
      // Fail open in case of Redis errors
      return {
        allowed: true,
        remaining: this.options.max - 1,
        limit: this.options.max,
        resetIn: this.options.windowSizeInSeconds
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   * @param identifier - Request identifier (IP, user ID, etc.)
   * @param route - Optional route identifier
   */
  public async reset(identifier: string, route?: string): Promise<boolean> {
    await this.ensureReady();
    const key = this.generateKey(identifier, route);
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Error resetting rate limit for ${identifier}:`, error);
      return false;
    }
  }

  /**
   * Get current rate limit status
   * @param identifier - Request identifier (IP, user ID, etc.)
   * @param route - Optional route identifier
   */
  public async getStatus(identifier: string, route?: string): Promise<RateLimitResult> {
    await this.ensureReady();
    
    const key = this.generateKey(identifier, route);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.options.windowSizeInSeconds;
    
    try {
      // Remove old entries outside the current window
      await this.client.zRemRangeByScore(key, 0, windowStart);
      
      // Count requests in the current window
      const requestCount = await this.client.zCard(key);
      
      // Get the oldest timestamp in the window to calculate reset time
      const oldestTimestamp = await this.client.zRange(key, 0, 0, { REV: true });
      let resetIn = this.options.windowSizeInSeconds;
      
      if (oldestTimestamp.length > 0) {
        const oldestTime = parseInt(oldestTimestamp[0].split('-')[0], 10);
        resetIn = Math.max(oldestTime + this.options.windowSizeInSeconds - now, 0);
      }
      
      return {
        allowed: requestCount < this.options.max,
        remaining: Math.max(this.options.max - requestCount, 0),
        limit: this.options.max,
        resetIn
      };
    } catch (error) {
      console.error(`Error getting rate limit status for ${identifier}:`, error);
      
      // Return default values in case of Redis errors
      return {
        allowed: true,
        remaining: this.options.max,
        limit: this.options.max,
        resetIn: this.options.windowSizeInSeconds
      };
    }
  }
}

/**
 * Create a new RateLimiter instance with the given options
 * @param options - Rate limit options
 */
export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  return new RateLimiter(options);
}