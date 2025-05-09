"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnectionManager = void 0;
exports.getRedisClient = getRedisClient;
exports.closeRedisClient = closeRedisClient;
exports.closeAllRedisClients = closeAllRedisClients;
const redis_1 = require("redis");
// Export cache, session, and rate limit functionality
__exportStar(require("./cache"), exports);
__exportStar(require("./session"), exports);
__exportStar(require("./rate-limit"), exports);
/**
 * Redis Connection Manager
 * Implements connection pooling and provides error handling and retry logic
 */
class RedisConnectionManager {
    constructor() {
        this.clients = new Map();
        this.defaultConfig = {
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            connectTimeout: 10000,
            commandTimeout: 5000,
            autoResubscribe: true,
        };
    }
    /**
     * Get singleton instance of RedisConnectionManager
     */
    static getInstance() {
        if (!RedisConnectionManager.instance) {
            RedisConnectionManager.instance = new RedisConnectionManager();
        }
        return RedisConnectionManager.instance;
    }
    /**
     * Get a Redis client from the pool
     * @param clientName - Unique identifier for the client
     * @param config - Optional custom configuration
     */
    async getClient(clientName = 'default', config) {
        // Return existing client if available
        if (this.clients.has(clientName) && this.clients.get(clientName).isOpen) {
            return this.clients.get(clientName);
        }
        // Create new client with merged configuration
        const clientConfig = { ...this.defaultConfig, ...config };
        const client = (0, redis_1.createClient)({
            url: `redis://${clientConfig.password ? `:${clientConfig.password}@` : ''}${clientConfig.host}:${clientConfig.port}`,
            socket: {
                connectTimeout: clientConfig.connectTimeout,
                reconnectStrategy: (retries) => {
                    // Exponential backoff with max 10 seconds
                    const delay = Math.min(Math.pow(2, retries) * 100, 10000);
                    return delay;
                },
            },
            commandsQueueMaxLength: 1000,
        });
        // Set up error handling
        client.on('error', (err) => {
            console.error(`Redis client (${clientName}) error:`, err);
        });
        client.on('reconnecting', () => {
            console.log(`Redis client (${clientName}) reconnecting...`);
        });
        client.on('connect', () => {
            console.log(`Redis client (${clientName}) connected`);
        });
        // Connect to Redis
        await client.connect();
        // Store client in the pool
        // Use type assertion to avoid type conflicts
        this.clients.set(clientName, client);
        return client;
    }
    /**
     * Close a specific Redis client connection
     * @param clientName - Name of the client to close
     */
    async closeClient(clientName = 'default') {
        const client = this.clients.get(clientName);
        if (client && client.isOpen) {
            await client.quit();
            this.clients.delete(clientName);
            console.log(`Redis client (${clientName}) closed`);
        }
    }
    /**
     * Close all Redis client connections
     */
    async closeAllClients() {
        const closePromises = Array.from(this.clients.entries()).map(async ([name, client]) => {
            if (client.isOpen) {
                await client.quit();
                console.log(`Redis client (${name}) closed`);
            }
        });
        await Promise.all(closePromises);
        this.clients.clear();
    }
}
exports.RedisConnectionManager = RedisConnectionManager;
/**
 * Helper function to get a Redis client
 * @param clientName - Unique identifier for the client
 * @param config - Optional custom configuration
 */
async function getRedisClient(clientName = 'default', config) {
    return RedisConnectionManager.getInstance().getClient(clientName, config);
}
/**
 * Helper function to close a Redis client
 * @param clientName - Name of the client to close
 */
async function closeRedisClient(clientName = 'default') {
    return RedisConnectionManager.getInstance().closeClient(clientName);
}
/**
 * Helper function to close all Redis clients
 */
async function closeAllRedisClients() {
    return RedisConnectionManager.getInstance().closeAllClients();
}
