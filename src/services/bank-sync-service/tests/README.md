# Bank Sync Service Tests

This directory contains tests for the Bank Sync Service. The tests are organized by component type:

- `controllers/`: Tests for API controllers
- `repositories/`: Tests for database repositories
- `integration/`: Integration tests
- `utils/`: Test utilities and setup files

## Test Database

The tests use a real PostgreSQL database with test data. The database connection details are:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collectioncrm
DB_USER=postgres
DB_PASSWORD=admin_password
```

## Running Tests

To run all tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

To run tests in watch mode (for development):

```bash
npm run test:watch
```

## Test Structure

### Repository Tests

Repository tests verify that database operations work correctly with the test data. These tests:

- Test finding entities by their natural keys
- Test searching entities with various criteria
- Test relationships between entities

### Controller Tests

Controller tests verify that API endpoints work correctly. These tests:

- Test successful responses
- Test error handling
- Test input validation

## Test Data

The tests use data that has been pre-populated in the test database. This data is created from the SQL dump file located at `data_dumps/bank_sync_service_data.sql`.

If you need to refresh the test data, you can use the script:

```bash
scripts/dump_bank_sync_data.sh