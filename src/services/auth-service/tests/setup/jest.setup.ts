import dotenv from 'dotenv';
import { testDb } from './test-db-config';

// Load environment variables from .env.test file if it exists
dotenv.config({ path: '.env.test' });

// Set default environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRATION = '1h';
process.env.REFRESH_TOKEN_EXPIRATION = '7d';
process.env.SESSION_TTL = '86400';

// Increase Jest timeout for all tests
jest.setTimeout(10000);

// Silence console logs during tests unless in debug mode
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Clean up after all tests
afterAll(async () => {
  // Close database connection
  try {
    await testDb.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});