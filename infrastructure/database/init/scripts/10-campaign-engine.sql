-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS campaign_engine;

DROP TABLE IF EXISTS campaign_engine.campaign_groups CASCADE;
DROP TABLE IF EXISTS campaign_engine.campaigns CASCADE;
DROP TABLE IF EXISTS campaign_engine.base_conditions CASCADE;
DROP TABLE IF EXISTS campaign_engine.contact_selection_rules CASCADE;
DROP TABLE IF EXISTS campaign_engine.contact_rule_conditions CASCADE;
DROP TABLE IF EXISTS campaign_engine.contact_rule_outputs CASCADE;
DROP TABLE IF EXISTS campaign_engine.custom_fields CASCADE;

-- Create campaign_groups table
CREATE TABLE campaign_engine.campaign_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);

COMMENT ON TABLE campaign_engine.campaign_groups IS 'Groups for organizing collection campaigns with priority.';

-- Create campaigns table
CREATE TABLE campaign_engine.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_group_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    priority INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_group_id, name),
    UNIQUE (campaign_group_id, priority),
    CONSTRAINT fk_campaign_group
        FOREIGN KEY (campaign_group_id)
        REFERENCES campaign_engine.campaign_groups(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.campaigns IS 'Individual collection campaigns within a group.';

-- Create base_conditions table
CREATE TABLE campaign_engine.base_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    field_value TEXT NOT NULL,
    data_source VARCHAR(50) NOT NULL, -- e.g., bank_sync_service.loans, bank_sync_service.customers, custom_fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_campaign_base_condition
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.base_conditions IS 'Conditions for selecting customers for a campaign.';

-- Create contact_selection_rules table
CREATE TABLE campaign_engine.contact_selection_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    rule_priority INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, rule_priority),
    CONSTRAINT fk_campaign_contact_rule
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.contact_selection_rules IS 'Rules for selecting contact information based on conditions.';

