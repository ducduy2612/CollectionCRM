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
export declare class CacheService {
    private client;
    private options;
    private ready;
    private initPromise;
    /**
     * Create a new CacheService instance
     * @param options - Cache options
     */
    constructor(options?: CacheOptions);
    /**
     * Initialize the cache service
     */
    private init;
    /**
     * Ensure the cache service is ready
     */
    private ensureReady;
    /**
     * Generate a cache key
     * @param key - Base key
     */
    private generateKey;
    /**
     * Get a value from cache, or fetch it from the data source if not available
     * @param key - Cache key
     * @param fetchFn - Function to fetch data if not in cache
     * @param ttl - Optional TTL override (in seconds)
     */
    getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Get a value from cache
     * @param key - Cache key
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set a value in cache
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Optional TTL override (in seconds)
     */
    set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    /**
     * Delete a value from cache
     * @param key - Cache key
     */
    delete(key: string): Promise<boolean>;
    /**
     * Clear all cache entries with the current prefix
     */
    clear(): Promise<boolean>;
    /**
     * Check if a key exists in cache
     * @param key - Cache key
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get the TTL of a key in seconds
     * @param key - Cache key
     */
    ttl(key: string): Promise<number>;
}
/**
 * Create a new CacheService instance with the given options
 * @param options - Cache options
 */
export declare function createCacheService(options?: CacheOptions): CacheService;
