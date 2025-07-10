# Audit Service

The Audit Service is responsible for tracking and storing all user actions and system events across the CollectionCRM microservices ecosystem. It subscribes to Kafka topics from various services and maintains a comprehensive audit log for compliance, security, and operational monitoring.

## Features

- **Event Tracking**: Subscribes to Kafka topics from all services
- **Audit Logging**: Stores detailed audit logs with metadata
- **Query API**: REST API for querying audit logs with filters
- **Statistics**: Provides audit statistics and analytics
- **Data Retention**: Configurable retention policies for audit data
- **High Performance**: Optimized database schema with proper indexing

## Architecture

The audit service consists of:

1. **Kafka Consumers**: Subscribe to events from other services
2. **Event Handlers**: Process and normalize events into audit logs
3. **Database Layer**: PostgreSQL with optimized schema for audit data
4. **REST API**: Query interface for audit logs
5. **Background Jobs**: Data cleanup and maintenance

## Monitored Events

### Auth Service Events
- `auth-service.user.created` - User creation
- `auth-service.user.updated` - User updates
- `auth-service.user.deactivated` - User deactivation

### Workflow Service Events
- `workflow-service.agent.created` - Agent creation
- `workflow-service.agent.updated` - Agent updates
- `workflow-service.action.recorded` - Action recording
- `workflow-service.action-record.created` - Action record creation
- `workflow-service.assignment.created` - Customer assignment

## Database Schema

### audit_logs table
- `id` - Primary key UUID
- `event_id` - Original event ID from source system
- `event_type` - Type of event (e.g., user.created)
- `service_name` - Source service name
- `user_id` - Associated user ID
- `agent_id` - Associated agent ID
- `entity_type` - Type of entity (user, customer, action)
- `entity_id` - ID of the affected entity
- `action` - Action performed (create, update, delete)
- `timestamp` - When the event occurred
- `ip_address` - Client IP address
- `user_agent` - Client user agent
- `metadata` - Additional event data (JSONB)
- `created_at` - Audit log creation timestamp

## API Endpoints

### GET /api/v1/audit/logs
Get audit logs with filters and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 1000)
- `sortBy` - Sort field (createdAt, timestamp, eventType, etc.)
- `sortOrder` - Sort order (ASC, DESC)
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `userId` - Filter by user ID
- `agentId` - Filter by agent ID
- `entityType` - Filter by entity type
- `entityId` - Filter by entity ID
- `eventType` - Filter by event type
- `serviceName` - Filter by service name
- `action` - Filter by action
- `ipAddress` - Filter by IP address

### GET /api/v1/audit/logs/:id
Get specific audit log by ID.

### GET /api/v1/audit/user/:userId
Get audit logs for a specific user.

### GET /api/v1/audit/entity/:entityType/:entityId
Get audit logs for a specific entity.

### GET /api/v1/audit/statistics
Get audit statistics with optional filters.

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3010)
- `NODE_ENV` - Environment (development, production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name
- `KAFKA_BROKERS` - Kafka broker addresses
- `KAFKA_CLIENT_ID` - Kafka client ID
- `KAFKA_GROUP_ID` - Kafka consumer group ID
- `AUDIT_RETENTION_DAYS` - Audit log retention period (default: 365)
- `AUDIT_BATCH_SIZE` - Batch size for processing (default: 1000)
- `LOG_LEVEL` - Logging level (info, debug, warn, error)

## Development

### Prerequisites
- Node.js 18 LTS
- PostgreSQL 15+
- Kafka 2.8+

### Setup
1. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migrations:
   ```bash
   psql -h localhost -U postgres -d collectioncrm -f src/migrations/001-create-audit-schema.sql
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## Docker

### Build Image
```bash
docker build -t audit-service .
```

### Run Container
```bash
docker run -p 3010:3010 \
  -e DB_HOST=localhost \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e KAFKA_BROKERS=localhost:9092 \
  audit-service
```

## Production Considerations

### Performance
- Database connection pooling configured
- Indexes optimized for common query patterns
- Batch processing for high-volume events
- Configurable retention policies

### Security
- Non-root Docker user
- Input validation on all endpoints
- Rate limiting on API endpoints
- Secure handling of sensitive data

### Monitoring
- Health check endpoints
- Structured logging with correlation IDs
- Metrics collection for Prometheus
- Dead letter queue for failed events

### Scalability
- Horizontal scaling with multiple instances
- Kafka consumer groups for load distribution
- Database partitioning for large datasets
- Caching layer for frequently accessed data

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Run linting and tests before submitting
5. Follow the project's Git workflow