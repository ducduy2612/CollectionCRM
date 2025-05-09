import { RedisClientType } from 'redis';
export * from './cache';
export * from './session';
export * from './rate-limit';
/**
 * Redis Connection Pool Configuration
 */
export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    connectTimeout?: number;
    commandTimeout?: number;
    autoResubscribe?: boolean;
}
/**
 * Redis Connection Manager
 * Implements connection pooling and provides error handling and retry logic
 */
export declare class RedisConnectionManager {
    private static instance;
    private clients;
    private defaultConfig;
    private constructor();
    /**
     * Get singleton instance of RedisConnectionManager
     */
    static getInstance(): RedisConnectionManager;
    /**
     * Get a Redis client from the pool
     * @param clientName - Unique identifier for the client
     * @param config - Optional custom configuration
     */
    getClient(clientName?: string, config?: Partial<RedisConfig>): Promise<RedisClientType>;
    /**
     * Close a specific Redis client connection
     * @param clientName - Name of the client to close
     */
    closeClient(clientName?: string): Promise<void>;
    /**
     * Close all Redis client connections
     */
    closeAllClients(): Promise<void>;
}
/**
 * Helper function to get a Redis client
 * @param clientName - Unique identifier for the client
 * @param config - Optional custom configuration
 */
export declare function getRedisClient(clientName?: string, config?: Partial<RedisConfig>): Promise<RedisClientType>;
/**
 * Helper function to close a Redis client
 * @param clientName - Name of the client to close
 */
export declare function closeRedisClient(clientName?: string): Promise<void>;
/**
 * Helper function to close all Redis clients
 */
export declare function closeAllRedisClients(): Promise<void>;
