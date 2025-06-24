-- =============================================
-- CollectionCRM Database Initialization
-- 00-common.sql: Extensions, schemas, and common types
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For text search optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For GIN index support

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth_service;
COMMENT ON SCHEMA auth_service IS 'Authentication and authorization related tables';

CREATE SCHEMA IF NOT EXISTS bank_sync_service;
COMMENT ON SCHEMA bank_sync_service IS 'Customer and loan-related tables synchronized from external systems';

CREATE SCHEMA IF NOT EXISTS payment_service;
COMMENT ON SCHEMA payment_service IS 'Payment-related tables';

CREATE SCHEMA IF NOT EXISTS workflow_service;
COMMENT ON SCHEMA workflow_service IS 'Collection workflow-related tables including agents, actions, and cases';

CREATE SCHEMA IF NOT EXISTS campaign_engine;
COMMENT ON SCHEMA campaign_engine IS 'Collection campaign configuration system';

-- Create common types
-- Source system types
CREATE TYPE source_system_type AS ENUM ('T24', 'W4', 'OTHER', 'CRM');

-- Customer types
CREATE TYPE customer_type AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- Loan status
CREATE TYPE loan_status AS ENUM ('OPEN', 'CLOSED');

-- Payment status
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');