# API Gateway Service

This directory contains the API Gateway service for the Collection CRM system.

## Technology Stack

- Node.js
- Express.js
- TypeScript
- JWT for authentication
- Redis for rate limiting

## Responsibilities

- Routing and proxying requests to appropriate microservices
- Authentication and authorization
- Rate limiting
- Request validation
- CORS configuration
- API documentation (Swagger/OpenAPI)
- Circuit breaker implementation

## Structure

- `src/`: Source code
  - `routes/`: API routes
  - `middleware/`: Express middleware
  - `config/`: Service configuration
  - `utils/`: Utility functions
  - `types/`: TypeScript type definitions
- `tests/`: Unit and integration tests
- `docs/`: API documentation