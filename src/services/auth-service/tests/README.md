# Authentication Service Tests

This directory contains comprehensive tests for the Authentication Service, covering all implemented functionality.

## Test Structure

The tests are organized into the following directories:

- `unit/`: Unit tests for individual components
  - `services/`: Tests for service classes
  - `middleware/`: Tests for middleware functions
- `integration/`: Integration tests for APIs
  - `routes/`: Tests for API endpoints
- `setup/`: Test setup and helper files

## Test Coverage

The tests cover the following functionality:

### User Management
- CRUD operations (Create, Read, Update, Delete)
- User activation/deactivation
- Password management (change, reset)

### Role-based Access Control
- Role management (CRUD operations)
- Permission management
- Role assignment
- Permission checking

### JWT Token Handling
- Token generation
- Token validation
- Token refresh

### Session Management
- Session creation
- Session validation
- Session revocation
- User sessions management

## Running Tests

You can run the tests using the provided `run-tests.sh` script:

```bash
# Run all tests
./tests/run-tests.sh

# Run only unit tests
./tests/run-tests.sh --unit

# Run only integration tests
./tests/run-tests.sh --integration

# Generate coverage report
./tests/run-tests.sh --coverage

# Run tests in verbose mode
./tests/run-tests.sh --verbose
```

Alternatively, you can use npm scripts:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Environment

The tests use:

- Jest as the testing framework
- ts-jest for TypeScript support
- supertest for API testing
- Mock objects for database and Redis connections

The test environment is configured to:

1. Use a separate test database schema
2. Use a separate Redis namespace for test data
3. Use test-specific JWT secrets and configuration

## Adding New Tests

When adding new tests:

1. Follow the existing directory structure
2. Use descriptive test names
3. Test both success and failure scenarios
4. Mock external dependencies
5. Clean up test data after tests

## Test Data

Test data is managed through the helper functions in `setup/test-helpers.ts`:

- `setupTestData()`: Sets up test data in the database
- `cleanupTestData()`: Cleans up test data after tests
- `createTestUser()`: Creates a test user
- `createTestRole()`: Creates a test role
- `createTestPermission()`: Creates a test permission
- `generateTestToken()`: Generates a test JWT token