# Auth Service Schema

This file contains the SQL script for implementing the auth_service schema of the CollectionCRM database.

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