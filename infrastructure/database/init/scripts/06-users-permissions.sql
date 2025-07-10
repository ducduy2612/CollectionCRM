-- =============================================
-- CollectionCRM Database Initialization
-- 06-users-permissions.sql: Users and permissions
-- =============================================

-- Create service-specific users with least privilege access

-- -- Auth Service User
-- CREATE USER auth_user WITH PASSWORD 'auth_password';

-- -- Grant permissions to auth_service schema
-- GRANT USAGE ON SCHEMA auth_service TO auth_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth_service TO auth_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth_service TO auth_user;
-- -- Read-only access to other schemas
-- GRANT USAGE ON SCHEMA bank_sync_service, payment_service, workflow_service TO auth_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA bank_sync_service, payment_service, workflow_service TO auth_user;

-- -- Bank Sync Service User
-- CREATE USER bank_sync_user WITH PASSWORD 'bank_sync_password';

-- -- Grant permissions to bank_sync_service schema
-- GRANT USAGE ON SCHEMA bank_sync_service TO bank_sync_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bank_sync_service TO bank_sync_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bank_sync_service TO bank_sync_user;
-- -- Read-only access to other schemas
-- GRANT USAGE ON SCHEMA auth_service, payment_service, workflow_service TO bank_sync_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA auth_service, payment_service, workflow_service TO bank_sync_user;

-- -- Payment Service User
-- CREATE USER payment_user WITH PASSWORD 'payment_password';

-- -- Grant permissions to payment_service schema
-- GRANT USAGE ON SCHEMA payment_service TO payment_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payment_service TO payment_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA payment_service TO payment_user;
-- -- Read-only access to other schemas
-- GRANT USAGE ON SCHEMA auth_service, bank_sync_service, workflow_service TO payment_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA auth_service, bank_sync_service, workflow_service TO payment_user;

-- -- Workflow Service User
-- CREATE USER workflow_user WITH PASSWORD 'workflow_password';

-- -- Grant permissions to workflow_service schema
-- GRANT USAGE ON SCHEMA workflow_service TO workflow_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA workflow_service TO workflow_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA workflow_service TO workflow_user;
-- -- Read-only access to other schemas
-- GRANT USAGE ON SCHEMA auth_service, bank_sync_service, payment_service TO workflow_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA auth_service, bank_sync_service, payment_service TO workflow_user;

-- -- Reporting User (read-only access to all schemas)
-- CREATE USER reporting_user WITH PASSWORD 'reporting_password';

-- -- Grant read-only permissions to all schemas
-- GRANT USAGE ON SCHEMA auth_service, bank_sync_service, payment_service, workflow_service TO reporting_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA auth_service, bank_sync_service, payment_service, workflow_service TO reporting_user;

-- -- Set default privileges for future objects
-- ALTER DEFAULT PRIVILEGES IN SCHEMA auth_service GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO auth_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA auth_service GRANT USAGE, SELECT ON SEQUENCES TO auth_user;

-- ALTER DEFAULT PRIVILEGES IN SCHEMA bank_sync_service GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bank_sync_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA bank_sync_service GRANT USAGE, SELECT ON SEQUENCES TO bank_sync_user;

-- ALTER DEFAULT PRIVILEGES IN SCHEMA payment_service GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO payment_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA payment_service GRANT USAGE, SELECT ON SEQUENCES TO payment_user;

-- ALTER DEFAULT PRIVILEGES IN SCHEMA workflow_service GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO workflow_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA workflow_service GRANT USAGE, SELECT ON SEQUENCES TO workflow_user;

-- -- Grant read-only default privileges for reporting user
-- ALTER DEFAULT PRIVILEGES IN SCHEMA auth_service, bank_sync_service, payment_service, workflow_service
-- GRANT SELECT ON TABLES TO reporting_user;

-- -- Grant CREATE permission on schemas to service users
-- GRANT CREATE ON SCHEMA auth_service TO auth_user;
-- GRANT CREATE ON SCHEMA bank_sync_service TO bank_sync_user;
-- GRANT CREATE ON SCHEMA payment_service TO payment_user;
-- GRANT CREATE ON SCHEMA workflow_service TO workflow_user;

-- =============================================
-- Configure collectioncrm user (created by POSTGRES_USER env var)
-- This user is typically used in development/staging environments
-- =============================================

-- Check if collectioncrm user exists (created by POSTGRES_USER env var)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'collectioncrm') THEN
        -- Grant permissions to all service schemas
        GRANT USAGE ON SCHEMA auth_service, bank_sync_service, payment_service, workflow_service, campaign_engine TO collectioncrm;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth_service, bank_sync_service, payment_service, workflow_service, campaign_engine TO collectioncrm;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth_service, bank_sync_service, payment_service, workflow_service, campaign_engine TO collectioncrm;
        GRANT CREATE ON SCHEMA auth_service, bank_sync_service, payment_service, workflow_service, campaign_engine TO collectioncrm;

        -- Set search_path for collectioncrm user
        -- This ensures services can find tables without schema prefix
        ALTER ROLE collectioncrm SET search_path TO auth_service, bank_sync_service, payment_service, workflow_service, campaign_engine, public;

        -- Grant default privileges for future objects
        ALTER DEFAULT PRIVILEGES IN SCHEMA auth_service GRANT ALL PRIVILEGES ON TABLES TO collectioncrm;
        ALTER DEFAULT PRIVILEGES IN SCHEMA auth_service GRANT ALL PRIVILEGES ON SEQUENCES TO collectioncrm;

        ALTER DEFAULT PRIVILEGES IN SCHEMA bank_sync_service GRANT ALL PRIVILEGES ON TABLES TO collectioncrm;
        ALTER DEFAULT PRIVILEGES IN SCHEMA bank_sync_service GRANT ALL PRIVILEGES ON SEQUENCES TO collectioncrm;

        ALTER DEFAULT PRIVILEGES IN SCHEMA payment_service GRANT ALL PRIVILEGES ON TABLES TO collectioncrm;
        ALTER DEFAULT PRIVILEGES IN SCHEMA payment_service GRANT ALL PRIVILEGES ON SEQUENCES TO collectioncrm;

        ALTER DEFAULT PRIVILEGES IN SCHEMA workflow_service GRANT ALL PRIVILEGES ON TABLES TO collectioncrm;
        ALTER DEFAULT PRIVILEGES IN SCHEMA workflow_service GRANT ALL PRIVILEGES ON SEQUENCES TO collectioncrm;

        ALTER DEFAULT PRIVILEGES IN SCHEMA campaign_engine GRANT ALL PRIVILEGES ON TABLES TO collectioncrm;
        ALTER DEFAULT PRIVILEGES IN SCHEMA campaign_engine GRANT ALL PRIVILEGES ON SEQUENCES TO collectioncrm;

        RAISE NOTICE 'Configured permissions and search_path for collectioncrm user';
    END IF;
END $$;