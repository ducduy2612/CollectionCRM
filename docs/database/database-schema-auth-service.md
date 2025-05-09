# Auth Service Schema

This file contains the SQL script for implementing the auth_service schema of the CollectionCRM database, along with detailed explanations of the schema design, relationships, and usage patterns.

## Schema Overview

The Authentication Service uses a dedicated PostgreSQL schema named `auth_service` that contains tables for:

1. **Users**: Stores user authentication and profile information
2. **Roles**: Defines roles for role-based access control
3. **Permissions**: Maps roles to specific resource permissions
4. **User Sessions**: Tracks active user sessions

## Entity Relationship Diagram

```
┌───────────────────────────┐       ┌───────────────────────────┐
│                           │       │                           │
│          users            │       │          roles            │
│                           │       │                           │
├───────────────────────────┤       ├───────────────────────────┤
│ id (UUID)                 │       │ id (UUID)                 │
│ username (VARCHAR)        │       │ name (VARCHAR)            │
│ email (VARCHAR)           │       │ description (TEXT)        │
│ password_hash (VARCHAR)   │       │ created_at (TIMESTAMP)    │
│ first_name (VARCHAR)      │       │ updated_at (TIMESTAMP)    │
│ last_name (VARCHAR)       │       │                           │
│ role (VARCHAR)            │───────┘                           │
│ is_active (BOOLEAN)       │                                   │
│ created_at (TIMESTAMP)    │                                   │
│ updated_at (TIMESTAMP)    │                                   │
│                           │                                   │
└───────────────┬───────────┘                                   │
                │                                               │
                │                                               │
┌───────────────┴───────────┐       ┌───────────────────────────┐
│                           │       │                           │
│      user_sessions        │       │       permissions         │
│                           │       │                           │
├───────────────────────────┤       ├───────────────────────────┤
│ id (UUID)                 │       │ id (UUID)                 │
│ user_id (UUID)            │───────┤ role_id (UUID)            │
│ token (VARCHAR)           │       │ resource (VARCHAR)        │
│ expires_at (TIMESTAMP)    │       │ action (VARCHAR)          │
│ created_at (TIMESTAMP)    │       │ created_at (TIMESTAMP)    │
│ ip_address (VARCHAR)      │       │ updated_at (TIMESTAMP)    │
│ user_agent (TEXT)         │       │                           │
│                           │       │                           │
└───────────────────────────┘       └───────────────────────────┘
```

## Table Descriptions

### Users Table

The `users` table stores user authentication and basic profile information:

- **id**: Unique identifier for the user (UUID)
- **username**: Unique username for login (VARCHAR)
- **email**: Unique email address (VARCHAR)
- **password_hash**: Bcrypt-hashed password (VARCHAR)
- **first_name**: User's first name (VARCHAR, optional)
- **last_name**: User's last name (VARCHAR, optional)
- **role**: User's role name (VARCHAR)
- **is_active**: Whether the user account is active (BOOLEAN)
- **created_at**: Timestamp when the user was created (TIMESTAMP WITH TIME ZONE)
- **updated_at**: Timestamp when the user was last updated (TIMESTAMP WITH TIME ZONE)

### Roles Table

The `roles` table defines roles for role-based access control:

- **id**: Unique identifier for the role (UUID)
- **name**: Unique name for the role (VARCHAR)
- **description**: Description of the role (TEXT)
- **created_at**: Timestamp when the role was created (TIMESTAMP WITH TIME ZONE)
- **updated_at**: Timestamp when the role was last updated (TIMESTAMP WITH TIME ZONE)

### Permissions Table

The `permissions` table maps roles to specific resource permissions:

- **id**: Unique identifier for the permission (UUID)
- **role_id**: Foreign key reference to the roles table (UUID)
- **resource**: The resource being accessed (VARCHAR)
- **action**: The action being performed on the resource (VARCHAR)
- **created_at**: Timestamp when the permission was created (TIMESTAMP WITH TIME ZONE)
- **updated_at**: Timestamp when the permission was last updated (TIMESTAMP WITH TIME ZONE)

The combination of `role_id`, `resource`, and `action` must be unique.

### User Sessions Table

The `user_sessions` table tracks active user sessions:

- **id**: Unique identifier for the session (UUID)
- **user_id**: Foreign key reference to the users table (UUID)
- **token**: Session token (VARCHAR)
- **expires_at**: Timestamp when the session expires (TIMESTAMP WITH TIME ZONE)
- **created_at**: Timestamp when the session was created (TIMESTAMP WITH TIME ZONE)
- **ip_address**: IP address of the client (VARCHAR)
- **user_agent**: User agent string of the client (TEXT)

## Indexes

The schema includes the following indexes to optimize query performance:

