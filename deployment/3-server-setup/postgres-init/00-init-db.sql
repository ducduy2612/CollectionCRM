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

-- 0. Common setup (extensions, schemas, types)
\echo 'Running scripts/00-common.sql...'
\i /docker-entrypoint-initdb.d/scripts/00-common.sql

-- 1. Auth Service Schema
\echo 'Running scripts/01-auth-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/01-auth-service.sql

-- 2. Bank Sync Service Schema
\echo 'Running scripts/02-bank-sync-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/02-bank-sync-service.sql

-- 2a. Bank Sync Service phone-types
\echo 'Running scripts/02a-phone-types.sql...'
\i /docker-entrypoint-initdb.d/scripts/02a-phone-types.sql

-- 2b. Bank Sync Service address-types
\echo 'Running scripts/02b-address-types.sql...'
\i /docker-entrypoint-initdb.d/scripts/02b-address-types.sql

-- 2c. Bank Sync Service relationship-types
\echo 'Running scripts/02c-relationship-types.sql...'
\i /docker-entrypoint-initdb.d/scripts/02c-relationship-types.sql

-- 3. Payment Service Schema
\echo 'Running scripts/03-payment-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/03-payment-service.sql

-- 4. Workflow Service Schema
\echo 'Running scripts/04-workflow-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/04-workflow-service.sql

-- 4b. Workflow Service Additional Schema
\echo 'Running scripts/04b-workflow-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/04b-workflow-service.sql

-- 4c. FUD Auto Config
\echo 'Running scripts/04c-fud-auto-config.sql...'
\i /docker-entrypoint-initdb.d/scripts/04c-fud-auto-config.sql

-- 5. Functions and Triggers
\echo 'Running scripts/05-functions-triggers.sql...'
\i /docker-entrypoint-initdb.d/scripts/05-functions-triggers.sql

-- 6. Users and Permissions
\echo 'Running scripts/06-users-permissions.sql...'
\i /docker-entrypoint-initdb.d/scripts/06-users-permissions.sql

-- 7. Admin User, Roles and Permissions Seed Data
\echo 'Running scripts/07-seed-admin-user.sql...'
\i /docker-entrypoint-initdb.d/scripts/07-seed-admin-user.sql

-- 8. Admin Agent Seed Data
\echo 'Running scripts/08-seed-admin-agent.sql...'
\i /docker-entrypoint-initdb.d/scripts/08-seed-admin-agent.sql

-- 10. Campaign-Engine 
\echo 'Running scripts/10-campaign-engine.sql...'
\i /docker-entrypoint-initdb.d/scripts/10-campaign-engine.sql

-- 11. Document-Storage
\echo 'Running scripts/11-document-storage.sql...'
\i /docker-entrypoint-initdb.d/scripts/11-document-storage.sql

-- 12. Audit Service
\echo 'Running scripts/12-audit-service.sql...'
\i /docker-entrypoint-initdb.d/scripts/12-audit-service.sql

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

\echo 'Tables in campaign_engine schema:'
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'campaign_engine';

\echo 'Tables in audit_service schema:'
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'audit_service';

-- Count materialized views
\echo 'Materialized views:'
SELECT schemaname, matviewname FROM pg_matviews ORDER BY schemaname, matviewname;

-- Verify seed data
\echo 'Seed data verification:'
\echo 'Admin users:'
SELECT username, role, is_active FROM auth_service.users WHERE role = 'ADMIN';

\echo 'Admin agents:'
SELECT employee_id, name, type, team FROM workflow_service.agents WHERE type = 'ADMIN';

\echo 'Database initialization completed successfully!'