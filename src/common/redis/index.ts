import { createClient, RedisClientType } from 'redis';

// Export cache, session, and rate limit functionality
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
export class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private clients: Map<string, RedisClientType> = new Map();
  private defaultConfig: RedisConfig;

  private constructor() {
    const baseConfig: RedisConfig = {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
      autoResubscribe: true,
    };
    
    if (process.env.REDIS_PASSWORD) {
      baseConfig.password = process.env.REDIS_PASSWORD;
    }
    
    this.defaultConfig = baseConfig;
  }

  /**
   * Get singleton instance of RedisConnectionManager
   */
  public static getInstance(): RedisConnectionManager {
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
  public async getClient(clientName: string = 'default', config?: Partial<RedisConfig>): Promise<RedisClientType> {
    // Return existing client if available
    if (this.clients.has(clientName) && this.clients.get(clientName)!.isOpen) {
      return this.clients.get(clientName)!;
    }

    // Create new client with merged configuration
    const clientConfig = { ...this.defaultConfig, ...config };
    const socketOptions: any = {
      reconnectStrategy: (retries: number) => {
        // Exponential backoff with max 10 seconds
        const delay = Math.min(Math.pow(2, retries) * 100, 10000);
        return delay;
      },
    };
    
    if (clientConfig.connectTimeout !== undefined) {
      socketOptions.connectTimeout = clientConfig.connectTimeout;
    }
    
    const client = createClient({
      url: `redis://${clientConfig.password ? `:${clientConfig.password}@` : ''}${clientConfig.host}:${clientConfig.port}`,
      socket: socketOptions,
      commandsQueueMaxLength: 1000,
    });

    // Set up error handling
    client.on('error', (err: Error) => {
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
    this.clients.set(clientName, client as any);
    
    return client as any;
  }

  /**
   * Close a specific Redis client connection
   * @param clientName - Name of the client to close
   */
  public async closeClient(clientName: string = 'default'): Promise<void> {
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
  public async closeAllClients(): Promise<void> {
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

/**
 * Helper function to get a Redis client
 * @param clientName - Unique identifier for the client
 * @param config - Optional custom configuration
 */
export async function getRedisClient(clientName: string = 'default', config?: Partial<RedisConfig>): Promise<RedisClientType> {
  return RedisConnectionManager.getInstance().getClient(clientName, config);
}

/**
 * Helper function to close a Redis client
 * @param clientName - Name of the client to close
 */
export async function closeRedisClient(clientName: string = 'default'): Promise<void> {
  return RedisConnectionManager.getInstance().closeClient(clientName);
}

/**
 * Helper function to close all Redis clients
 */
export async function closeAllRedisClients(): Promise<void> {
  return RedisConnectionManager.getInstance().closeAllClients();
}