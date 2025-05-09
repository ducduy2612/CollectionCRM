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
export declare class RateLimiter {
    private client;
    private options;
    private ready;
    private initPromise;
    /**
     * Create a new RateLimiter instance
     * @param options - Rate limit options
     */
    constructor(options: RateLimitOptions);
    /**
     * Initialize the rate limiter
     */
    private init;
    /**
     * Ensure the rate limiter is ready
     */
    private ensureReady;
    /**
     * Generate a rate limit key
     * @param identifier - Request identifier (IP, user ID, etc.)
     * @param route - Optional route identifier
     */
    private generateKey;
    /**
     * Check if a request is allowed
     * @param identifier - Request identifier (IP, user ID, etc.)
     * @param route - Optional route identifier
     */
    check(identifier: string, route?: string): Promise<RateLimitResult>;
    /**
     * Reset rate limit for an identifier
     * @param identifier - Request identifier (IP, user ID, etc.)
     * @param route - Optional route identifier
     */
    reset(identifier: string, route?: string): Promise<boolean>;
    /**
     * Get current rate limit status
     * @param identifier - Request identifier (IP, user ID, etc.)
     * @param route - Optional route identifier
     */
    getStatus(identifier: string, route?: string): Promise<RateLimitResult>;
}
/**
 * Create a new RateLimiter instance with the given options
 * @param options - Rate limit options
 */
export declare function createRateLimiter(options: RateLimitOptions): RateLimiter;
