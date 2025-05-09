# Authentication Service Documentation

Welcome to the Authentication Service documentation. This index provides links to all documentation related to the Authentication Service.

## Overview

The Authentication Service is a critical component of the CollectionCRM system, responsible for user authentication, authorization, session management, and role-based access control.

## Documentation Index

### Core Documentation

- [README](../README.md) - Main service documentation with overview, setup instructions, and usage examples
- [API Documentation](./api-documentation.md) - Comprehensive API endpoint documentation
- [Developer Guide](./developer-guide.md) - Guide for developers working with the Authentication Service
- [Architecture Diagrams](./architecture-diagrams.md) - Visual representations of the service architecture

### Project-Wide Documentation

- [Authentication API Contract](/docs/api-contracts/authentication-api.md) - API contract for the Authentication Service
- [Database Schema](/docs/database/database-schema-auth-service.md) - Database schema documentation

### Test Documentation

- [Test Documentation](/src/services/auth-service/tests/README.md) - Information about the test suite

## Key Features

- User authentication with JWT tokens
- Role-based access control
- Session management with Redis
- User and role management APIs
- Password management and security

## Getting Started

To get started with the Authentication Service, refer to the [README](../README.md) for setup and installation instructions.

## Contributing

When contributing to the Authentication Service, please follow the guidelines in the [Developer Guide](./developer-guide.md).

## Related Services

The Authentication Service interacts with the following services:

- API Gateway - Routes requests to the Authentication Service
- Other services - Use the Authentication Service for user authentication and authorization