-- Create contact_rule_conditions table
CREATE TABLE campaign_engine.contact_rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_selection_rule_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    field_value TEXT NOT NULL,
    data_source VARCHAR(50) NOT NULL, -- e.g., bank_sync_service.loans, custom_fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_contact_rule_condition
        FOREIGN KEY (contact_selection_rule_id)
        REFERENCES campaign_engine.contact_selection_rules(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.contact_rule_conditions IS 'Conditions for a contact selection rule.';

-- Create contact_rule_outputs table
CREATE TABLE campaign_engine.contact_rule_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_selection_rule_id UUID NOT NULL,
    related_party_type VARCHAR(50) NOT NULL, -- e.g., 'customer', 'reference'
    contact_type VARCHAR(50) NOT NULL, -- e.g., 'mobile', 'home', 'work', 'all'
    relationship_patterns JSONB, -- Optional: JSON array of relationship types to exclude (e.g., ['parent', 'spouse', 'colleague'])
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_contact_rule_output
        FOREIGN KEY (contact_selection_rule_id)
        REFERENCES campaign_engine.contact_selection_rules(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.contact_rule_outputs IS 'Specifies which contact info to exclude if a rule is met. Uses relationship_patterns for flexible relationship filtering.';

-- Create custom_fields table
CREATE TABLE campaign_engine.custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name VARCHAR(100) NOT NULL UNIQUE,
    data_type VARCHAR(50) NOT NULL, -- e.g., 'string', 'number', 'date', 'boolean'
    description TEXT NOT NULL, -- Defines how to retrieve or calculate the value
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE campaign_engine.custom_fields IS 'Defines custom fields for campaign conditions.';

-- Add indexes for performance
CREATE INDEX idx_campaigns_campaign_group_id ON campaign_engine.campaigns(campaign_group_id);
CREATE INDEX idx_campaigns_priority ON campaign_engine.campaigns(priority);
CREATE INDEX idx_base_conditions_campaign_id ON campaign_engine.base_conditions(campaign_id);
CREATE INDEX idx_contact_selection_rules_campaign_id ON campaign_engine.contact_selection_rules(campaign_id);
CREATE INDEX idx_contact_selection_rules_rule_priority ON campaign_engine.contact_selection_rules(rule_priority);
CREATE INDEX idx_contact_rule_conditions_rule_id ON campaign_engine.contact_rule_conditions(contact_selection_rule_id);
CREATE INDEX idx_contact_rule_outputs_rule_id ON campaign_engine.contact_rule_outputs(contact_selection_rule_id);
CREATE INDEX idx_contact_rule_outputs_relationship_patterns ON campaign_engine.contact_rule_outputs USING GIN (relationship_patterns);


-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION campaign_engine.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_campaign_groups_updated_at
    BEFORE UPDATE ON campaign_engine.campaign_groups
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaign_engine.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_base_conditions_updated_at
    BEFORE UPDATE ON campaign_engine.base_conditions
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_contact_selection_rules_updated_at
    BEFORE UPDATE ON campaign_engine.contact_selection_rules
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_contact_rule_conditions_updated_at
    BEFORE UPDATE ON campaign_engine.contact_rule_conditions
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_contact_rule_outputs_updated_at
    BEFORE UPDATE ON campaign_engine.contact_rule_outputs
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON campaign_engine.custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

-- Create tables for storing campaign processing results and statistics

-- Drop tables if they exist (for rerunning this script)
DROP TABLE IF EXISTS campaign_engine.selected_contacts CASCADE;
DROP TABLE IF EXISTS campaign_engine.customer_assignments CASCADE;
DROP TABLE IF EXISTS campaign_engine.processing_errors CASCADE;
DROP TABLE IF EXISTS campaign_engine.campaign_statistics CASCADE;
DROP TABLE IF EXISTS campaign_engine.campaign_results CASCADE;
DROP TABLE IF EXISTS campaign_engine.campaign_processing_runs CASCADE;

-- Create campaign_processing_runs table to track each batch processing run
CREATE TABLE campaign_engine.campaign_processing_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL UNIQUE,
    campaign_group_ids UUID[] DEFAULT NULL, -- NULL means all groups were processed
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- running, completed, failed
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_duration_ms INTEGER,
    processing_options JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE campaign_engine.campaign_processing_runs IS 'Tracks each batch processing execution';

-- Create campaign_results table to store results for each campaign in a run
CREATE TABLE campaign_engine.campaign_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_run_id UUID NOT NULL,
    campaign_id UUID NOT NULL,
    campaign_name VARCHAR(100) NOT NULL,
    campaign_group_id UUID NOT NULL,
    campaign_group_name VARCHAR(100) NOT NULL,
    priority INTEGER NOT NULL,
    customers_assigned INTEGER NOT NULL DEFAULT 0,
    customers_with_contacts INTEGER NOT NULL DEFAULT 0,
    total_contacts_selected INTEGER NOT NULL DEFAULT 0,
    processing_duration_ms INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_processing_run
        FOREIGN KEY (processing_run_id)
        REFERENCES campaign_engine.campaign_processing_runs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.campaign_results IS 'Stores results for each campaign in a processing run';

-- Create customer_assignments table to store individual customer assignments
CREATE TABLE campaign_engine.customer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_result_id UUID NOT NULL,
    cif VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_campaign_result
        FOREIGN KEY (campaign_result_id)
        REFERENCES campaign_engine.campaign_results(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.customer_assignments IS 'Stores individual customer assignments for each campaign result';

-- Create selected_contacts table to store contacts selected for each customer
CREATE TABLE campaign_engine.selected_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_assignment_id UUID NOT NULL,
    contact_id VARCHAR(50) NOT NULL,
    contact_type VARCHAR(50) NOT NULL,
    contact_value VARCHAR(100) NOT NULL,
    related_party_type VARCHAR(50) NOT NULL,
    related_party_cif VARCHAR(50) NOT NULL,
    related_party_name VARCHAR(200),
    relationship_type VARCHAR(100),
    rule_priority INTEGER NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(20) NOT NULL, -- bank_sync or user_input
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_customer_assignment
        FOREIGN KEY (customer_assignment_id)
        REFERENCES campaign_engine.customer_assignments(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.selected_contacts IS 'Stores contacts selected for each customer assignment';

-- Create processing_errors table to track errors during processing
CREATE TABLE campaign_engine.processing_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_run_id UUID NOT NULL,
    campaign_id UUID,
    error_code VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_processing_run_error
        FOREIGN KEY (processing_run_id)
        REFERENCES campaign_engine.campaign_processing_runs(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.processing_errors IS 'Stores errors encountered during campaign processing';

-- Create campaign_statistics table for aggregated statistics
CREATE TABLE campaign_engine.campaign_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_run_id UUID NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    total_campaigns_processed INTEGER NOT NULL DEFAULT 0,
    total_groups_processed INTEGER NOT NULL DEFAULT 0,
    customers_with_assignments INTEGER NOT NULL DEFAULT 0,
    customers_without_assignments INTEGER NOT NULL DEFAULT 0,
    campaign_assignments_by_group JSONB, -- {group_id: count}
    most_assigned_campaign JSONB, -- {campaign_id, campaign_name, assignment_count}
    total_contacts_selected INTEGER NOT NULL DEFAULT 0,
    total_processing_duration_ms INTEGER NOT NULL,
    total_errors INTEGER NOT NULL DEFAULT 0,
    error_summary JSONB, -- {campaign_errors, processing_errors, most_common_error}
    performance_metrics JSONB, -- {total_database_queries, average_query_duration_ms, cache_hit_rate, customers_per_second}
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_processing_run_stats
        FOREIGN KEY (processing_run_id)
        REFERENCES campaign_engine.campaign_processing_runs(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.campaign_statistics IS 'Stores aggregated statistics for each processing run';

-- Create indexes for performance
CREATE INDEX idx_processing_runs_request_id ON campaign_engine.campaign_processing_runs(request_id);
CREATE INDEX idx_processing_runs_status ON campaign_engine.campaign_processing_runs(status);
CREATE INDEX idx_processing_runs_started_at ON campaign_engine.campaign_processing_runs(started_at DESC);

CREATE INDEX idx_campaign_results_processing_run ON campaign_engine.campaign_results(processing_run_id);
CREATE INDEX idx_campaign_results_campaign ON campaign_engine.campaign_results(campaign_id);

CREATE INDEX idx_customer_assignments_campaign_result ON campaign_engine.customer_assignments(campaign_result_id);
CREATE INDEX idx_customer_assignments_cif ON campaign_engine.customer_assignments(cif);

CREATE INDEX idx_selected_contacts_assignment ON campaign_engine.selected_contacts(customer_assignment_id);
CREATE INDEX idx_selected_contacts_contact_value ON campaign_engine.selected_contacts(contact_value);

CREATE INDEX idx_processing_errors_run ON campaign_engine.processing_errors(processing_run_id);
CREATE INDEX idx_processing_errors_campaign ON campaign_engine.processing_errors(campaign_id);
CREATE INDEX idx_processing_errors_code ON campaign_engine.processing_errors(error_code);

CREATE INDEX idx_campaign_statistics_run ON campaign_engine.campaign_statistics(processing_run_id);

-- Create triggers for updated_at
CREATE TRIGGER update_campaign_processing_runs_updated_at
    BEFORE UPDATE ON campaign_engine.campaign_processing_runs
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();


-- Create assignment tracking table optimized for daily processing runs
-- Assignments are only valid within a single processing run and cleaned up daily

-- Drop table if it exists (for rerunning this script)
DROP TABLE IF EXISTS campaign_engine.campaign_assignment_tracking CASCADE;

-- Create campaign assignment tracking table
CREATE TABLE IF NOT EXISTS campaign_engine.campaign_assignment_tracking (
    processing_run_id UUID NOT NULL,
    campaign_group_id UUID NOT NULL,
    cif VARCHAR(50) NOT NULL,
    campaign_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Primary key combines run + group + cif for uniqueness within run
    PRIMARY KEY (processing_run_id, campaign_group_id, cif),
    
    -- Foreign key constraints
    CONSTRAINT fk_assignment_tracking_processing_run
        FOREIGN KEY (processing_run_id)
        REFERENCES campaign_engine.campaign_processing_runs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_assignment_tracking_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.campaign_assignment_tracking IS 'Tracks customer assignments within each processing run to prevent duplicates, cleaned up daily';

-- Create indexes optimized for daily processing
CREATE INDEX idx_assignment_tracking_run_group ON campaign_engine.campaign_assignment_tracking(processing_run_id, campaign_group_id);
CREATE INDEX idx_assignment_tracking_assigned_at ON campaign_engine.campaign_assignment_tracking(assigned_at);

-- Create function to get assigned CIFs for a campaign group within current run
CREATE OR REPLACE FUNCTION campaign_engine.get_assigned_cifs_for_run_group(
    p_processing_run_id UUID,
    p_campaign_group_id UUID
) RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT cif 
        FROM campaign_engine.campaign_assignment_tracking 
        WHERE processing_run_id = p_processing_run_id 
        AND campaign_group_id = p_campaign_group_id
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to record campaign assignments in bulk for current run
CREATE OR REPLACE FUNCTION campaign_engine.record_run_campaign_assignments(
    p_processing_run_id UUID,
    p_campaign_group_id UUID,
    p_campaign_id UUID,
    p_assignments JSONB -- Array of {cif}
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    -- Insert assignments using JSONB array with ON CONFLICT DO NOTHING
    INSERT INTO campaign_engine.campaign_assignment_tracking (
        processing_run_id,
        campaign_group_id,
        cif,
        campaign_id,
        assigned_at
    )
    SELECT 
        p_processing_run_id,
        p_campaign_group_id,
        elem->>'cif',
        p_campaign_id,
        NOW()
    FROM jsonb_array_elements(p_assignments) AS elem
    ON CONFLICT (processing_run_id, campaign_group_id, cif) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup assignments older than specified days (for daily cleanup)
CREATE OR REPLACE FUNCTION campaign_engine.cleanup_old_assignments(
    p_days_to_keep INTEGER DEFAULT 7
) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete assignments from runs older than specified days
    DELETE FROM campaign_engine.campaign_assignment_tracking 
    WHERE assigned_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup assignments for completed processing runs older than 1 day
CREATE OR REPLACE FUNCTION campaign_engine.cleanup_completed_run_assignments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete assignments for processing runs that completed more than 1 day ago
    DELETE FROM campaign_engine.campaign_assignment_tracking cat
    WHERE EXISTS (
        SELECT 1 FROM campaign_engine.campaign_processing_runs cpr
        WHERE cpr.id = cat.processing_run_id
        AND cpr.status IN ('completed', 'failed')
        AND cpr.completed_at < NOW() - INTERVAL '1 day'
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create daily cleanup job function (to be called by cron or scheduler)
CREATE OR REPLACE FUNCTION campaign_engine.daily_assignment_cleanup()
RETURNS TABLE (
    completed_runs_cleaned INTEGER,
    old_assignments_cleaned INTEGER,
    total_remaining INTEGER
) AS $$
DECLARE
    completed_cleaned INTEGER;
    old_cleaned INTEGER;
    remaining INTEGER;
BEGIN
    -- Clean up assignments from completed runs
    SELECT campaign_engine.cleanup_completed_run_assignments() INTO completed_cleaned;
    
    -- Clean up any remaining old assignments (fallback)
    SELECT campaign_engine.cleanup_old_assignments(7) INTO old_cleaned;
    
    -- Count remaining assignments
    SELECT COUNT(*) FROM campaign_engine.campaign_assignment_tracking INTO remaining;
    
    RETURN QUERY SELECT completed_cleaned, old_cleaned, remaining;
END;
$$ LANGUAGE plpgsql;


-- Create stored procedures for campaign processing
-- These procedures are optimized to work with the new batch processing system
-- and are compatible with the assignment tracking table for scalable duplicate prevention

-- Drop functions if they exist (for rerunning this script)
DROP FUNCTION IF EXISTS campaign_engine.process_campaign(UUID, UUID, JSONB, JSONB, TEXT[], INTEGER);
DROP FUNCTION IF EXISTS campaign_engine.build_conditions_where_clause(JSONB);
DROP FUNCTION IF EXISTS campaign_engine.create_contacts_temp_table(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS campaign_engine.apply_contact_exclusion_rules(UUID, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS campaign_engine.build_rule_conditions_where(JSONB, TEXT);

-- Function to process a single campaign and return results
-- Updated to work with the new batch processing system
CREATE OR REPLACE FUNCTION campaign_engine.process_campaign(
    p_campaign_id UUID,
    p_campaign_group_id UUID,
    p_base_conditions JSONB,
    p_contact_rules JSONB,
    p_excluded_cifs TEXT[],
    p_max_contacts_per_customer INTEGER DEFAULT 3
) RETURNS TABLE (
    cif VARCHAR,
    segment VARCHAR,
    status VARCHAR,
    total_loans BIGINT,
    active_loans BIGINT,
    overdue_loans BIGINT,
    client_outstanding NUMERIC,
    total_due_amount NUMERIC,
    overdue_outstanding NUMERIC,
    max_dpd INTEGER,
    avg_dpd NUMERIC,
    utilization_ratio NUMERIC,
    contact_id UUID,
    contact_type VARCHAR,
    contact_value VARCHAR,
    related_party_type VARCHAR,
    related_party_cif VARCHAR,
    related_party_name VARCHAR,
    relationship_type VARCHAR,
    rule_priority INTEGER,
    is_primary BOOLEAN,
    is_verified BOOLEAN,
    source VARCHAR
) AS $$
DECLARE
    v_where_clause TEXT;
    v_exclude_clause TEXT;
    v_query TEXT;
BEGIN
    -- Build WHERE clause from base conditions
    v_where_clause := campaign_engine.build_conditions_where_clause(p_base_conditions);
    
    -- Build exclusion clause for already assigned customers
    IF p_excluded_cifs IS NOT NULL AND array_length(p_excluded_cifs, 1) > 0 THEN
        v_exclude_clause := format(' AND lcd.cif NOT IN (%s)', 
            array_to_string(
                ARRAY(SELECT quote_literal(excluded_cif) FROM unnest(p_excluded_cifs) AS excluded_cif), 
                ','
            )
        );
    ELSE
        v_exclude_clause := '';
    END IF;
    
    -- Create temp table for campaign customers
    EXECUTE format('
        CREATE TEMP TABLE temp_campaign_customers_%s AS
        SELECT DISTINCT 
            lcd.cif,
            lcd.segment,
            lcd.customer_status as status,
            lcd.total_loans,
            lcd.active_loans,
            lcd.overdue_loans,
            lcd.client_outstanding,
            lcd.total_due_amount,
            lcd.overdue_outstanding,
            lcd.max_dpd,
            lcd.avg_dpd,
            lcd.utilization_ratio
        FROM bank_sync_service.loan_campaign_data lcd
        WHERE %s %s',
        replace(p_campaign_id::text, '-', '_'),
        v_where_clause,
        v_exclude_clause
    );
    
    -- Create temp table for contacts
    PERFORM campaign_engine.create_contacts_temp_table(
        p_campaign_id,
        p_contact_rules,
        format('temp_campaign_customers_%s', replace(p_campaign_id::text, '-', '_'))
    );
    
    -- Return final results
    RETURN QUERY EXECUTE format('
        SELECT 
            tc.cif,
            tc.segment,
            tc.status,
            tc.total_loans,
            tc.active_loans,
            tc.overdue_loans,
            tc.client_outstanding,
            tc.total_due_amount,
            tc.overdue_outstanding,
            tc.max_dpd,
            tc.avg_dpd,
            tc.utilization_ratio,
            tcon.contact_id,
            tcon.contact_type,
            tcon.contact_value,
            tcon.related_party_type,
            tcon.related_party_cif,
            tcon.related_party_name,
            tcon.relationship_type,
            tcon.rule_priority,
            tcon.is_primary,
            tcon.is_verified,
            tcon.source
        FROM temp_campaign_customers_%s tc
        LEFT JOIN temp_campaign_contacts_%s tcon ON tc.cif = tcon.cif
        ORDER BY tc.cif, tcon.rule_priority NULLS LAST, tcon.is_primary DESC',
        replace(p_campaign_id::text, '-', '_'),
        replace(p_campaign_id::text, '-', '_')
    );
    
    -- Clean up temp tables
    EXECUTE format('DROP TABLE IF EXISTS temp_campaign_contacts_%s', replace(p_campaign_id::text, '-', '_'));
    EXECUTE format('DROP TABLE IF EXISTS temp_campaign_customers_%s', replace(p_campaign_id::text, '-', '_'));
    
END;
$$ LANGUAGE plpgsql;

-- Function to build WHERE clause from conditions
CREATE OR REPLACE FUNCTION campaign_engine.build_conditions_where_clause(
    p_conditions JSONB
) RETURNS TEXT AS $$
DECLARE
    v_condition JSONB;
    v_conditions TEXT[];
    v_field_name TEXT;
    v_operator TEXT;
    v_field_value TEXT;
    v_data_source TEXT;
    v_field_ref TEXT;
    v_condition_sql TEXT;
BEGIN
    IF p_conditions IS NULL OR jsonb_typeof(p_conditions) != 'array' OR jsonb_array_length(p_conditions) = 0 THEN
        RETURN '1=1';
    END IF;
    
    FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions)
    LOOP
        v_field_name := v_condition->>'field_name';
        v_operator := v_condition->>'operator';
        v_field_value := v_condition->>'field_value';
        v_data_source := v_condition->>'data_source';
        
        -- Determine field reference
        IF v_data_source = 'custom_fields' THEN
            -- For custom fields, we need to cast for numeric comparisons
            IF v_operator IN ('>', '>=', '<', '<=') THEN
                v_field_ref := format('(lcd.custom_fields->>%L)::numeric', v_field_name);
            ELSE
                v_field_ref := format('lcd.custom_fields->>%L', v_field_name);
            END IF;
        ELSE
            v_field_ref := format('lcd.%I', v_field_name);
        END IF;
        
        -- Build condition based on operator
        CASE v_operator
            WHEN '=' THEN
                v_condition_sql := format('%s = %L', v_field_ref, v_field_value);
            WHEN '!=' THEN
                v_condition_sql := format('%s != %L', v_field_ref, v_field_value);
            WHEN '>' THEN
                v_condition_sql := format('%s > %s', v_field_ref, v_field_value);
            WHEN '>=' THEN
                v_condition_sql := format('%s >= %s', v_field_ref, v_field_value);
            WHEN '<' THEN
                v_condition_sql := format('%s < %s', v_field_ref, v_field_value);
            WHEN '<=' THEN
                v_condition_sql := format('%s <= %s', v_field_ref, v_field_value);
            WHEN 'LIKE' THEN
                v_condition_sql := format('%s ILIKE %L', v_field_ref, '%' || v_field_value || '%');
            WHEN 'NOT_LIKE' THEN
                v_condition_sql := format('%s NOT ILIKE %L', v_field_ref, '%' || v_field_value || '%');
            WHEN 'IN' THEN
                v_condition_sql := format('%s IN (%s)', v_field_ref, 
                    (SELECT string_agg(quote_literal(trim(value)), ',') 
                     FROM unnest(string_to_array(v_field_value, ',')) AS value)
                );
            WHEN 'NOT_IN' THEN
                v_condition_sql := format('%s NOT IN (%s)', v_field_ref,
                    (SELECT string_agg(quote_literal(trim(value)), ',') 
                     FROM unnest(string_to_array(v_field_value, ',')) AS value)
                );
            WHEN 'IS_NULL' THEN
                v_condition_sql := format('%s IS NULL', v_field_ref);
            WHEN 'IS_NOT_NULL' THEN
                v_condition_sql := format('%s IS NOT NULL', v_field_ref);
            ELSE
                v_condition_sql := '1=1';
        END CASE;
        
        v_conditions := array_append(v_conditions, v_condition_sql);
    END LOOP;
    
    RETURN array_to_string(v_conditions, ' AND ');
END;
$$ LANGUAGE plpgsql;

-- Function to create contacts temp table with rule-based exclusions
CREATE OR REPLACE FUNCTION campaign_engine.create_contacts_temp_table(
    p_campaign_id UUID,
    p_contact_rules JSONB,
    p_customers_table TEXT
) RETURNS VOID AS $$
DECLARE
    v_table_name TEXT;
    v_all_contacts_table TEXT;
    v_has_rules BOOLEAN;
BEGIN
    v_table_name := format('temp_campaign_contacts_%s', replace(p_campaign_id::text, '-', '_'));
    v_all_contacts_table := v_table_name || '_all';
    v_has_rules := p_contact_rules IS NOT NULL AND jsonb_typeof(p_contact_rules) = 'array' AND jsonb_array_length(p_contact_rules) > 0;
    
    -- Create table with all contacts (using UNION to eliminate duplicates)
    EXECUTE format('
        CREATE TEMP TABLE %I AS
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            p.id as contact_id,
            p.type as contact_type,
            p.number as contact_value,
            ''customer''::varchar as related_party_type,
            tc.cif as related_party_cif,
            NULL::varchar as related_party_name,
            NULL::varchar as relationship_type,
            0 as rule_priority,
            p.is_primary,
            p.is_verified,
            ''bank_sync''::varchar as source
        FROM %I tc
        JOIN bank_sync_service.phones p ON tc.cif = p.cif
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            wp.id as contact_id,
            wp.type as contact_type,
            wp.number as contact_value,
            ''customer''::varchar as related_party_type,
            tc.cif as related_party_cif,
            NULL::varchar as related_party_name,
            NULL::varchar as relationship_type,
            0 as rule_priority,
            wp.is_primary,
            wp.is_verified,
            ''user_input''::varchar as source
        FROM %I tc
        JOIN workflow_service.phones wp ON tc.cif = wp.cif
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            rp.id as contact_id,
            rp.type as contact_type,
            rp.number as contact_value,
            ''reference''::varchar as related_party_type,
            rc.ref_cif as related_party_cif,
            rc.name as related_party_name,
            rc.relationship_type,
            0 as rule_priority,
            rp.is_primary,
            rp.is_verified,
            ''bank_sync''::varchar as source
        FROM %I tc
        JOIN bank_sync_service.reference_customers rc ON tc.cif = rc.primary_cif
        JOIN bank_sync_service.phones rp ON rc.ref_cif = rp.cif
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            wrp.id as contact_id,
            wrp.type as contact_type,
            wrp.number as contact_value,
            ''reference''::varchar as related_party_type,
            wrc.ref_cif as related_party_cif,
            wrc.name as related_party_name,
            wrc.relationship_type,
            0 as rule_priority,
            wrp.is_primary,
            wrp.is_verified,
            ''user_input''::varchar as source
        FROM %I tc
        JOIN workflow_service.reference_customers wrc ON tc.cif = wrc.primary_cif
        JOIN workflow_service.phones wrp ON wrc.ref_cif = wrp.cif',
        CASE WHEN v_has_rules THEN v_all_contacts_table ELSE v_table_name END,
        p_customers_table,
        p_customers_table,
        p_customers_table,
        p_customers_table
    );
    
    -- If we have rules, apply exclusions
    IF v_has_rules THEN
        PERFORM campaign_engine.apply_contact_exclusion_rules(
            p_campaign_id,
            p_contact_rules,
            p_customers_table,
            v_all_contacts_table,
            v_table_name
        );
        
        -- Clean up intermediate table
        EXECUTE format('DROP TABLE IF EXISTS %I', v_all_contacts_table);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to apply contact exclusion rules
CREATE OR REPLACE FUNCTION campaign_engine.apply_contact_exclusion_rules(
    p_campaign_id UUID,
    p_contact_rules JSONB,
    p_customers_table TEXT,
    p_all_contacts_table TEXT,
    p_final_table TEXT
) RETURNS VOID AS $$
DECLARE
    v_rule JSONB;
    v_rule_index INTEGER := 0;
    v_conditions_where TEXT;
    v_exclusion_conditions TEXT[];
    v_output JSONB;
    v_exclusion_parts TEXT[];
BEGIN
    -- Add columns for rule evaluations
    FOR v_rule IN SELECT * FROM jsonb_array_elements(p_contact_rules)
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN rule_%s_applies BOOLEAN DEFAULT FALSE', 
            p_all_contacts_table, v_rule_index);
        
        -- Build conditions for this rule
        v_conditions_where := campaign_engine.build_rule_conditions_where(
            v_rule->'conditions',
            p_customers_table
        );
        
        -- Update rule evaluation column
        IF v_conditions_where != '1=1' THEN
            -- Apply rule only to contacts matching specific conditions
            EXECUTE format('
                UPDATE %I tac
                SET rule_%s_applies = TRUE
                FROM %I tc
                WHERE tac.cif = tc.cif
                AND %s',
                p_all_contacts_table,
                v_rule_index,
                p_customers_table,
                v_conditions_where
            );
        ELSE
            -- No conditions means apply rule to ALL contacts
            EXECUTE format('UPDATE %I SET rule_%s_applies = TRUE', 
                p_all_contacts_table, v_rule_index);
        END IF;
        
        -- Build exclusion conditions for this rule
        FOR v_output IN SELECT * FROM jsonb_array_elements(v_rule->'outputs')
        LOOP
            v_exclusion_parts := ARRAY[format('rule_%s_applies = TRUE', v_rule_index)];
            
            -- Add contact type condition
            IF v_output->>'contact_type' IS NOT NULL AND v_output->>'contact_type' != 'all' THEN
                v_exclusion_parts := array_append(v_exclusion_parts, 
                    format('contact_type = %L', v_output->>'contact_type'));
            END IF;
            
            -- Add related party type condition
            IF v_output->>'related_party_type' IS NOT NULL AND v_output->>'related_party_type' != 'all' THEN
                IF v_output->>'related_party_type' = 'reference' AND 
                   v_output->'relationship_patterns' IS NOT NULL AND 
                   jsonb_typeof(v_output->'relationship_patterns') = 'array' AND
                   jsonb_array_length(v_output->'relationship_patterns') > 0 THEN
                    -- Add relationship pattern conditions
                    v_exclusion_parts := array_append(v_exclusion_parts,
                        format('(related_party_type = ''reference'' AND (%s))',
                            (SELECT string_agg(
                                format('LOWER(relationship_type) LIKE %L', '%' || lower(value::text) || '%'),
                                ' OR '
                            ) FROM jsonb_array_elements_text(v_output->'relationship_patterns'))
                        )
                    );
                ELSE
                    v_exclusion_parts := array_append(v_exclusion_parts,
                        format('related_party_type = %L', v_output->>'related_party_type'));
                END IF;
            END IF;
            
            IF v_exclusion_parts IS NOT NULL AND array_length(v_exclusion_parts, 1) > 1 THEN
                v_exclusion_conditions := array_append(v_exclusion_conditions,
                    format('(%s)', array_to_string(v_exclusion_parts, ' AND ')));
            END IF;
        END LOOP;
        
        v_rule_index := v_rule_index + 1;
    END LOOP;
    
    -- Create final table with exclusions applied
    EXECUTE format('
        CREATE TEMP TABLE %I AS
        SELECT 
            cif,
            contact_id,
            contact_type,
            contact_value,
            related_party_type,
            related_party_cif,
            related_party_name,
            relationship_type,
            rule_priority,
            is_primary,
            is_verified,
            source
        FROM %I
        WHERE NOT (%s)',
        p_final_table,
        p_all_contacts_table,
        COALESCE(array_to_string(v_exclusion_conditions, ' OR '), 'FALSE')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to build WHERE clause for rule conditions (references temp customer table)
CREATE OR REPLACE FUNCTION campaign_engine.build_rule_conditions_where(
    p_conditions JSONB,
    p_customers_table TEXT
) RETURNS TEXT AS $$
DECLARE
    v_condition JSONB;
    v_conditions TEXT[];
    v_field_name TEXT;
    v_operator TEXT;
    v_field_value TEXT;
    v_data_source TEXT;
    v_field_ref TEXT;
    v_condition_sql TEXT;
    v_needs_lcd_join BOOLEAN := FALSE;
BEGIN
    IF p_conditions IS NULL OR jsonb_typeof(p_conditions) != 'array' OR jsonb_array_length(p_conditions) = 0 THEN
        RETURN '1=1';
    END IF;
    
    FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions)
    LOOP
        v_field_name := v_condition->>'field_name';
        v_operator := v_condition->>'operator';
        v_field_value := v_condition->>'field_value';
        v_data_source := v_condition->>'data_source';
        
        -- Determine field reference
        IF v_data_source = 'custom_fields' THEN
            -- For custom fields, we need to cast for numeric comparisons
            IF v_operator IN ('>', '>=', '<', '<=') THEN
                v_field_ref := format('(lcd.custom_fields->>%L)::numeric', v_field_name);
            ELSE
                v_field_ref := format('lcd.custom_fields->>%L', v_field_name);
            END IF;
            v_needs_lcd_join := TRUE;
        ELSIF v_field_name IN ('segment', 'status', 'total_loans', 'active_loans', 
                               'overdue_loans', 'client_outstanding', 'total_due_amount',
                               'overdue_outstanding', 'max_dpd', 'avg_dpd', 'utilization_ratio') THEN
            -- These fields are available in the temp customer table
            v_field_ref := format('tc.%I', CASE WHEN v_field_name = 'customer_status' THEN 'status' ELSE v_field_name END);
        ELSE
            -- Other fields need to be joined from loan_campaign_data
            v_field_ref := format('lcd.%I', v_field_name);
            v_needs_lcd_join := TRUE;
        END IF;
        
        -- Build condition based on operator (similar to build_conditions_where_clause)
        CASE v_operator
            WHEN '=' THEN
                v_condition_sql := format('%s = %L', v_field_ref, v_field_value);
            WHEN '!=' THEN
                v_condition_sql := format('%s != %L', v_field_ref, v_field_value);
            WHEN '>' THEN
                v_condition_sql := format('%s > %s', v_field_ref, v_field_value);
            WHEN '>=' THEN
                v_condition_sql := format('%s >= %s', v_field_ref, v_field_value);
            WHEN '<' THEN
                v_condition_sql := format('%s < %s', v_field_ref, v_field_value);
            WHEN '<=' THEN
                v_condition_sql := format('%s <= %s', v_field_ref, v_field_value);
            WHEN 'LIKE' THEN
                v_condition_sql := format('%s ILIKE %L', v_field_ref, '%' || v_field_value || '%');
            WHEN 'NOT_LIKE' THEN
                v_condition_sql := format('%s NOT ILIKE %L', v_field_ref, '%' || v_field_value || '%');
            WHEN 'IN' THEN
                v_condition_sql := format('%s IN (%s)', v_field_ref, 
                    (SELECT string_agg(quote_literal(trim(value)), ',') 
                     FROM unnest(string_to_array(v_field_value, ',')) AS value)
                );
            WHEN 'NOT_IN' THEN
                v_condition_sql := format('%s NOT IN (%s)', v_field_ref,
                    (SELECT string_agg(quote_literal(trim(value)), ',') 
                     FROM unnest(string_to_array(v_field_value, ',')) AS value)
                );
            WHEN 'IS_NULL' THEN
                v_condition_sql := format('%s IS NULL', v_field_ref);
            WHEN 'IS_NOT_NULL' THEN
                v_condition_sql := format('%s IS NOT NULL', v_field_ref);
            ELSE
                v_condition_sql := '1=1';
        END CASE;
        
        v_conditions := array_append(v_conditions, v_condition_sql);
    END LOOP;
    
    -- If we need loan_campaign_data join, wrap conditions in EXISTS
    IF v_needs_lcd_join THEN
        RETURN format('EXISTS (SELECT 1 FROM bank_sync_service.loan_campaign_data lcd WHERE lcd.cif = tc.cif AND %s)',
            array_to_string(v_conditions, ' AND '));
    ELSE
        RETURN array_to_string(v_conditions, ' AND ');
    END IF;
END;
$$ LANGUAGE plpgsql;



-- Create batch processing stored procedures using direct inserts for optimal performance
-- This approach handles millions of customers efficiently without JSONB overhead

-- Drop functions if they exist (for rerunning this script)
DROP FUNCTION IF EXISTS campaign_engine.process_campaigns_batch(UUID, JSONB);
DROP FUNCTION IF EXISTS campaign_engine.process_single_campaign_direct(UUID, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS campaign_engine.create_processing_statistics_direct(UUID, BIGINT, INTEGER);
DROP FUNCTION IF EXISTS campaign_engine.get_processing_run_summary(UUID);

-- Main batch processing procedure that processes all campaigns in a processing run
CREATE OR REPLACE FUNCTION campaign_engine.process_campaigns_batch(
    p_processing_run_id UUID,
    p_campaign_groups JSONB -- Array of campaign group configurations
) RETURNS TABLE (
    processing_run_id UUID,
    total_customers_processed INTEGER,
    total_campaigns_processed INTEGER,
    total_errors INTEGER,
    processing_duration_ms BIGINT
) AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_group JSONB;
    v_campaign JSONB;
    v_total_customers INTEGER := 0;
    v_total_campaigns INTEGER := 0;
    v_total_errors INTEGER := 0;
    v_campaign_customers INTEGER;
BEGIN
    -- Process each campaign group
    FOR v_group IN SELECT * FROM jsonb_array_elements(p_campaign_groups)
    LOOP
        -- Process campaigns in priority order within each group
        FOR v_campaign IN 
            SELECT * FROM jsonb_array_elements(v_group->'campaigns') 
            ORDER BY (value->>'priority')::INTEGER ASC
        LOOP
            BEGIN
                -- Process single campaign with direct inserts
                SELECT * INTO v_campaign_customers 
                FROM campaign_engine.process_single_campaign_direct(
                    p_processing_run_id,
                    (v_group->>'id')::UUID,
                    v_group->>'name',
                    v_campaign
                );
                
                -- Update totals
                v_total_customers := v_total_customers + v_campaign_customers;
                v_total_campaigns := v_total_campaigns + 1;
                
            EXCEPTION WHEN OTHERS THEN
                -- Log error and continue with next campaign
                INSERT INTO campaign_engine.processing_errors (
                    processing_run_id,
                    campaign_id,
                    error_code,
                    error_message
                ) VALUES (
                    p_processing_run_id,
                    (v_campaign->>'id')::UUID,
                    'CAMPAIGN_PROCESSING_ERROR',
                    format('Failed to process campaign %s: %s', v_campaign->>'name', SQLERRM)
                );
                
                v_total_errors := v_total_errors + 1;
            END;
        END LOOP;
    END LOOP;
    
    -- Create processing statistics
    PERFORM campaign_engine.create_processing_statistics_direct(
        p_processing_run_id,
        EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time) * 1000)::BIGINT,
        v_total_errors
    );
    
    -- Return processing summary
    RETURN QUERY SELECT 
        p_processing_run_id,
        v_total_customers,
        v_total_campaigns,
        v_total_errors,
        EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time) * 1000)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Process a single campaign with direct inserts to final tables
CREATE OR REPLACE FUNCTION campaign_engine.process_single_campaign_direct(
    p_processing_run_id UUID,
    p_campaign_group_id UUID,
    p_campaign_group_name TEXT,
    p_campaign JSONB
) RETURNS INTEGER AS $$
DECLARE
    v_campaign_id UUID := (p_campaign->>'id')::UUID;
    v_campaign_name TEXT := p_campaign->>'name';
    v_campaign_priority INTEGER := (p_campaign->>'priority')::INTEGER;
    v_base_conditions JSONB := p_campaign->'base_conditions';
    v_contact_rules JSONB := p_campaign->'contact_selection_rules';
    v_max_contacts INTEGER := 3;
    v_excluded_cifs TEXT[];
    v_campaign_result_id UUID;
    v_customers_assigned INTEGER := 0;
    v_customers_with_contacts INTEGER := 0;
    v_total_contacts INTEGER := 0;
    v_start_time TIMESTAMP := clock_timestamp();
    v_processing_duration BIGINT;
BEGIN
    -- Get already assigned CIFs for this group in current run
    v_excluded_cifs := campaign_engine.get_assigned_cifs_for_run_group(
        p_processing_run_id, 
        p_campaign_group_id
    );
    
    -- Create temporary table for campaign results
    CREATE TEMP TABLE temp_campaign_processing AS
    SELECT * FROM campaign_engine.process_campaign(
        v_campaign_id,
        p_campaign_group_id,
        v_base_conditions,
        v_contact_rules,
        v_excluded_cifs,
        v_max_contacts
    );
    
    -- Get counts for campaign result record
    SELECT 
        COUNT(DISTINCT cif),
        COUNT(DISTINCT CASE WHEN contact_id IS NOT NULL THEN cif END),
        COUNT(contact_id)
    INTO v_customers_assigned, v_customers_with_contacts, v_total_contacts
    FROM temp_campaign_processing;
    
    -- Calculate processing duration
    v_processing_duration := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time) * 1000)::BIGINT;
    
    -- Insert campaign result record
    INSERT INTO campaign_engine.campaign_results (
        processing_run_id,
        campaign_id,
        campaign_name,
        campaign_group_id,
        campaign_group_name,
        priority,
        customers_assigned,
        customers_with_contacts,
        total_contacts_selected,
        processing_duration_ms
    ) VALUES (
        p_processing_run_id,
        v_campaign_id,
        v_campaign_name,
        p_campaign_group_id,
        p_campaign_group_name,
        v_campaign_priority,
        v_customers_assigned,
        v_customers_with_contacts,
        v_total_contacts,
        v_processing_duration
    ) RETURNING id INTO v_campaign_result_id;
    
    -- Insert customer assignments directly in bulk
    INSERT INTO campaign_engine.customer_assignments (
        campaign_result_id,
        cif,
        assigned_at
    )
    SELECT DISTINCT
        v_campaign_result_id,
        cif,
        NOW()
    FROM temp_campaign_processing;
    
    -- Insert selected contacts directly in bulk using a single query
    INSERT INTO campaign_engine.selected_contacts (
        customer_assignment_id,
        contact_id,
        contact_type,
        contact_value,
        related_party_type,
        related_party_cif,
        related_party_name,
        relationship_type,
        rule_priority,
        is_primary,
        is_verified,
        source
    )
    SELECT 
        ca.id,
        tcp.contact_id,
        tcp.contact_type,
        tcp.contact_value,
        tcp.related_party_type,
        tcp.related_party_cif,
        tcp.related_party_name,
        tcp.relationship_type,
        tcp.rule_priority,
        tcp.is_primary,
        tcp.is_verified,
        tcp.source
    FROM temp_campaign_processing tcp
    JOIN campaign_engine.customer_assignments ca ON (
        ca.campaign_result_id = v_campaign_result_id
        AND ca.cif = tcp.cif
    )
    WHERE tcp.contact_id IS NOT NULL;
    
    -- Record assignments in tracking table for duplicate prevention
    PERFORM campaign_engine.record_run_campaign_assignments(
        p_processing_run_id,
        p_campaign_group_id,
        v_campaign_id,
        jsonb_agg(jsonb_build_object('cif', cif))
    ) FROM (
        SELECT DISTINCT cif 
        FROM temp_campaign_processing
    ) assigned_customers;
    
    -- Clean up temp table
    DROP TABLE temp_campaign_processing;
    
    RETURN v_customers_assigned;
END;
$$ LANGUAGE plpgsql;

-- Create processing statistics using direct queries instead of JSONB manipulation
CREATE OR REPLACE FUNCTION campaign_engine.create_processing_statistics_direct(
    p_processing_run_id UUID,
    p_total_duration_ms BIGINT,
    p_total_errors INTEGER
) RETURNS VOID AS $$
DECLARE
    v_total_customers INTEGER;
    v_total_campaigns INTEGER;
    v_total_groups INTEGER;
    v_total_contacts INTEGER;
    v_most_assigned_campaign_id UUID;
    v_most_assigned_campaign_name TEXT;
    v_most_assigned_count INTEGER;
BEGIN
    -- Get basic statistics from campaign results
    SELECT 
        COALESCE(SUM(customers_assigned), 0),
        COUNT(*),
        COUNT(DISTINCT campaign_group_id),
        COALESCE(SUM(total_contacts_selected), 0)
    INTO v_total_customers, v_total_campaigns, v_total_groups, v_total_contacts
    FROM campaign_engine.campaign_results
    WHERE processing_run_id = p_processing_run_id;
    
    -- Find most assigned campaign
    SELECT campaign_id, campaign_name, customers_assigned
    INTO v_most_assigned_campaign_id, v_most_assigned_campaign_name, v_most_assigned_count
    FROM campaign_engine.campaign_results
    WHERE processing_run_id = p_processing_run_id
    ORDER BY customers_assigned DESC
    LIMIT 1;
    
    -- Insert statistics record
    INSERT INTO campaign_engine.campaign_statistics (
        processing_run_id,
        total_customers,
        total_campaigns_processed,
        total_groups_processed,
        customers_with_assignments,
        customers_without_assignments,
        campaign_assignments_by_group,
        most_assigned_campaign,
        total_contacts_selected,
        total_processing_duration_ms,
        total_errors,
        error_summary,
        performance_metrics
    ) VALUES (
        p_processing_run_id,
        v_total_customers,
        v_total_campaigns,
        v_total_groups,
        v_total_customers, -- All processed customers get assignments
        0, -- No customers without assignments
        -- Campaign assignments by group (calculated as subquery)
        (
            SELECT jsonb_object_agg(campaign_group_id::TEXT, total_assigned)
            FROM (
                SELECT campaign_group_id, SUM(customers_assigned) as total_assigned
                FROM campaign_engine.campaign_results
                WHERE processing_run_id = p_processing_run_id
                GROUP BY campaign_group_id
            ) grouped
        ),
        -- Most assigned campaign
        jsonb_build_object(
            'campaign_id', COALESCE(v_most_assigned_campaign_id::TEXT, ''),
            'campaign_name', COALESCE(v_most_assigned_campaign_name, ''),
            'assignment_count', COALESCE(v_most_assigned_count, 0)
        ),
        v_total_contacts,
        p_total_duration_ms,
        p_total_errors,
        -- Error summary
        jsonb_build_object(
            'campaign_errors', p_total_errors,
            'processing_errors', 0,
            'most_common_error', CASE WHEN p_total_errors > 0 THEN 'CAMPAIGN_PROCESSING_ERROR' ELSE 'None' END
        ),
        -- Performance metrics
        jsonb_build_object(
            'total_database_queries', 1,
            'average_query_duration_ms', p_total_duration_ms,
            'cache_hit_rate', 0,
            'customers_per_second', 
            CASE 
                WHEN p_total_duration_ms > 0 THEN (v_total_customers::NUMERIC / p_total_duration_ms * 1000)
                ELSE 0 
            END
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Utility function to get processing run summary (for TypeScript service)
CREATE OR REPLACE FUNCTION campaign_engine.get_processing_run_summary(
    p_processing_run_id UUID
) RETURNS TABLE (
    request_id UUID,
    total_customers INTEGER,
    total_campaigns INTEGER,
    total_groups INTEGER,
    total_contacts INTEGER,
    total_errors INTEGER,
    processing_duration_ms BIGINT,
    campaign_results_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cpr.request_id,
        COALESCE(cs.total_customers, 0),
        COALESCE(cs.total_campaigns_processed, 0),
        COALESCE(cs.total_groups_processed, 0),
        COALESCE(cs.total_contacts_selected, 0),
        COALESCE(cs.total_errors, 0),
        COALESCE(cs.total_processing_duration_ms, 0)::BIGINT,
        (SELECT COUNT(*) FROM campaign_engine.campaign_results WHERE processing_run_id = p_processing_run_id)::INTEGER
    FROM campaign_engine.campaign_processing_runs cpr
    LEFT JOIN campaign_engine.campaign_statistics cs ON cs.processing_run_id = cpr.id
    WHERE cpr.id = p_processing_run_id;
END;
$$ LANGUAGE plpgsql;