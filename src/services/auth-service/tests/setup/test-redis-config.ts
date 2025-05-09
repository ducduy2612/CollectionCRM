import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Redis configuration for tests
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  prefix: 'test:auth:',
  ttl: 3600 // 1 hour TTL for test data
};

/**
 * Create a Redis client for testing
 * Uses a separate namespace (prefix) to avoid interfering with production data
 */
export async function createTestRedisClient(clientName: string = 'test-client') {
  const client = createClient({
    url: redisConfig.url,
    name: clientName
  });
  
  await client.connect();
  return client;
}

/**
 * Clean up test data from Redis
 * @param pattern - Pattern to match keys to delete (defaults to all test keys)
 */
export async function cleanupTestRedisData(pattern: string = `${redisConfig.prefix}*`) {
  const client = await createTestRedisClient('cleanup-client');
  
  try {
    // Find all keys matching the pattern
    const keys = await client.keys(pattern);
    
    // Delete all matching keys
    if (keys.length > 0) {
      await client.del(keys);
    }
    
    console.log(`Cleaned up ${keys.length} Redis test keys`);
  } finally {
    // Disconnect client
    await client.disconnect();
  }
}

export { redisConfig };