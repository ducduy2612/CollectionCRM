-- =============================================
-- Cleanup Test Data Script
-- This script removes all test data from the database
-- =============================================

\echo 'Starting test data cleanup...'

-- Step 1: Clean campaign-engine test data
\echo 'Step 1: Cleaning campaign-engine test data...'

DELETE FROM campaign_engine.contact_rule_outputs WHERE contact_selection_rule_id IN (
    SELECT id FROM campaign_engine.contact_selection_rules WHERE campaign_id IN (
        SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
            SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
        )
    )
);

DELETE FROM campaign_engine.contact_rule_conditions WHERE contact_selection_rule_id IN (
    SELECT id FROM campaign_engine.contact_selection_rules WHERE campaign_id IN (
        SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
            SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
        )
    )
);

DELETE FROM campaign_engine.contact_selection_rules WHERE campaign_id IN (
    SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
        SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
    )
);

DELETE FROM campaign_engine.base_conditions WHERE campaign_id IN (
    SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
        SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
    )
);

DELETE FROM campaign_engine.campaigns WHERE campaign_group_id IN (
    SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
);

DELETE FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%';

-- Step 2: Clean bank-sync-service test data
\echo 'Step 2: Cleaning bank-sync-service test data...'

DELETE FROM bank_sync_service.loan_custom_fields WHERE account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.loan_collaterals WHERE loan_account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.due_segmentations WHERE loan_account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.loans WHERE account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.phones WHERE cif LIKE 'TEST%';
DELETE FROM bank_sync_service.addresses WHERE cif LIKE 'TEST%';
DELETE FROM bank_sync_service.emails WHERE cif LIKE 'TEST%';
DELETE FROM bank_sync_service.reference_customers WHERE ref_cif LIKE 'TESTREF_%' OR primary_cif LIKE 'TEST_%';
DELETE FROM bank_sync_service.collaterals WHERE cif LIKE 'TEST%';
DELETE FROM bank_sync_service.customers WHERE cif LIKE 'TEST%';

-- Step 3: Clean workflow-service test data
\echo 'Step 3: Cleaning workflow-service test data...'

DELETE FROM workflow_service.phones WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.addresses WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.emails WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.reference_customers WHERE ref_cif LIKE 'TESTREF_%' OR primary_cif LIKE 'TEST%';
DELETE FROM workflow_service.customer_cases WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.agents WHERE employee_id LIKE 'TEST%';

-- Step 4: Refresh materialized views
\echo 'Step 4: Refreshing materialized views...'

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

-- Step 5: Clear caches
\echo 'Step 5: Clearing caches (run this manually if needed)...'
\echo 'Manual command: docker compose -f docker/compose/docker-compose.dev.yml exec -T redis redis-cli DEL campaign-configuration'

\echo 'Test data cleanup completed successfully!'

COMMIT;