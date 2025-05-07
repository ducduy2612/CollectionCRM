-- =============================================
-- CollectionCRM Database Initialization
-- 05-functions-triggers.sql: Additional functions and triggers
-- =============================================

-- =============================================
-- COMMON UTILITY FUNCTIONS
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column on record update';

-- =============================================
-- PARTITION MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create a new partition for the payments table
CREATE OR REPLACE FUNCTION payment_service.create_payments_partition(
    p_year INTEGER,
    p_quarter INTEGER
)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Calculate start and end dates for the partition
    start_date := make_date(p_year, ((p_quarter - 1) * 3) + 1, 1);
    
    IF p_quarter = 4 THEN
        end_date := make_date(p_year + 1, 1, 1);
    ELSE
        end_date := make_date(p_year, ((p_quarter) * 3) + 1, 1);
    END IF;
    
    -- Create partition name
    partition_name := 'payments_' || p_year || '_q' || p_quarter;
    
    -- Create the partition
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS payment_service.%I PARTITION OF payment_service.payments
        FOR VALUES FROM (%L) TO (%L)
    ', partition_name, start_date, end_date);
    
    RAISE NOTICE 'Created partition payment_service.% for period % to %', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.create_payments_partition(INTEGER, INTEGER) IS 'Creates a new quarterly partition for the payments table';

-- Function to create a new partition for the action_records table
CREATE OR REPLACE FUNCTION workflow_service.create_action_records_partition(
    p_year INTEGER,
    p_quarter INTEGER
)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Calculate start and end dates for the partition
    start_date := make_date(p_year, ((p_quarter - 1) * 3) + 1, 1);
    
    IF p_quarter = 4 THEN
        end_date := make_date(p_year + 1, 1, 1);
    ELSE
        end_date := make_date(p_year, ((p_quarter) * 3) + 1, 1);
    END IF;
    
    -- Create partition name
    partition_name := 'action_records_' || p_year || '_q' || p_quarter;
    
    -- Create the partition
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS workflow_service.%I PARTITION OF workflow_service.action_records
        FOR VALUES FROM (%L) TO (%L)
    ', partition_name, start_date, end_date);
    
    RAISE NOTICE 'Created partition workflow_service.% for period % to %', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.create_action_records_partition(INTEGER, INTEGER) IS 'Creates a new quarterly partition for the action_records table';

-- Function to create a new partition for the customer_agents table
CREATE OR REPLACE FUNCTION workflow_service.create_customer_agents_partition(
    p_year INTEGER,
    p_quarter INTEGER
)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Calculate start and end dates for the partition
    start_date := make_date(p_year, ((p_quarter - 1) * 3) + 1, 1);
    
    IF p_quarter = 4 THEN
        end_date := make_date(p_year + 1, 1, 1);
    ELSE
        end_date := make_date(p_year, ((p_quarter) * 3) + 1, 1);
    END IF;
    
    -- Create partition name
    partition_name := 'customer_agents_' || p_year || '_q' || p_quarter;
    
    -- Create the partition
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS workflow_service.%I PARTITION OF workflow_service.customer_agents
        FOR VALUES FROM (%L) TO (%L)
    ', partition_name, start_date, end_date);
    
    RAISE NOTICE 'Created partition workflow_service.% for period % to %', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.create_customer_agents_partition(INTEGER, INTEGER) IS 'Creates a new quarterly partition for the customer_agents table';

-- =============================================
-- TRIGGERS
-- =============================================

-- Triggers for auth_service schema
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON auth_service.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON auth_service.roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON auth_service.permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Triggers for bank_sync_service schema
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON bank_sync_service.customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phones_updated_at
BEFORE UPDATE ON bank_sync_service.phones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON bank_sync_service.addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
BEFORE UPDATE ON bank_sync_service.emails
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON bank_sync_service.loans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaterals_updated_at
BEFORE UPDATE ON bank_sync_service.collaterals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_due_segmentations_updated_at
BEFORE UPDATE ON bank_sync_service.due_segmentations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reference_customers_updated_at
BEFORE UPDATE ON bank_sync_service.reference_customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_collaterals_updated_at
BEFORE UPDATE ON bank_sync_service.loan_collaterals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Triggers for payment_service schema
-- Note: For partitioned tables, triggers need to be created on the parent table
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payment_service.payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Triggers for workflow_service schema
CREATE TRIGGER update_agents_updated_at
BEFORE UPDATE ON workflow_service.agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Note: For partitioned tables, triggers need to be created on the parent table
CREATE TRIGGER update_action_records_updated_at
BEFORE UPDATE ON workflow_service.action_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_agents_updated_at
BEFORE UPDATE ON workflow_service.customer_agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cases_updated_at
BEFORE UPDATE ON workflow_service.customer_cases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_case_actions_updated_at
BEFORE UPDATE ON workflow_service.customer_case_actions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- MATERIALIZED VIEW REFRESH SCHEDULE FUNCTION
-- =============================================

-- Function to schedule materialized view refreshes
CREATE OR REPLACE FUNCTION schedule_materialized_view_refreshes()
RETURNS void AS $$
BEGIN
    -- Refresh payment service materialized views
    PERFORM payment_service.refresh_payment_materialized_views();
    
    -- Refresh workflow service materialized views
    PERFORM workflow_service.refresh_workflow_materialized_views();
    
    RAISE NOTICE 'All materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION schedule_materialized_view_refreshes() IS 'Refreshes all materialized views in the database';

-- =============================================
-- CUSTOMER AGENT ASSIGNMENT HISTORY TRIGGER
-- =============================================

-- Function to handle customer agent assignment changes
CREATE OR REPLACE FUNCTION workflow_service.handle_customer_agent_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an update to an existing assignment
    IF TG_OP = 'UPDATE' THEN
        -- If the agent assignment has changed
        IF (NEW.assigned_call_agent_id <> OLD.assigned_call_agent_id OR 
            NEW.assigned_field_agent_id <> OLD.assigned_field_agent_id) THEN
            
            -- Close the current record by setting end_date and is_current
            UPDATE workflow_service.customer_agents
            SET end_date = CURRENT_DATE, is_current = FALSE
            WHERE cif = NEW.cif AND is_current = TRUE;
            
            -- Insert a new record with the new assignment
            INSERT INTO workflow_service.customer_agents (
                cif, 
                assigned_call_agent_id, 
                assigned_field_agent_id, 
                start_date, 
                end_date, 
                is_current
            ) VALUES (
                NEW.cif,
                NEW.assigned_call_agent_id,
                NEW.assigned_field_agent_id,
                CURRENT_DATE,
                NULL,
                TRUE
            );
        END IF;
    END IF;
    
    -- For new assignments
    IF TG_OP = 'INSERT' THEN
        -- Insert a new record in the customer_agents table
        INSERT INTO workflow_service.customer_agents (
            cif, 
            assigned_call_agent_id, 
            assigned_field_agent_id, 
            start_date, 
            end_date, 
            is_current
        ) VALUES (
            NEW.cif,
            NEW.assigned_call_agent_id,
            NEW.assigned_field_agent_id,
            CURRENT_DATE,
            NULL,
            TRUE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.handle_customer_agent_assignment() IS 'Maintains historical records of customer agent assignments';

-- Trigger to track customer agent assignment changes
CREATE TRIGGER track_customer_agent_assignments
AFTER INSERT OR UPDATE OF assigned_call_agent_id, assigned_field_agent_id
ON workflow_service.customer_cases
FOR EACH ROW
EXECUTE FUNCTION workflow_service.handle_customer_agent_assignment();