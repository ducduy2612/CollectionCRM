import { EventEmitter } from 'events';

/**
 * Mock Redis client for local development
 */
export class MockRedisClient extends EventEmitter {
  private connected: boolean = false;

  constructor() {
    super();
    console.log('Mock Redis client created');
  }

  async connect(): Promise<void> {
    this.connected = true;
    console.log('Mock Redis client connected');
    return Promise.resolve();
  }

  async ping(): Promise<string> {
    return Promise.resolve('PONG');
  }

  async get(key: string): Promise<string | null> {
    console.log(`Mock Redis GET: ${key}`);
    return Promise.resolve(null);
  }

  async set(key: string, value: string): Promise<string> {
    console.log(`Mock Redis SET: ${key} = ${value}`);
    return Promise.resolve('OK');
  }

  async incr(key: string): Promise<number> {
    console.log(`Mock Redis INCR: ${key}`);
    return Promise.resolve(1);
  }

  async expire(key: string, seconds: number): Promise<number> {
    console.log(`Mock Redis EXPIRE: ${key} ${seconds}s`);
    return Promise.resolve(1);
  }

  async quit(): Promise<string> {
    this.connected = false;
    console.log('Mock Redis client disconnected');
    return Promise.resolve('OK');
  }

  get isOpen(): boolean {
    return this.connected;
  }
}

/**
 * Get a mock Redis client
 */
export async function getMockRedisClient(clientName: string = 'default'): Promise<MockRedisClient> {
  console.log(`Getting mock Redis client: ${clientName}`);
  return new MockRedisClient();
}