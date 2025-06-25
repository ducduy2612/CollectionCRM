-- =============================================
-- Complete Test Data Setup Script
-- This script runs all test data insertions and refreshes materialized views
-- =============================================

\echo 'Starting test data setup...'

-- Step 1: Insert bank-sync-service test data
\echo 'Step 1: Inserting bank-sync-service test data...'
\i ../data/test-data-bank-sync-insert.sql

-- Step 2: Insert workflow-service test data  
\echo 'Step 2: Inserting workflow-service test data...'
\i ../data/test-data-workflow-insert.sql

-- Step 3: Insert campaign-engine configuration
\echo 'Step 3: Inserting campaign-engine configuration...'
\i ../data/test-campaign-config-insert.sql

-- Step 4: Refresh materialized views
\echo 'Step 4: Refreshing materialized views...'

-- Refresh the customer aggregates view first (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bank_sync_service' AND table_name = 'customer_aggregates') THEN
        PERFORM bank_sync_service.refresh_customer_aggregates();
        RAISE NOTICE 'Refreshed customer_aggregates materialized view';
    ELSE
        RAISE NOTICE 'customer_aggregates materialized view does not exist, skipping...';
    END IF;
END
$$;

-- Refresh the loan campaign data view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'bank_sync_service' AND table_name = 'loan_campaign_data') THEN
        PERFORM bank_sync_service.refresh_loan_campaign_data();
        RAISE NOTICE 'Refreshed loan_campaign_data materialized view';
    ELSE
        RAISE NOTICE 'loan_campaign_data materialized view does not exist, skipping...';
    END IF;
END
$$;

-- Refresh workflow materialized views
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'workflow_service' AND routine_name = 'refresh_workflow_materialized_views') THEN
        PERFORM workflow_service.refresh_workflow_materialized_views();
        RAISE NOTICE 'Refreshed workflow service materialized views';
    ELSE
        RAISE NOTICE 'workflow_service refresh function does not exist, skipping...';
    END IF;
END
$$;

-- Step 5: Verify test data counts
\echo 'Step 5: Verifying test data...'

SELECT 
    'bank_sync_service.customers' as table_name,
    COUNT(*) as test_records
FROM bank_sync_service.customers 
WHERE cif LIKE 'TEST%'

UNION ALL

SELECT 
    'bank_sync_service.loans' as table_name,
    COUNT(*) as test_records
FROM bank_sync_service.loans 
WHERE account_number LIKE 'TEST_%'

UNION ALL

SELECT 
    'bank_sync_service.phones' as table_name,
    COUNT(*) as test_records
FROM bank_sync_service.phones 
WHERE cif LIKE 'TEST%'

UNION ALL

SELECT 
    'bank_sync_service.reference_customers' as table_name,
    COUNT(*) as test_records
FROM bank_sync_service.reference_customers 
WHERE ref_cif LIKE 'TESTREF%'

UNION ALL

SELECT 
    'workflow_service.agents' as table_name,
    COUNT(*) as test_records
FROM workflow_service.agents 
WHERE employee_id LIKE 'TEST%'

UNION ALL

SELECT 
    'workflow_service.phones' as table_name,
    COUNT(*) as test_records
FROM workflow_service.phones 
WHERE cif LIKE 'TEST%'

UNION ALL

SELECT 
    'campaign_engine.campaign_groups' as table_name,
    COUNT(*) as test_records
FROM campaign_engine.campaign_groups 
WHERE name LIKE 'TEST_%'

UNION ALL

SELECT 
    'campaign_engine.campaigns' as table_name,
    COUNT(*) as test_records
FROM campaign_engine.campaigns c
JOIN campaign_engine.campaign_groups cg ON c.campaign_group_id = cg.id
WHERE cg.name LIKE 'TEST_%'

ORDER BY table_name;

-- Step 6: Verify loan campaign data availability
\echo 'Step 6: Checking loan_campaign_data for test customers...'

SELECT 
    cif,
    segment,
    customer_status,
    COUNT(account_number) as loan_count,
    SUM(client_outstanding) as total_outstanding,
    MAX(max_dpd) as highest_dpd,
    STRING_AGG(DISTINCT product_type, ', ') as loan_types
FROM bank_sync_service.loan_campaign_data 
WHERE cif LIKE 'TEST%'
GROUP BY cif, segment, customer_status
ORDER BY cif;

\echo 'Test data setup completed successfully!'
\echo ''
\echo 'Summary:'
\echo '- 15 test customers created (various segments and types)'
\echo '- 17 test loans created (15 OPEN, 2 CLOSED)'
\echo '- Multiple contact sources (bank-sync and workflow)'
\echo '- 8 test campaigns across 3 campaign groups'
\echo '- Complex contact selection rules configured'
\echo '- Materialized views refreshed'
\echo ''
\echo 'Ready to test ProcessingService!'