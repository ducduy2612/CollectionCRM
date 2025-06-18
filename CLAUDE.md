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

### Frontend Development
```bash
cd src/frontend
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production
npm run lint             # Run ESLint
npm test                 # Run tests with Vitest
npm run test:coverage    # Run tests with coverage
```

### Backend Service Development
For any backend service (replace `{service-name}` with actual service):
```bash
cd src/services/{service-name}
npm run dev              # Start with hot-reload using ts-node-dev
npm run build            # Compile TypeScript
npm start                # Start production server (requires build)
npm run lint             # Run ESLint
npm test                 # Run Jest tests
npm run test:coverage    # Run tests with coverage
```

### Docker Development Environment
```bash
# Using convenience script (recommended)
./docker-dev.sh up          # Start all services
./docker-dev.sh frontend    # Start only frontend + required services
./docker-dev.sh down        # Stop all services
./docker-dev.sh logs -f     # Follow logs
./docker-dev.sh build       # Rebuild containers
./docker-dev.sh clean       # Remove all containers and volumes

# Direct Docker Compose
docker compose -f docker/compose/docker-compose.dev.yml up frontend-dev
```

### Database Operations
```bash
# Run migrations (from infrastructure/database)
npm run migrate:up       # Apply pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:create   # Create new migration file
```

### Running Individual Tests
```bash
# Frontend (Vitest)
npm test -- path/to/test.spec.ts
npm test -- --grep "specific test name"

# Backend (Jest)
npm test -- path/to/test.spec.ts
npm test -- --testNamePattern="specific test"
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
./docker-dev.sh up
```

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

### Debugging Microservices
- Check service logs: `./docker-dev.sh logs -f {service-name}`
- Access service directly: `http://localhost:{service-port}`
- Service ports: auth(3001), api-gateway(3000), bank-sync(3002), workflow(3003)

## Testing Strategy

### Unit Tests
- Colocated with source files (*.test.ts, *.spec.ts)
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test API endpoints with real database
- Located in `tests/integration/`
- Use test database schemas

### Frontend Tests
- Component tests with React Testing Library
- Mock API calls with MSW
- Test user interactions and accessibility

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