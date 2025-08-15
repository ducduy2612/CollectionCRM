# Collexis Common Modules

This package contains common modules and utilities used across the Collexis microservices.

## Redis Module

The Redis module provides a connection pooling mechanism with error handling and retry logic for Redis operations.

### Installation

```bash
npm install
```

### Usage

```typescript
import { getRedisClient, closeRedisClient, closeAllRedisClients } from './redis';

// Example: Get a Redis client with default configuration
async function example() {
  // Get a Redis client (creates a new connection or returns an existing one)
  const redis = await getRedisClient();
  
  // Use the Redis client
  await redis.set('key', 'value');
  const value = await redis.get('key');
  console.log(value); // 'value'
  
  // Close a specific client when done
  await closeRedisClient();
  
  // Or close all clients when shutting down the application
  await closeAllRedisClients();
}

// Example: Get a Redis client with custom configuration
async function customExample() {
  const redis = await getRedisClient('custom', {
    host: 'custom-redis-host',
    port: 6380,
    password: 'password',
    maxRetriesPerRequest: 5
  });
  
  // Use the client...
}

// Example: Get a named client for different purposes
async function multipleClientsExample() {
  // Get a client for caching
  const cacheClient = await getRedisClient('cache');
  
  // Get a client for session management
  const sessionClient = await getRedisClient('session');
  
  // Get a client for rate limiting
  const rateLimitClient = await getRedisClient('rateLimit');
  
  // Each client can be configured and managed separately
}
```

### Features

- Connection pooling: Reuse Redis connections across your application
- Automatic reconnection with exponential backoff
- Error handling and logging
- Support for multiple named clients with different configurations
- Graceful connection termination