- **idx_users_role**: Index on the `role` column in the `users` table
- **idx_permissions_role_id**: Index on the `role_id` column in the `permissions` table
- **idx_user_sessions_user_id**: Index on the `user_id` column in the `user_sessions` table
- **idx_user_sessions_expires_at**: Index on the `expires_at` column in the `user_sessions` table

## Redis Session Store

In addition to the PostgreSQL tables, the Authentication Service uses Redis to store session data for fast access and revocation capabilities:

```
auth:session:{sessionId} → {
  userId: "user-uuid",
  username: "john.doe",
  roles: ["AGENT"],
  permissions: ["VIEW_CUSTOMERS", "RECORD_ACTIONS"],
  deviceInfo: {
    userAgent: "Mozilla/5.0...",
    deviceType: "DESKTOP",
    browser: "Chrome",
    os: "Windows",
    ip: "192.168.1.1"
  },
  refreshToken: "base64-encoded-refresh-token",
  expiresAt: "2025-01-15T12:00:00Z",
  createdAt: "2025-01-15T10:00:00Z",
  lastActivityAt: "2025-01-15T11:30:00Z"
}

auth:user:{userId}:sessions → ["session-id-1", "session-id-2", ...]
```

## SQL Script

```sql
-- =============================================
-- SETUP EXTENSIONS AND SCHEMAS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For text search optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For GIN index support

-- Create auth_service schema
CREATE SCHEMA IF NOT EXISTS auth_service;
COMMENT ON SCHEMA auth_service IS 'Authentication and authorization related tables';

-- =============================================
-- CREATE TYPES
-- =============================================

-- =============================================
-- CREATE TABLES - AUTH_SERVICE SCHEMA
-- =============================================

-- Users table
CREATE TABLE auth_service.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auth_service.users IS 'Stores user authentication and basic profile information';

-- Roles table
CREATE TABLE auth_service.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auth_service.roles IS 'Defines roles for role-based access control';

-- Permissions table
CREATE TABLE auth_service.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES auth_service.roles(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, resource, action)
);

COMMENT ON TABLE auth_service.permissions IS 'Defines permissions for each role';

-- User sessions table
CREATE TABLE auth_service.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth_service.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT
);

COMMENT ON TABLE auth_service.user_sessions IS 'Tracks user login sessions';

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Auth Service Indexes
CREATE INDEX idx_users_role ON auth_service.users(role);
CREATE INDEX idx_permissions_role_id ON auth_service.permissions(role_id);
CREATE INDEX idx_user_sessions_user_id ON auth_service.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON auth_service.user_sessions(expires_at);
```

## Design Considerations

### Role-Based Access Control

The schema implements a role-based access control (RBAC) system:

1. Each user is assigned a role
2. Each role has a set of permissions
3. Each permission consists of a resource and an action

This design allows for flexible access control while maintaining simplicity.

### Session Management

The schema uses a hybrid approach for session management:

1. PostgreSQL `user_sessions` table for persistent session records
2. Redis for fast session data access and token validation

This approach provides both performance and durability.

### UUID Primary Keys

All tables use UUID primary keys instead of sequential integers for:

1. Security (non-guessable IDs)
2. Distributed systems compatibility (no central sequence generator needed)
3. Consistent ID format across the system

### Timestamps with Time Zone

All timestamp columns use `TIMESTAMP WITH TIME ZONE` to ensure consistent time representation across different time zones.

### Soft Delete Consideration

The current schema uses the `is_active` flag in the `users` table for soft deletion of user accounts. This allows deactivated users to be reactivated later if needed.

## Usage Patterns

### User Authentication

```sql
-- Find user by username
SELECT * FROM auth_service.users WHERE username = 'john.doe';

-- Update last login time
UPDATE auth_service.users SET updated_at = NOW() WHERE id = 'user-uuid';
```

### Permission Checking

```sql
-- Get user permissions
SELECT p.resource, p.action
FROM auth_service.users u
JOIN auth_service.roles r ON u.role = r.name
JOIN auth_service.permissions p ON p.role_id = r.id
WHERE u.id = 'user-uuid';
```

### Session Management

```sql
-- Create a new session
INSERT INTO auth_service.user_sessions (user_id, token, expires_at, ip_address, user_agent)
VALUES ('user-uuid', 'session-token', NOW() + INTERVAL '1 hour', '192.168.1.1', 'Mozilla/5.0...');

-- Get active sessions for a user
SELECT * FROM auth_service.user_sessions
WHERE user_id = 'user-uuid' AND expires_at > NOW();

-- Delete expired sessions
DELETE FROM auth_service.user_sessions WHERE expires_at < NOW();
```

## Future Enhancements

Potential future enhancements to the schema include:

1. **Multi-role support**: Allow users to have multiple roles
2. **Permission inheritance**: Implement role hierarchy with permission inheritance
3. **Audit logging**: Add tables for tracking authentication events and permission changes
4. **Two-factor authentication**: Add support for 2FA methods
5. **Password history**: Track password history to prevent reuse of recent passwords