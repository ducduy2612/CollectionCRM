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

-- 5b. Workflow Service Additional Schema
\echo 'Running scripts/04b-workflow-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/04b-workflow-service.sql

-- 5c. FUD Auto Config
\echo 'Running scripts/04c-fud-auto-config.sql...'
\i /docker-entrypoint-initdb.d/scripts/04c-fud-auto-config.sql

-- 6. Functions and Triggers
\echo 'Running scripts/05-functions-triggers.sql...'
\i /docker-entrypoint-initdb.d/scripts/05-functions-triggers.sql

-- 7. Users and Permissions
\echo 'Running scripts/06-users-permissions.sql...'
\i /docker-entrypoint-initdb.d/scripts/06-users-permissions.sql

-- 8. Admin User, Roles and Permissions Seed Data
\echo 'Running scripts/07-seed-admin-user.sql...'
\i /docker-entrypoint-initdb.d/scripts/07-seed-admin-user.sql

-- 9. Admin Agent Seed Data
\echo 'Running scripts/08-seed-admin-agent.sql...'
\i /docker-entrypoint-initdb.d/scripts/08-seed-admin-agent.sql

-- 10. Bank Sync Service Sample Data
\echo 'Running scripts/09-seed-bank-sync-data.sql...'
\i /docker-entrypoint-initdb.d/scripts/09-seed-bank-sync-data.sql

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

-- Verify seed data
\echo 'Seed data verification:'
\echo 'Admin users:'
SELECT username, role, is_active FROM auth_service.users WHERE role = 'ADMIN';

\echo 'Admin agents:'
SELECT employee_id, name, type, team FROM workflow_service.agents WHERE type = 'ADMIN';

\echo 'Sample customers:'
SELECT COUNT(*) as customer_count FROM bank_sync_service.customers;

\echo 'Sample loans:'
SELECT COUNT(*) as loan_count FROM bank_sync_service.loans;

\echo 'Sample collaterals:'
SELECT COUNT(*) as collateral_count FROM bank_sync_service.collaterals;

\echo 'Database initialization completed successfully!'