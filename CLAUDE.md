# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CollectionCRM is a microservices-based debt collection management system designed to handle ~6 million loans and ~3 million customers with ~2000 concurrent collection agents. The system uses React for frontend and Express.js microservices for backend, all containerized with Docker.

## Architecture

### Service Structure
```
src/
├── frontend/            # React 18 + TypeScript + Vite + Tailwind UI
├── services/
│   ├── api-gateway/     # Entry point for all client requests
│   ├── auth-service/    # JWT authentication & user management
│   ├── bank-sync-service/   # Banking system integration
│   ├── workflow-service/    # Collection workflow management
│   ├── payment-service/     # Payment processing
│   └── campaign-engine/     # Campaign management
└── common/              # Shared utilities and types
```

### Tech Stack
- **Frontend**: React 18, TypeScript 5, Vite, Tailwind CSS, React Query, i18next
- **Backend**: Node.js 18 LTS, Express.js 4.x, TypeScript
- **Database**: PostgreSQL 15+ with TypeORM/Knex, service-specific schemas
- **Message Broker**: Apache Kafka for event-driven communication
- **Cache**: Redis 7
- **Search**: Elasticsearch 8.x
- **Monitoring**: Prometheus + Grafana

## Development Commands

**Important**: All development is done inside Docker containers. You don't need to install Node.js, PostgreSQL, or other dependencies locally. The Docker environment handles everything.

### Frontend Development (inside Docker)
```bash
# Frontend runs in the frontend-dev container on port 5173
# Hot-reloading is enabled through volume mounts
# To run frontend commands:
docker compose -f docker/compose/docker-compose.dev.yml exec frontend-dev npm run lint
docker compose -f docker/compose/docker-compose.dev.yml exec frontend-dev npm test
```

### Backend Service Development (inside Docker)
For any backend service (replace `{service-name}` with actual service):
```bash
# Services run in their respective containers with hot-reloading
# To run commands inside a service container:
docker compose -f docker/compose/docker-compose.dev.yml exec {service-name} npm run lint
docker compose -f docker/compose/docker-compose.dev.yml exec {service-name} npm test
```

### Docker Development Environment

**All development happens inside Docker containers** - no local Node.js or database installation required!

```bash
# Using convenience script (recommended)
./docker-dev.sh up          # Start all services in Docker
./docker-dev.sh frontend    # Start only frontend + required services
./docker-dev.sh down        # Stop all services
./docker-dev.sh logs -f     # Follow logs
./docker-dev.sh build       # Rebuild containers
./docker-dev.sh clean       # Remove all containers and volumes

# Direct Docker Compose
docker compose -f docker/compose/docker-compose.dev.yml up    # Start all services
docker compose -f docker/compose/docker-compose.dev.yml up frontend-dev    # Start specific service
```

### Database Operations
```bash
# Database initialization is handled automatically by Docker
# The init script at infrastructure/database/init/00-init-db.sql runs when the PostgreSQL container starts
# It sets up all schemas, tables, functions, triggers, and seed data

# For manual database operations:
psql -U postgres -d collectioncrm -f infrastructure/database/init/00-init-db.sql
```

### Running Individual Tests (inside Docker)
```bash
# Frontend tests (Vitest) - run inside frontend-dev container
docker compose -f docker/compose/docker-compose.dev.yml exec frontend-dev npm test -- path/to/test.spec.ts
docker compose -f docker/compose/docker-compose.dev.yml exec frontend-dev npm test -- --grep "specific test name"

# Backend tests (Jest) - run inside service container
docker compose -f docker/compose/docker-compose.dev.yml exec {service-name} npm test -- path/to/test.spec.ts
docker compose -f docker/compose/docker-compose.dev.yml exec {service-name} npm test -- --testNamePattern="specific test"

# Or use the convenience script
./docker-dev.sh exec frontend-dev npm test
```

## Key Development Patterns

### API Communication
- All frontend requests go through API Gateway (port 3000)
- Services communicate via Kafka for async operations
- REST APIs follow standard patterns with TypeScript interfaces

### Database Schema Isolation
Each service has its own PostgreSQL schema:
- `auth_service`: Users, roles, permissions
- `bank_sync_service`: Bank accounts, transactions
- `workflow_service`: Workflows, assignments, actions
- `payment_service`: Payments, payment methods

### Authentication Flow
- JWT tokens issued by auth-service
- API Gateway validates tokens before routing
- Frontend stores tokens in secure HTTP-only cookies

### Internationalization
- Frontend supports English (en) and Vietnamese (vi)
- Translation files in `src/frontend/src/locales/`
- Use i18next's `t()` function for all user-facing text

### State Management
- React Query for server state (API calls)
- Local component state with useState/useReducer
- No global state management library currently

## Environment Setup

**Prerequisites**: Only Docker and Docker Compose are required. All other dependencies (Node.js, PostgreSQL, Redis, etc.) run inside containers.

1. Copy all .env.example files:
```bash
cp src/frontend/.env.example src/frontend/.env
cp src/services/auth-service/.env.example src/services/auth-service/.env
cp src/services/api-gateway/.env.example src/services/api-gateway/.env
cp src/services/bank-sync-service/.env.example src/services/bank-sync-service/.env
cp src/services/workflow-service/.env.example src/services/workflow-service/.env
```

2. Start Docker development environment:
```bash
./docker-dev.sh up    # This starts all services inside Docker containers
```

3. Access the application:
- Frontend: http://localhost:5173 (Vite dev server inside Docker)
- API Gateway: http://localhost:3000
- Individual services are accessible on their respective ports

## Common Tasks

### Adding a New API Endpoint
1. Define route in service (e.g., `src/services/auth-service/src/routes/`)
2. Add TypeScript interfaces in `src/common/types/`
3. Update API Gateway routing if needed
4. Add frontend API client method in `src/frontend/src/api/`

### Creating Database Migrations
1. Navigate to `infrastructure/database/`
2. Run `npm run migrate:create -- --name your-migration-name`
3. Edit the generated migration file
4. Test with `npm run migrate:up` and `npm run migrate:down`

### Adding Frontend Components
1. Create component in `src/frontend/src/components/`
2. Use Tailwind UI patterns for consistency
3. Add translations to locale files
4. Write tests alongside component files

### Debugging Microservices (inside Docker)
- Check service logs: `./docker-dev.sh logs -f {service-name}`
- Access service directly: `http://localhost:{service-port}`
- Service ports: auth(3001), api-gateway(3000), bank-sync(3002), workflow(3003), campaign-engine(3004), payment(3005), audit(3010)
- Execute commands inside containers: `./docker-dev.sh exec {service-name} sh`
- All debugging happens within the Docker environment

## Important Considerations

### Performance
- Database queries use proper indexing
- Pagination implemented for large datasets
- Redis caching for frequently accessed data
- Kafka for async operations to avoid blocking

### Security
- All endpoints require authentication (except auth endpoints)
- Role-based access control (RBAC) implemented
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries

### Error Handling
- Consistent error response format across services
- Centralized error handling middleware
- Detailed logging with correlation IDs
- User-friendly error messages in frontend

### Code Style
- TypeScript strict mode enabled
- ESLint configuration enforced
- Prettier for formatting
- Follow existing patterns in codebase