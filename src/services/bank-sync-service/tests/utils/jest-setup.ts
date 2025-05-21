import { initializeTestDataSource, closeTestDataSource } from './test-setup';
import { beforeAll, afterAll, jest } from '@jest/globals';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
  // Initialize the test database connection
  await initializeTestDataSource();
  console.log('Test database connection initialized');
});

// Global teardown after all tests
afterAll(async () => {
  // Close the test database connection
  await closeTestDataSource();
  console.log('Test database connection closed');
});