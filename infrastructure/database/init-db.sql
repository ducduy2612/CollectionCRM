-- =============================================
-- CollectionCRM Database Initialization
-- Main initialization script
-- =============================================

-- This script runs all the initialization scripts in the correct order
-- to set up the CollectionCRM database schema.

-- Prerequisites:
-- 1. PostgreSQL 13 or higher
-- 2. Database user with CREATE privileges

-- Usage:
-- psql -U postgres -d collectioncrm -f init-db.sql

-- =============================================
-- Run initialization scripts in order
-- =============================================

-- 1. Common setup (extensions, schemas, types)
\echo 'Running 00-common.sql...'
\i 00-common.sql

-- 2. Auth Service Schema
\echo 'Running 01-auth-service.sql...'
\i 01-auth-service.sql

-- 3. Bank Sync Service Schema
\echo 'Running 02-bank-sync-service.sql...'
\i 02-bank-sync-service.sql

-- 4. Payment Service Schema
\echo 'Running 03-payment-service.sql...'
\i 03-payment-service.sql

-- 5. Workflow Service Schema
\echo 'Running 04-workflow-service.sql...'
\i 04-workflow-service.sql

-- 6. Functions and Triggers
\echo 'Running 05-functions-triggers.sql...'
\i 05-functions-triggers.sql

-- 7. Users and Permissions
\echo 'Running 06-users-permissions.sql...'
\i 06-users-permissions.sql

-- =============================================
-- Verify installation
-- =============================================

\echo 'Verifying installation...'

-- Count tables in each schema
\echo 'Tables in auth_service schema:'
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'auth_service';

\echo 'Tables in bank_sync_service schema:'
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'bank_sync_service';

\echo 'Tables in payment_service schema:'
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'payment_service';

\echo 'Tables in workflow_service schema:'
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'workflow_service';

-- Count materialized views
\echo 'Materialized views:'
SELECT schemaname, matviewname FROM pg_matviews ORDER BY schemaname, matviewname;

\echo 'Database initialization completed successfully!'