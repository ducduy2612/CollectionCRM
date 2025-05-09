# Authentication Service

The Authentication Service is a critical component of the CollectionCRM system, responsible for user authentication, authorization, session management, and role-based access control.

## Overview

The Authentication Service provides a secure, scalable, and feature-rich authentication and authorization system for the CollectionCRM platform. It handles user identity verification, session management, and role-based access control to ensure that users can only access resources they are authorized to use.

## Architecture and Design Decisions

### Microservice Architecture
The Authentication Service is designed as a standalone microservice that can be deployed independently, following the microservice architecture pattern of the CollectionCRM system. This allows for independent scaling, deployment, and maintenance.

### Security-First Approach
- **JWT-based Authentication**: Uses JSON Web Tokens (JWT) for secure, stateless authentication
- **Redis-backed Session Management**: Maintains user sessions in Redis for fast access and revocation capabilities
- **Bcrypt Password Hashing**: Securely stores passwords using industry-standard bcrypt hashing
- **Role-Based Access Control (RBAC)**: Implements a comprehensive RBAC system for fine-grained permission management

### Database Schema
The service uses a dedicated PostgreSQL schema (`auth_service`) with tables for:
- `users`: Stores user authentication and profile information
- `roles`: Defines roles for role-based access control
- `permissions`: Maps roles to specific resource permissions
- `user_sessions`: Tracks active user sessions

### API Design
- RESTful API design with consistent endpoint patterns
- Standardized response format for all endpoints
- Comprehensive validation and error handling
- Rate limiting and security headers

## Key Components and Their Responsibilities

### Services

1. **AuthService (`auth.service.ts`)**
   - Handles user authentication (login)
   - Manages token validation and refresh
   - Processes password reset requests
   - Manages user sessions

2. **SessionService (`session-service.ts`)**
   - Creates and manages user sessions in Redis
   - Handles JWT token generation and validation
   - Manages refresh tokens
   - Provides session revocation capabilities

3. **UserService (`user.service.ts`)**
   - Manages user accounts (CRUD operations)
   - Handles password hashing and validation
   - Provides user activation/deactivation functionality
   - Manages user profile information

4. **RoleService (`role.service.ts`)**
   - Manages roles and permissions
   - Handles role assignment to users
   - Provides permission management functionality

### Middleware

- **Authentication Middleware (`auth.middleware.ts`)**
  - Validates JWT tokens for protected routes
  - Extracts and provides user information to route handlers
  - Enforces access control based on user roles and permissions

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

### Installation Steps

1. Install dependencies:

```bash
# Make the install script executable
chmod +x install-deps.sh

# Run the install script
./install-deps.sh
```

2. Configure environment variables:

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

Required environment variables:
- `PORT`: Service port (default: 3000)
- `NODE_ENV`: Environment (development, test, production)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL connection details
- `REDIS_HOST`, `REDIS_PORT`: Redis connection details
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRATION`: Token expiration time (e.g., '1h')
- `REFRESH_TOKEN_EXPIRATION`: Refresh token expiration time (e.g., '7d')
- `SESSION_TTL`: Session time-to-live in seconds (e.g., 86400 for 24 hours)

3. Build the service:

```bash
npm run build
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Docker

The service can be run as part of the CollectionCRM Docker Compose setup:

```bash
# From the project root
cd docker/compose
docker-compose up -d auth-service
```

## Configuration Options

The service can be configured through environment variables or a `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | collectioncrm |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT signing secret | your_jwt_secret_here |
| `JWT_EXPIRATION` | JWT expiration time | 1h |
| `REFRESH_TOKEN_EXPIRATION` | Refresh token expiration | 7d |
| `SESSION_TTL` | Session TTL in seconds | 86400 |
| `LOG_LEVEL` | Logging level | info |

## API Usage Examples

### Authentication

#### Login

```javascript
// Login request
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john.doe',
    password: 'password123',
    deviceInfo: {
      deviceId: 'device-123',
      deviceType: 'DESKTOP',
      browser: 'Chrome',
      operatingSystem: 'Windows',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
});

const data = await response.json();
// Store token for subsequent requests
const token = data.data.token;
```

#### Making Authenticated Requests

```javascript
// Example: Get user profile
const response = await fetch('http://localhost:3000/api/v1/auth/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const userData = await response.json();
```

#### Refreshing Tokens

```javascript
// Refresh token when it expires
const response = await fetch('http://localhost:3000/api/v1/auth/token/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refreshToken: 'your-refresh-token'
  })
});

const newTokens = await response.json();
// Update stored tokens
const token = newTokens.data.token;
const refreshToken = newTokens.data.refreshToken;
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Dependencies

- Express.js - Web framework
- Knex.js - SQL query builder
- PostgreSQL - Database
- Redis - Session store
- JWT - Authentication tokens
- bcrypt - Password hashing
- express-validator - Request validation
- helmet - Security headers
- morgan - HTTP request logging
- pino - Application logging