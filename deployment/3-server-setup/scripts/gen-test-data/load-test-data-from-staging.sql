-- =============================================
-- CollectionCRM Load Test Data from Staging
-- Copies data from staging_bank to bank_sync_service schema
-- =============================================

-- This script truncates existing data and loads from staging_bank
-- WARNING: This will DELETE all existing data in bank_sync_service tables!

BEGIN;

-- Disable foreign key checks temporarily for faster loading
SET session_replication_role = 'replica';

-- Truncate all tables in correct order (respecting foreign key dependencies)
TRUNCATE TABLE bank_sync_service.loan_custom_fields CASCADE;
TRUNCATE TABLE bank_sync_service.loan_collaterals CASCADE;
TRUNCATE TABLE bank_sync_service.due_segmentations CASCADE;
TRUNCATE TABLE bank_sync_service.collaterals CASCADE;
TRUNCATE TABLE bank_sync_service.loans CASCADE;
TRUNCATE TABLE bank_sync_service.emails CASCADE;
TRUNCATE TABLE bank_sync_service.addresses CASCADE;
TRUNCATE TABLE bank_sync_service.phones CASCADE;
TRUNCATE TABLE bank_sync_service.reference_customers CASCADE;
TRUNCATE TABLE bank_sync_service.customers CASCADE;

-- Load customers
INSERT INTO bank_sync_service.customers
SELECT * FROM staging_bank.customers;

-- Load phones
INSERT INTO bank_sync_service.phones
SELECT * FROM staging_bank.phones;

-- Load addresses
INSERT INTO bank_sync_service.addresses
SELECT * FROM staging_bank.addresses;

-- Load emails
INSERT INTO bank_sync_service.emails
SELECT * FROM staging_bank.emails;

-- Load loans
INSERT INTO bank_sync_service.loans
SELECT * FROM staging_bank.loans;

-- Load collaterals
INSERT INTO bank_sync_service.collaterals
SELECT * FROM staging_bank.collaterals;

-- Load due_segmentations
INSERT INTO bank_sync_service.due_segmentations
SELECT * FROM staging_bank.due_segmentations;

-- Load reference_customers
INSERT INTO bank_sync_service.reference_customers
SELECT * FROM staging_bank.reference_customers;

-- Load loan_collaterals
INSERT INTO bank_sync_service.loan_collaterals
SELECT * FROM staging_bank.loan_collaterals;

-- Load loan_custom_fields
INSERT INTO bank_sync_service.loan_custom_fields
SELECT * FROM staging_bank.loan_custom_fields;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Sync customer cases
SELECT * FROM workflow_service.sync_customer_cases();

-- Analyze tables for query optimization
ANALYZE bank_sync_service.customers;
ANALYZE bank_sync_service.phones;
ANALYZE bank_sync_service.addresses;
ANALYZE bank_sync_service.emails;
ANALYZE bank_sync_service.loans;
ANALYZE bank_sync_service.collaterals;
ANALYZE bank_sync_service.due_segmentations;
ANALYZE bank_sync_service.reference_customers;
ANALYZE bank_sync_service.loan_collaterals;
ANALYZE bank_sync_service.loan_custom_fields;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY bank_sync_service.loan_campaign_data;

COMMIT;

-- Show row counts
SELECT 'Customers' as table_name, COUNT(*) as row_count FROM bank_sync_service.customers
UNION ALL
SELECT 'Phones', COUNT(*) FROM bank_sync_service.phones
UNION ALL
SELECT 'Addresses', COUNT(*) FROM bank_sync_service.addresses
UNION ALL
SELECT 'Emails', COUNT(*) FROM bank_sync_service.emails
UNION ALL
SELECT 'Loans', COUNT(*) FROM bank_sync_service.loans
UNION ALL
SELECT 'Collaterals', COUNT(*) FROM bank_sync_service.collaterals
UNION ALL
SELECT 'Due Segmentations', COUNT(*) FROM bank_sync_service.due_segmentations
UNION ALL
SELECT 'Reference Customers', COUNT(*) FROM bank_sync_service.reference_customers
UNION ALL
SELECT 'Loan Collaterals', COUNT(*) FROM bank_sync_service.loan_collaterals
UNION ALL
SELECT 'Loan Custom Fields', COUNT(*) FROM bank_sync_service.loan_custom_fields
UNION ALL
SELECT 'Customer Cases (Workflow Service)', COUNT(*) FROM workflow_service.customer_cases
ORDER BY table_name;