# Authentication Service Developer Guide

This document provides detailed information for developers working with the Authentication Service, including code structure, extension guidelines, role and permission management, and integration with other services.

## Table of Contents

1. [Code Structure and Organization](#code-structure-and-organization)
2. [Key Components](#key-components)
3. [How to Extend the Service](#how-to-extend-the-service)
4. [Adding New Roles and Permissions](#adding-new-roles-and-permissions)
5. [Integrating with Other Services](#integrating-with-other-services)
6. [Testing Guidelines](#testing-guidelines)
7. [Deployment Considerations](#deployment-considerations)

## Code Structure and Organization

The Authentication Service follows a modular architecture with clear separation of concerns. The codebase is organized as follows:

```
src/
├── config/             # Configuration files
│   └── database.ts     # Database connection configuration
├── middleware/         # Express middleware
│   └── auth.middleware.ts  # Authentication middleware
├── models/             # Data models
│   ├── role.model.ts   # Role model
│   └── user.model.ts   # User model
├── repositories/       # Data access layer
│   ├── role.repository.ts  # Role repository
│   └── user.repository.ts  # User repository
├── routes/             # API routes
│   ├── auth.routes.ts  # Authentication routes
│   ├── role.routes.ts  # Role management routes
│   └── user.routes.ts  # User management routes
├── services/           # Business logic
│   ├── auth.service.ts     # Authentication service
│   ├── role.service.ts     # Role management service
│   ├── session-service.ts  # Session management service
│   └── user.service.ts     # User management service
├── types/              # TypeScript type definitions
│   └── express.d.ts    # Express request extensions
└── index.ts            # Application entry point
```

### Design Patterns

The Authentication Service implements several design patterns:

1. **Repository Pattern**: Separates data access logic from business logic
2. **Singleton Pattern**: Services are implemented as singletons
3. **Middleware Pattern**: Uses Express middleware for cross-cutting concerns
4. **Dependency Injection**: Services depend on repositories, which can be mocked for testing

## Key Components

### Models

Models define the data structures used in the service:

- **User Model**: Represents user accounts with authentication information
- **Role Model**: Represents roles with associated permissions

### Repositories

Repositories handle data access and persistence:

- **User Repository**: CRUD operations for users
- **Role Repository**: CRUD operations for roles and permissions

### Services

Services implement the business logic:

- **Auth Service**: Handles authentication, token validation, and password management
- **User Service**: Manages user accounts
- **Role Service**: Manages roles and permissions
- **Session Service**: Manages user sessions in Redis

### Routes

Routes define the API endpoints and handle HTTP requests:

- **Auth Routes**: Authentication endpoints (login, logout, token refresh)
- **User Routes**: User management endpoints
- **Role Routes**: Role management endpoints

### Middleware

Middleware functions handle cross-cutting concerns:

- **Auth Middleware**: Validates JWT tokens and enforces access control

## How to Extend the Service

### Adding New Endpoints

To add a new endpoint:

1. Identify the appropriate route file (`auth.routes.ts`, `user.routes.ts`, or `role.routes.ts`)
2. Add the new route handler:

```typescript
// Example: Add endpoint to get current user
router.get(
  '/me',
  authenticate,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user!.id;
      const user = await userService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
          errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }]
        });
      }
      
      return res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Server error',
        errors: [{ code: 'SERVER_ERROR', message: 'An error occurred' }]
      });
    }
  }
);
```

### Adding New Service Methods

To add a new service method:

1. Add the method to the appropriate service class
2. Implement the business logic
3. Update the repository if needed

```typescript
// Example: Add method to get user by email
public async getUserByEmail(email: string): Promise<UserResponse | null> {
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    roles: [user.role],
    is_active: user.is_active,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}
```

### Adding New Repository Methods

To add a new repository method:

1. Add the method to the appropriate repository class
2. Implement the data access logic using Knex.js

```typescript
// Example: Add method to find users by role
public async findByRole(role: string, page = 1, pageSize = 10): Promise<{ users: User[]; total: number }> {
  const offset = (page - 1) * pageSize;
  
  const [users, countResult] = await Promise.all([
    db('auth_service.users')
      .where({ role })
      .orderBy('username')
      .limit(pageSize)
      .offset(offset),
    db('auth_service.users')
      .where({ role })
      .count('id as count')
      .first()
  ]);
  
  const total = parseInt(countResult?.count as string, 10) || 0;
  
  return { users, total };
}
```

## Adding New Roles and Permissions

### Role Structure

Roles in the Authentication Service are defined by:

- **Name**: Unique identifier for the role (e.g., "ADMIN", "AGENT")
- **Description**: Human-readable description of the role
- **Permissions**: List of permissions associated with the role

### Permission Structure

Permissions follow a resource-action pattern:

- **Resource**: The entity being accessed (e.g., "CUSTOMERS", "REPORTS")
- **Action**: The operation being performed (e.g., "VIEW", "EDIT", "DELETE")

### Adding a New Role

To add a new role programmatically:

```typescript
// Using the role service
const newRole = await roleService.createRole(
  {
    name: "ANALYST",
    description: "Data analyst role"
  },
  [
    { resource: "REPORTS", action: "VIEW" },
    { resource: "ANALYTICS", action: "VIEW" },
    { resource: "DASHBOARDS", action: "VIEW" }
  ]
);
```

To add a new role via the API:

```bash
curl -X POST http://localhost:3000/api/v1/auth/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ANALYST",
    "description": "Data analyst role",
    "permissions": ["REPORTS:VIEW", "ANALYTICS:VIEW", "DASHBOARDS:VIEW"]
  }'
```

### Adding New Permissions to an Existing Role

To add new permissions to an existing role:

```typescript
// Using the role service
await roleService.addPermission(roleId, "CUSTOMERS", "EXPORT");
```

To update role permissions via the API:

```bash
curl -X PUT http://localhost:3000/api/v1/auth/roles/{roleId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["CUSTOMERS:VIEW", "CUSTOMERS:EDIT", "CUSTOMERS:EXPORT"]
  }'
```

### Best Practices for Role and Permission Management

1. **Use Descriptive Names**: Choose clear, descriptive names for roles and permissions
2. **Follow the Resource-Action Pattern**: Structure permissions as `RESOURCE:ACTION`
3. **Principle of Least Privilege**: Assign only the permissions necessary for each role
4. **Role Hierarchy**: Consider implementing a role hierarchy for inheritance
5. **Document Roles and Permissions**: Maintain documentation of all roles and their permissions

## Integrating with Other Services

The Authentication Service is designed to be integrated with other services in the CollectionCRM system. Here are the key integration points:

### Authentication and Authorization

Other services can authenticate and authorize requests by:

1. **Validating JWT Tokens**: Use the `/token/validate` endpoint to verify tokens
2. **Checking Permissions**: Extract user roles and permissions from the validated token

Example integration in another service:

```typescript
// Example middleware for another service
import axios from 'axios';

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Validate token with Auth Service
    const response = await axios.post(
      'http://auth-service:3000/api/v1/auth/token/validate',
      { token }
    );
    
    if (!response.data.success || !response.data.data.valid) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Attach user info to request
    req.user = response.data.data.user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}

// Example permission check
export function hasPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.permissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ message: 'Permission denied' });
  };
}
```

### Session Management

Other services can use the session management functionality by:

1. **Checking Session Validity**: Use the session service to validate sessions
2. **Terminating Sessions**: Use the session service to terminate sessions

### User Management

Other services can integrate with user management by:

1. **Creating Users**: Use the user service to create new users
2. **Retrieving User Information**: Use the user service to get user details

### Using the Common Redis Module

The Authentication Service uses a common Redis module that can be shared with other services:

```typescript
import { createSessionStore } from 'collection-crm-common/redis/session';

// Create a session store for your service
const sessionStore = createSessionStore({
  ttl: 86400, // 24 hours
  clientName: 'my-service-session',
  prefix: 'my-service:session:'
});

// Use the session store
await sessionStore.createSession(sessionData);
```

## Testing Guidelines

### Unit Testing

Unit tests should be written for all service methods and middleware functions:

```typescript
// Example unit test for auth service
describe('AuthService', () => {
  describe('login', () => {
    it('should return success with valid credentials', async () => {
      // Mock dependencies
      jest.spyOn(userRepository, 'findByUsername').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'validatePassword').mockResolvedValue(true);
      jest.spyOn(userRepository, 'getUserWithPermissions').mockResolvedValue(mockUserWithPermissions);
      
      // Call the method
      const result = await authService.login('john.doe', 'password123');
      
      // Assert the result
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });
  });
});
```

### Integration Testing

Integration tests should be written for all API endpoints:

```typescript
// Example integration test for login endpoint
describe('POST /login', () => {
  it('should return 200 and token with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'john.doe',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## Deployment Considerations

### Environment Variables

Ensure all required environment variables are set:

- `PORT`: Service port (default: 3000)
- `NODE_ENV`: Environment (development, test, production)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL connection details
- `REDIS_HOST`, `REDIS_PORT`: Redis connection details
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRATION`: Token expiration time (e.g., '1h')
- `REFRESH_TOKEN_EXPIRATION`: Refresh token expiration time (e.g., '7d')
- `SESSION_TTL`: Session time-to-live in seconds (e.g., 86400 for 24 hours)

### Docker Deployment

The service can be deployed using Docker:

```bash
# Build the Docker image
docker build -t auth-service -f docker/base-images/auth-service.Dockerfile .

# Run the container
docker run -p 3000:3000 --env-file .env auth-service
```

### Kubernetes Deployment

For Kubernetes deployment, consider:

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Health Checks**: Implement readiness and liveness probes
3. **Secrets Management**: Use Kubernetes secrets for sensitive information
4. **Horizontal Scaling**: Configure horizontal pod autoscaling

### Monitoring and Logging

The service includes:

1. **HTTP Request Logging**: Using Morgan middleware
2. **Application Logging**: Using Pino logger
3. **Health Check Endpoint**: `/health` endpoint for monitoring

Consider integrating with:

1. **Prometheus**: For metrics collection
2. **ELK Stack**: For centralized logging
3. **Grafana**: For visualization and dashboards