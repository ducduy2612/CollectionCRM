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
-- Check if database was restored from backup
-- =============================================

\echo 'Checking if database was restored from backup...'

-- Check if the flag file exists indicating a successful restore
DO $$
BEGIN
    -- If the temporary flag file exists, it means the database was restored from backup
    -- and we can skip the initialization scripts
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth_service') THEN
        RAISE NOTICE 'Database appears to be already initialized. Skipping initialization scripts.';
        -- Exit the script early
        RETURN;
    END IF;
END $$;

-- =============================================
-- Run initialization scripts in order
-- =============================================

-- 1. Common setup (extensions, schemas, types)
\echo 'Running scripts/00-common.sql...'
\i /docker-entrypoint-initdb.d/scripts/00-common.sql

-- 2. Auth Service Schema
\echo 'Running scripts/01-auth-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/01-auth-service.sql

-- 3. Bank Sync Service Schema
\echo 'Running scripts/02-bank-sync-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/02-bank-sync-service.sql

-- 4. Payment Service Schema
\echo 'Running scripts/03-payment-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/03-payment-service.sql

-- 5. Workflow Service Schema
\echo 'Running scripts/04-workflow-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/04-workflow-service.sql

-- 6. Functions and Triggers
\echo 'Running scripts/05-functions-triggers.sql...'
\i /docker-entrypoint-initdb.d/scripts/05-functions-triggers.sql

-- 7. Users and Permissions
\echo 'Running scripts/06-users-permissions.sql...'
\i /docker-entrypoint-initdb.d/scripts/06-users-permissions.sql

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