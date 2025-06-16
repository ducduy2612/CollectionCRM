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

-- Create common types
-- Source system types
CREATE TYPE source_system_type AS ENUM ('T24', 'W4', 'OTHER', 'CRM');

-- Customer types
CREATE TYPE customer_type AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- Loan status
CREATE TYPE loan_status AS ENUM ('OPEN', 'CLOSED');

-- Payment status
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- Collection workflow specific types
-- Action types and subtypes
CREATE TYPE action_type AS ENUM ('CALL', 'VISIT', 'EMAIL', 'SMS', 'LETTER');
CREATE TYPE action_subtype AS ENUM ('REMINDER_CALL', 'FOLLOW_UP_CALL', 'FIELD_VISIT', 'COURTESY_CALL', 'PAYMENT_REMINDER', 'DISPUTE_RESOLUTION');
CREATE TYPE action_result AS ENUM ('PROMISE_TO_PAY', 'PAYMENT_MADE', 'NO_CONTACT', 'REFUSED_TO_PAY', 'DISPUTE', 'PARTIAL_PAYMENT', 'RESCHEDULED');

-- Customer status types
CREATE TYPE customer_status AS ENUM ('ACTIVE', 'INACTIVE', 'COOPERATIVE', 'UNCOOPERATIVE', 'DISPUTED');
CREATE TYPE collateral_status AS ENUM ('SECURED', 'UNSECURED', 'PARTIAL', 'UNDER_REVIEW');
CREATE TYPE processing_state_status AS ENUM ('IN_PROCESS', 'COMPLETED', 'PENDING', 'ESCALATED', 'ON_HOLD');
CREATE TYPE lending_violation_status AS ENUM ('NONE', 'MINOR', 'MAJOR', 'CRITICAL');
CREATE TYPE recovery_ability_status AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NONE', 'UNKNOWN');