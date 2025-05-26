# Collection Workflow Service

This service manages the collection workflow process, including agent management, action tracking, customer assignments, and case management.

## Features

- **Agent Management**: Create, update, and query collection agents
- **Action Management**: Record and track collection actions (calls, visits, etc.)
- **Assignment Management**: Assign customers to agents and track assignment history
- **Case Management**: Track customer case status and history

## API Endpoints

The service exposes the following API endpoints:

### Agent Management

- `GET /agents` - List agents with filtering
- `POST /agents` - Create new agent
- `PUT /agents/{id}` - Update agent
- `GET /agents/{id}/performance` - Agent performance metrics
- `GET /agents/by-user/{userId}` - Get agent by user ID
- `POST /agents/link-user` - Link agent to user

### Action Management

- `POST /actions` - Record collection action
- `GET /actions/customer/{cif}` - Customer actions
- `GET /actions/loan/{accountNumber}` - Loan actions
- `PUT /actions/{id}/result` - Update action result

### Assignment Management

- `GET /assignments/agent/{agentId}` - Agent assignments
- `POST /assignments` - Create assignment
- `PUT /assignments/{id}` - Update assignment
- `GET /assignments/history/{cif}` - Assignment history

### Case Management

- `GET /cases/customer/{cif}` - Customer case history
- `POST /cases` - Record case action
- `GET /cases/status/{cif}` - Customer case status

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file with the following variables:
   ```
   PORT=3003
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=collectioncrm
   API_PREFIX=/api/v1/collection
   ```

3. Build the service:
   ```
   npm run build
   ```

4. Start the service:
   ```
   npm start
   ```

## Development

- Run in development mode with hot reload:
  ```
  npm run dev
  ```

- Run tests:
  ```
  npm test
  ```

- Lint code:
  ```
  npm run lint
  ```

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # API controllers
├── entities/         # TypeORM entities
├── middleware/       # Express middleware
├── repositories/     # Data access layer
├── routes/           # API routes
├── utils/            # Utility functions
├── app.ts            # Express app setup
└── index.ts          # Service entry point
```

## Dependencies

- Express.js - Web framework
- TypeORM - ORM for database operations
- PostgreSQL - Database
- JWT - Authentication
- Pino - Logging