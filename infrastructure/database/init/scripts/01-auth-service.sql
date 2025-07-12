-- =============================================
-- CollectionCRM Database Initialization
-- 01-auth-service.sql: Auth service schema tables and indexes
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

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Auth Service Indexes
CREATE INDEX idx_users_role ON auth_service.users(role);
CREATE INDEX idx_permissions_role_id ON auth_service.permissions(role_id);