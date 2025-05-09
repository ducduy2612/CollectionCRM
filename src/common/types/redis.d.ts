import { RedisClientType as OriginalRedisClientType } from 'redis';

// Extend the Redis client type to fix type compatibility issues
declare global {
  // This is a workaround for the type compatibility issues
  type RedisClientType = OriginalRedisClientType;
}

export {};