--/home/code/CollectionCRM/src/services/campaign-engine/database/migrations/create_campaign_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS campaign_engine;

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
    contact_type VARCHAR(50), -- e.g., 'mobile', 'home', 'work', 'all', NULL for all types
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
    field_column VARCHAR(20) NOT NULL UNIQUE, -- Maps to field_1, field_2, etc.
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


-------------------------------------------
-- /home/code/CollectionCRM/src/services/campaign-engine/database/migrations/create_campaign_results_tables.sql

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

-----------------------------------------------------------------------------
-- /home/code/CollectionCRM/src/services/campaign-engine/database/migrations/create_campaign_processing_procedures.sql


-- Create stored procedures for campaign processing
-- These procedures are optimized to work with the new batch processing system
-- and are compatible with the assignment tracking table for scalable duplicate prevention

-- Drop functions if they exist (for rerunning this script)
DROP FUNCTION IF EXISTS campaign_engine.process_campaign(UUID, UUID, JSONB, JSONB, TEXT[], INTEGER);
DROP FUNCTION IF EXISTS campaign_engine.process_campaign(UUID, UUID, UUID, JSONB, JSONB, INTEGER);
DROP FUNCTION IF EXISTS campaign_engine.build_conditions_where_clause(JSONB);
DROP FUNCTION IF EXISTS campaign_engine.create_contacts_temp_table(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS campaign_engine.apply_contact_exclusion_rules(UUID, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS campaign_engine.build_rule_conditions_where(JSONB, TEXT);

-- Function to process a single campaign and return results
-- Updated to use EXISTS instead of array exclusion for better performance
CREATE OR REPLACE FUNCTION campaign_engine.process_campaign(
    p_campaign_id UUID,
    p_campaign_group_id UUID,
    p_processing_run_id UUID,
    p_base_conditions JSONB,
    p_contact_rules JSONB,
    p_max_contacts_per_customer INTEGER DEFAULT 3
) RETURNS TABLE (
    cif VARCHAR,
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
    
    -- Build exclusion clause using EXISTS for already assigned customers (much more efficient)
    v_exclude_clause := format(' AND NOT EXISTS (
        SELECT 1 FROM campaign_engine.campaign_assignment_tracking cat
        WHERE cat.processing_run_id = %L
        AND cat.campaign_group_id = %L
        AND cat.cif = lcd.cif
    )', p_processing_run_id, p_campaign_group_id);
    
    -- Create temp table for campaign customers
    v_query := format('
        CREATE TEMP TABLE temp_campaign_customers_%s AS
        SELECT DISTINCT 
            lcd.*
        FROM bank_sync_service.loan_campaign_data lcd
        WHERE %s %s',
        replace(p_campaign_id::text, '-', '_'),
        v_where_clause,
        v_exclude_clause
    );
    
    -- Debug: Write the customer selection SQL to file
    PERFORM campaign_engine.safe_file_write(
        format('/tmp/campaign_debug_%s.sql', replace(p_campaign_id::text, '-', '_')), 
        format('-- ==================== CAMPAIGN CUSTOMER SELECTION SQL ====================
-- Campaign ID: %s
-- WHERE clause: %s
-- EXCLUDE clause: %s
-- Generated at: %s

%s;

', p_campaign_id, v_where_clause, v_exclude_clause, now(), v_query), 
        false
    );
    
    RAISE NOTICE '==================== CAMPAIGN CUSTOMER SELECTION SQL ====================';
    RAISE NOTICE 'Campaign ID: %', p_campaign_id;
    RAISE NOTICE 'WHERE clause: %', v_where_clause;
    RAISE NOTICE 'EXCLUDE clause: %', v_exclude_clause;
    RAISE NOTICE 'Full Query: %', v_query;
    RAISE NOTICE 'SQL written to: /tmp/campaign_debug_%.sql', replace(p_campaign_id::text, '-', '_');
    RAISE NOTICE '========================================================================';
    
    EXECUTE v_query;
    
    -- Create temp table for contacts
    PERFORM campaign_engine.create_contacts_temp_table(
        p_campaign_id,
        p_contact_rules,
        format('temp_campaign_customers_%s', replace(p_campaign_id::text, '-', '_'))
    );
    
    -- Return final results
    v_query := format('
        SELECT 
            tcon.cif,
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
        FROM temp_campaign_contacts_%s tcon',
        replace(p_campaign_id::text, '-', '_')
    );
    
    -- Debug: Append the final results SQL to file
    PERFORM campaign_engine.safe_file_write(
        format('/tmp/campaign_debug_%s.sql', replace(p_campaign_id::text, '-', '_')), 
        format('
-- ==================== CAMPAIGN FINAL RESULTS SQL ====================
-- Generated at: %s

%s;

', now(), v_query), 
        true
    );
    
    RAISE NOTICE '==================== CAMPAIGN FINAL RESULTS SQL ====================';
    RAISE NOTICE 'Final Query: %', v_query;
    RAISE NOTICE '====================================================================';
    
    RETURN QUERY EXECUTE v_query;
    
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
            -- For custom fields, look up the column mapping
            DECLARE
                v_field_column TEXT;
            BEGIN
                SELECT field_column INTO v_field_column
                FROM campaign_engine.custom_fields
                WHERE field_name = v_field_name;
                
                IF v_field_column IS NULL THEN
                    RAISE EXCEPTION 'Custom field % not found in mapping', v_field_name;
                END IF;
                
                -- Use the mapped column directly
                IF v_operator IN ('>', '>=', '<', '<=') THEN
                    v_field_ref := format('lcd.%I::numeric', v_field_column);
                ELSE
                    v_field_ref := format('lcd.%I', v_field_column);
                END IF;
            END;
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
    
    -- Debug: Print the built WHERE clause
    RAISE NOTICE '==================== CONDITIONS WHERE CLAUSE ====================';
    RAISE NOTICE 'Built WHERE clause: %', array_to_string(v_conditions, ' AND ');
    RAISE NOTICE '===============================================================';
    
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
    v_query TEXT;
BEGIN
    v_table_name := format('temp_campaign_contacts_%s', replace(p_campaign_id::text, '-', '_'));
    v_all_contacts_table := v_table_name || '_all';
    v_has_rules := p_contact_rules IS NOT NULL AND jsonb_typeof(p_contact_rules) = 'array' AND jsonb_array_length(p_contact_rules) > 0;
    
    -- Create table with all contacts (using UNION to eliminate duplicates)
    v_query := format('
        CREATE TEMP TABLE %I AS
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            p.id as contact_id,
            p.type as contact_type,
            p.number as contact_value,
            ''customer''::varchar as related_party_type,
            tc.cif as related_party_cif,
            tc.name as related_party_name,
            NULL::varchar as relationship_type,
            0 as rule_priority,
            p.is_primary,
            p.is_verified,
            ''bank_sync''::varchar as source
        FROM %I tc
        JOIN bank_sync_service.phones p ON tc.cif = p.cif
        WHERE p.ref_cif IS NULL
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            wp.id as contact_id,
            wp.type as contact_type,
            wp.number as contact_value,
            ''customer''::varchar as related_party_type,
            tc.cif as related_party_cif,
            tc.name as related_party_name,
            NULL::varchar as relationship_type,
            0 as rule_priority,
            wp.is_primary,
            wp.is_verified,
            ''user_input''::varchar as source
        FROM %I tc
        JOIN workflow_service.phones wp ON tc.cif = wp.cif
        WHERE wp.ref_cif IS NULL
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            rp.id as contact_id,
            rp.type as contact_type,
            rp.number as contact_value,
            ''reference''::varchar as related_party_type,
            rc.ref_cif as related_party_cif,
            COALESCE(rc.name, rc.company_name) as related_party_name,
            rc.relationship_type,
            0 as rule_priority,
            rp.is_primary,
            rp.is_verified,
            ''bank_sync''::varchar as source
        FROM %I tc
        JOIN bank_sync_service.reference_customers rc ON tc.cif = rc.primary_cif
        JOIN bank_sync_service.phones rp ON rc.ref_cif = rp.ref_cif
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            wrp.id as contact_id,
            wrp.type as contact_type,
            wrp.number as contact_value,
            ''reference''::varchar as related_party_type,
            wrc.ref_cif as related_party_cif,
            COALESCE(wrc.name, wrc.company_name) as related_party_name,
            wrc.relationship_type,
            0 as rule_priority,
            wrp.is_primary,
            wrp.is_verified,
            ''user_input''::varchar as source
        FROM %I tc
        JOIN workflow_service.reference_customers wrc ON tc.cif = wrc.primary_cif
        JOIN workflow_service.phones wrp ON wrc.ref_cif = wrp.ref_cif
        
        UNION
        
        SELECT DISTINCT ON (cif, contact_id)
            tc.cif,
            wp.id as contact_id,
            wp.type as contact_type,
            wp.number as contact_value,
            ''reference''::varchar as related_party_type,
            rc.ref_cif as related_party_cif,
            COALESCE(rc.name, rc.company_name) as related_party_name,
            rc.relationship_type,
            0 as rule_priority,
            wp.is_primary,
            wp.is_verified,
            ''mixed''::varchar as source
        FROM %I tc
        JOIN bank_sync_service.reference_customers rc ON tc.cif = rc.primary_cif
        JOIN workflow_service.phones wp ON rc.ref_cif = wp.ref_cif',
        CASE WHEN v_has_rules THEN v_all_contacts_table ELSE v_table_name END,
        p_customers_table,
        p_customers_table,
        p_customers_table,
        p_customers_table,
        p_customers_table
    );
    
    -- Debug: Append the contacts creation SQL to file
    PERFORM campaign_engine.safe_file_write(
        format('/tmp/campaign_debug_%s.sql', replace(p_campaign_id::text, '-', '_')), 
        format('
-- ==================== CONTACTS CREATION SQL ====================
-- Campaign ID: %s
-- Has rules: %s
-- Target table: %s
-- Generated at: %s

%s;

', p_campaign_id, v_has_rules, CASE WHEN v_has_rules THEN v_all_contacts_table ELSE v_table_name END, now(), v_query), 
        true
    );
    
    RAISE NOTICE '==================== CONTACTS CREATION SQL ====================';
    RAISE NOTICE 'Campaign ID: %', p_campaign_id;
    RAISE NOTICE 'Has rules: %', v_has_rules;
    RAISE NOTICE 'Target table: %', CASE WHEN v_has_rules THEN v_all_contacts_table ELSE v_table_name END;
    RAISE NOTICE 'Query: %', v_query;
    RAISE NOTICE '================================================================';
    
    EXECUTE v_query;
    
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
    v_query TEXT;
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
            v_query := format('
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
            
            -- Debug: Append rule condition SQL to file
            PERFORM campaign_engine.safe_file_write(
                format('/tmp/campaign_debug_%s.sql', replace(p_campaign_id::text, '-', '_')), 
                format('
-- ==================== CONTACT RULE %s CONDITION SQL ====================
-- Rule conditions WHERE: %s
-- Generated at: %s

%s;

', v_rule_index, v_conditions_where, now(), v_query), 
                true
            );
            
            RAISE NOTICE '==================== CONTACT RULE % CONDITION SQL ====================', v_rule_index;
            RAISE NOTICE 'Rule conditions WHERE: %', v_conditions_where;
            RAISE NOTICE 'Update Query: %', v_query;
            RAISE NOTICE '====================================================================';
            
            EXECUTE v_query;
        ELSE
            -- No conditions means apply rule to ALL contacts
            v_query := format('UPDATE %I SET rule_%s_applies = TRUE', 
                p_all_contacts_table, v_rule_index);
                
            -- Debug: Append rule condition SQL to file
            PERFORM campaign_engine.safe_file_write(
                format('/tmp/campaign_debug_%s.sql', replace(p_campaign_id::text, '-', '_')), 
                format('
-- ==================== CONTACT RULE %s CONDITION SQL ====================
-- Rule conditions WHERE: %s (applies to ALL)
-- Generated at: %s

%s;

', v_rule_index, v_conditions_where, now(), v_query), 
                true
            );
                
            RAISE NOTICE '==================== CONTACT RULE % CONDITION SQL ====================', v_rule_index;
            RAISE NOTICE 'Rule conditions WHERE: % (applies to ALL)', v_conditions_where;
            RAISE NOTICE 'Update Query: %', v_query;
            RAISE NOTICE '====================================================================';
            
            EXECUTE v_query;
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
    v_query := format('
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
    
    -- Debug: Append final exclusion SQL to file
    PERFORM campaign_engine.safe_file_write(
        format('/tmp/campaign_debug_%s.sql', replace(p_campaign_id::text, '-', '_')), 
        format('
-- ==================== FINAL CONTACT EXCLUSION SQL ====================
-- Exclusion conditions: %s
-- Generated at: %s

%s;

', COALESCE(array_to_string(v_exclusion_conditions, ' OR '), 'FALSE'), now(), v_query), 
        true
    );
    
    RAISE NOTICE '==================== FINAL CONTACT EXCLUSION SQL ====================';
    RAISE NOTICE 'Exclusion conditions: %', COALESCE(array_to_string(v_exclusion_conditions, ' OR '), 'FALSE');
    RAISE NOTICE 'Final Query: %', v_query;
    RAISE NOTICE '======================================================================';
    
    EXECUTE v_query;
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
            -- For custom fields, look up the column mapping
            DECLARE
                v_field_column TEXT;
            BEGIN
                SELECT field_column INTO v_field_column
                FROM campaign_engine.custom_fields
                WHERE field_name = v_field_name;
                
                IF v_field_column IS NULL THEN
                    RAISE EXCEPTION 'Custom field % not found in mapping', v_field_name;
                END IF;
                
                -- Use the mapped column directly
                IF v_operator IN ('>', '>=', '<', '<=') THEN
                    v_field_ref := format('tc.%I::numeric', v_field_column);
                ELSE
                    v_field_ref := format('tc.%I', v_field_column);
                END IF;
            END;
        ELSE
            v_field_ref := format('tc.%I', v_field_name);
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

    RETURN array_to_string(v_conditions, ' AND ');

END;
$$ LANGUAGE plpgsql;


------------------------------------------------
-- /home/code/CollectionCRM/src/services/campaign-engine/database/migrations/create_batch_processing_procedures.sql
-- Create batch processing stored procedures using direct inserts for optimal performance
-- This approach handles millions of customers efficiently without JSONB overhead

-- Drop functions if they exist (for rerunning this script)
DROP FUNCTION IF EXISTS campaign_engine.process_campaigns_batch(UUID, JSONB);
DROP FUNCTION IF EXISTS campaign_engine.process_single_campaign_direct(UUID, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS campaign_engine.create_processing_statistics_direct(UUID, UUID, BIGINT, INTEGER);
DROP FUNCTION IF EXISTS campaign_engine.get_processing_run_summary(UUID);

-- Main batch processing procedure that processes all campaigns for a single campaign group
CREATE OR REPLACE FUNCTION campaign_engine.process_campaigns_batch(
    p_processing_run_id UUID,
    p_campaign_group JSONB -- Single campaign group configuration
) RETURNS TABLE (
    processing_run_id UUID,
    campaign_group_id UUID,
    total_customers_processed INTEGER,
    total_campaigns_processed INTEGER,
    total_errors INTEGER,
    processing_duration_ms BIGINT
) AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_campaign JSONB;
    v_total_customers INTEGER := 0;
    v_total_campaigns INTEGER := 0;
    v_total_errors INTEGER := 0;
    v_campaign_customers INTEGER;
    v_campaign_group_id UUID := (p_campaign_group->>'id')::UUID;
BEGIN
    -- Process campaigns in priority order within the group
    FOR v_campaign IN 
        SELECT * FROM jsonb_array_elements(p_campaign_group->'campaigns') 
        ORDER BY (value->>'priority')::INTEGER ASC
    LOOP
        BEGIN
            -- Process single campaign with direct inserts
            SELECT * INTO v_campaign_customers 
            FROM campaign_engine.process_single_campaign_direct(
                p_processing_run_id,
                v_campaign_group_id,
                p_campaign_group->>'name',
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
    
    -- Create processing statistics for this campaign group
    PERFORM campaign_engine.create_processing_statistics_direct(
        p_processing_run_id,
        v_campaign_group_id,
        EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time) * 1000)::BIGINT,
        v_total_errors
    );
    
    -- Return processing summary
    RETURN QUERY SELECT 
        p_processing_run_id,
        v_campaign_group_id,
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
    v_campaign_result_id UUID;
    v_customers_assigned INTEGER := 0;
    v_customers_with_contacts INTEGER := 0;
    v_total_contacts INTEGER := 0;
    v_start_time TIMESTAMP := clock_timestamp();
    v_processing_duration BIGINT;
BEGIN
    -- Create temporary table for campaign results using new efficient function
    CREATE TEMP TABLE temp_campaign_processing AS
    SELECT * FROM campaign_engine.process_campaign(
        v_campaign_id,
        p_campaign_group_id,
        p_processing_run_id,
        v_base_conditions,
        v_contact_rules,
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
    
    -- Record assignments in tracking table for duplicate prevention (direct insert)
    INSERT INTO campaign_engine.campaign_assignment_tracking (
        processing_run_id,
        campaign_group_id,
        cif,
        campaign_id,
        assigned_at
    )
    SELECT DISTINCT
        p_processing_run_id,
        p_campaign_group_id,
        cif,
        v_campaign_id,
        NOW()
    FROM temp_campaign_processing
    ON CONFLICT (processing_run_id, campaign_group_id, cif) DO NOTHING;
    
    -- Clean up temp table
    DROP TABLE temp_campaign_processing;
    
    RETURN v_customers_assigned;
END;
$$ LANGUAGE plpgsql;

-- Create processing statistics for a single campaign group using direct queries
CREATE OR REPLACE FUNCTION campaign_engine.create_processing_statistics_direct(
    p_processing_run_id UUID,
    p_campaign_group_id UUID,
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
    v_campaign_group_name TEXT;
BEGIN
    -- Get basic statistics from campaign results for this campaign group
    SELECT 
        COALESCE(SUM(customers_assigned), 0),
        COUNT(*),
        1, -- Only processing one group
        COALESCE(SUM(total_contacts_selected), 0),
        MAX(campaign_group_name) -- Get the group name
    INTO v_total_customers, v_total_campaigns, v_total_groups, v_total_contacts, v_campaign_group_name
    FROM campaign_engine.campaign_results
    WHERE processing_run_id = p_processing_run_id
    AND campaign_group_id = p_campaign_group_id;
    
    -- Find most assigned campaign for this campaign group
    SELECT campaign_id, campaign_name, customers_assigned
    INTO v_most_assigned_campaign_id, v_most_assigned_campaign_name, v_most_assigned_count
    FROM campaign_engine.campaign_results
    WHERE processing_run_id = p_processing_run_id
    AND campaign_group_id = p_campaign_group_id
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
        -- Campaign assignments for this group only
        jsonb_build_object(
            p_campaign_group_id::TEXT, jsonb_build_object(
                'group_name', COALESCE(v_campaign_group_name, 'Unknown'),
                'total_assigned', v_total_customers
            )
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
        -- Performance metrics (simplified to meaningful metrics only)
        jsonb_build_object(
            'total_duration_seconds', ROUND(p_total_duration_ms::NUMERIC / 1000, 2),
            'customers_per_second', 
            CASE 
                WHEN p_total_duration_ms > 0 THEN ROUND(v_total_customers::NUMERIC / p_total_duration_ms * 1000, 2)
                ELSE 0 
            END
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Utility function to get processing run summary (for TypeScript service)
-- Aggregates data directly from campaign_statistics table
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
        (SELECT cpr.request_id FROM campaign_engine.campaign_processing_runs cpr WHERE cpr.id = p_processing_run_id),
        COALESCE(SUM(cs.total_customers), 0)::INTEGER,
        COALESCE(SUM(cs.total_campaigns_processed), 0)::INTEGER,
        COALESCE(COUNT(*), 0)::INTEGER,
        COALESCE(SUM(cs.total_contacts_selected), 0)::INTEGER,
        COALESCE(SUM(cs.total_errors), 0)::INTEGER,
        COALESCE(MAX(cs.total_processing_duration_ms), 0)::BIGINT,
        (SELECT COUNT(*) FROM campaign_engine.campaign_results cr WHERE cr.processing_run_id = p_processing_run_id AND cr.customers_assigned > 0)::INTEGER
    FROM campaign_engine.campaign_statistics cs
    WHERE cs.processing_run_id = p_processing_run_id;
END;
$$ LANGUAGE plpgsql;

-----------------------------------
-- /home/code/CollectionCRM/src/services/campaign-engine/database/migrations/create_assignment_tracking_table.sql
-- Create assignment tracking table optimized for daily processing runs
-- Assignments are only valid within a single processing run and cleaned up daily

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

----------------------------------------------
-- /home/code/CollectionCRM/src/services/campaign-engine/database/migrations/enable_file_writing.sql

-- Enable file writing capabilities for SQL debugging
-- This migration enables the adminpack extension and creates helper functions

-- Enable the adminpack extension for file operations
CREATE EXTENSION IF NOT EXISTS adminpack;

-- Create a helper function that safely writes to files with error handling
CREATE OR REPLACE FUNCTION campaign_engine.safe_file_write(
    p_filename TEXT,
    p_content TEXT,
    p_append BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
BEGIN
    BEGIN
        -- Try to write the file using pg_file_write from adminpack
        PERFORM pg_file_write(p_filename, p_content, p_append);
        RETURN true;
    EXCEPTION WHEN OTHERS THEN
        -- If file writing fails, log the error but don't fail the whole process
        RAISE NOTICE 'Failed to write debug file %: %', p_filename, SQLERRM;
        RETURN false;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create a function to ensure debug directory exists (if possible)
CREATE OR REPLACE FUNCTION campaign_engine.ensure_debug_directory()
RETURNS BOOLEAN AS $$
BEGIN
    -- Try to create the debug directory (may fail due to permissions, that's OK)
    BEGIN
        PERFORM pg_file_write('/tmp/campaign_debug_test.txt', 'test', false);
        PERFORM pg_file_unlink('/tmp/campaign_debug_test.txt');
        RETURN true;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Debug directory /tmp may not be writable: %', SQLERRM;
        RETURN false;
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION campaign_engine.safe_file_write(TEXT, TEXT, BOOLEAN) IS 'Safely writes content to files with error handling for SQL debugging';
COMMENT ON FUNCTION campaign_engine.ensure_debug_directory() IS 'Checks if debug directory is writable';

----------------------------------------------
-- Function to list selected contacts for each campaign by processing run ID

CREATE OR REPLACE FUNCTION campaign_engine.list_selected_contacts_by_run(
    p_processing_run_id UUID
) RETURNS TABLE (
    campaign_group_name VARCHAR(100),
    campaign_name VARCHAR(100),
    campaign_priority INTEGER,
    cif VARCHAR(50),
    contact_type VARCHAR(50),
    contact_value VARCHAR(100),
    related_party_type VARCHAR(50),
    related_party_cif VARCHAR(50),
    related_party_name VARCHAR(200),
    relationship_type VARCHAR(100),
    is_primary BOOLEAN,
    is_verified BOOLEAN,
    contact_source VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.campaign_group_name,
        cr.campaign_name,
        cr.priority AS campaign_priority,
        ca.cif,
        sc.contact_type,
        sc.contact_value,
        sc.related_party_type,
        sc.related_party_cif,
        sc.related_party_name,
        sc.relationship_type,
        sc.is_primary,
        sc.is_verified,
        sc.source AS contact_source
    FROM campaign_engine.campaign_processing_runs cpr
    INNER JOIN campaign_engine.campaign_results cr ON cpr.id = cr.processing_run_id
    INNER JOIN campaign_engine.customer_assignments ca ON cr.id = ca.campaign_result_id
    LEFT JOIN campaign_engine.selected_contacts sc ON ca.id = sc.customer_assignment_id
    WHERE cpr.id = p_processing_run_id
    ORDER BY 
        cr.campaign_group_name,
        cr.priority,
        cr.campaign_name,
        ca.cif,
        sc.rule_priority,
        sc.contact_type;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION campaign_engine.list_selected_contacts_by_run(UUID) IS 'Lists all selected contacts for each campaign in a processing run';



-- Loan-Level Aggregates Materialized View for Campaign Engine
-- This view provides one row per loan with customer-level aggregates included
-- Eliminates the need for multiple joins during campaign processing

CREATE MATERIALIZED VIEW bank_sync_service.loan_campaign_data AS
WITH customer_aggregates AS (
    SELECT 
        c.id as customer_id,
        c.cif,
        c.segment,
        COALESCE(c.name, c.company_name) as name,
        c.status as customer_status,
        
        -- Customer-level loan counts
        COUNT(l.account_number) as total_loans,
        COUNT(CASE WHEN l.status = 'OPEN' THEN 1 END) as active_loans,
        COUNT(CASE WHEN l.dpd > 0 THEN 1 END) as overdue_loans,
        
        -- Customer-level financial aggregates
        COALESCE(SUM(l.outstanding), 0) as client_outstanding,
        COALESCE(SUM(l.due_amount), 0) as total_due_amount,
        COALESCE(SUM(CASE WHEN l.dpd > 0 THEN l.outstanding ELSE 0 END), 0) as overdue_outstanding,
        COALESCE(SUM(CASE WHEN l.dpd > 0 THEN l.due_amount ELSE 0 END), 0) as overdue_due_amount,
        
        -- Customer-level risk metrics
        MAX(l.dpd) as max_dpd,
        AVG(l.dpd) as avg_dpd,
        COALESCE(SUM(l.outstanding) / NULLIF(SUM(l.original_amount), 0), 0) as utilization_ratio
    
    FROM bank_sync_service.customers c
    LEFT JOIN bank_sync_service.loans l ON c.cif = l.cif
    -- Join with workflow_service.customer_cases to filter by f_update
    INNER JOIN workflow_service.customer_cases cc ON c.cif = cc.cif
    WHERE c.cif IS NOT NULL
      AND (cc.f_update IS NULL OR cc.f_update < NOW())
    GROUP BY c.id, c.cif, c.segment, c.status
)
SELECT 
    -- Customer fields
    ca.customer_id,
    ca.cif,
    ca.segment,
    ca.name,
    ca.customer_status,
    
    -- Loan-specific fields
    l.account_number,
    l.product_type,
    l.outstanding as loan_outstanding,
    l.due_amount as loan_due_amount,
    l.dpd as loan_dpd,
    l.delinquency_status,
    l.status as loan_status,
    l.original_amount,
    
    -- Customer aggregates (repeated for each loan)
    ca.total_loans,
    ca.active_loans,
    ca.overdue_loans,
    ca.client_outstanding,
    ca.total_due_amount,
    ca.overdue_outstanding,
    ca.overdue_due_amount,
    ca.max_dpd,
    ca.avg_dpd,
    ca.utilization_ratio,
    
    -- Custom fields for this loan
    lcf.field_1,
    lcf.field_2,
    lcf.field_3,
    lcf.field_4,
    lcf.field_5,
    lcf.field_6,
    lcf.field_7,
    lcf.field_8,
    lcf.field_9,
    lcf.field_10,
    lcf.field_11,
    lcf.field_12,
    lcf.field_13,
    lcf.field_14,
    lcf.field_15,
    lcf.field_16,
    lcf.field_17,
    lcf.field_18,
    lcf.field_19,
    lcf.field_20,
    
    -- Timestamps
    l.updated_at as loan_updated_at,
    NOW() as calculated_at

FROM customer_aggregates ca
JOIN bank_sync_service.loans l ON ca.cif = l.cif
LEFT JOIN bank_sync_service.loan_custom_fields lcf ON l.account_number = lcf.account_number;

-- Create indexes for performance
CREATE UNIQUE INDEX idx_loan_campaign_data_account ON bank_sync_service.loan_campaign_data(account_number);
CREATE INDEX idx_loan_campaign_data_cif ON bank_sync_service.loan_campaign_data(cif);
CREATE INDEX idx_loan_campaign_data_segment ON bank_sync_service.loan_campaign_data(segment);
CREATE INDEX idx_loan_campaign_data_customer_status ON bank_sync_service.loan_campaign_data(customer_status);
CREATE INDEX idx_loan_campaign_data_client_outstanding ON bank_sync_service.loan_campaign_data(client_outstanding);
CREATE INDEX idx_loan_campaign_data_max_dpd ON bank_sync_service.loan_campaign_data(max_dpd);
CREATE INDEX idx_loan_campaign_data_loan_dpd ON bank_sync_service.loan_campaign_data(loan_dpd);
CREATE INDEX idx_loan_campaign_data_loan_status ON bank_sync_service.loan_campaign_data(loan_status);
CREATE INDEX idx_loan_campaign_data_product_type ON bank_sync_service.loan_campaign_data(product_type);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION bank_sync_service.refresh_loan_campaign_data()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY bank_sync_service.loan_campaign_data;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW bank_sync_service.loan_campaign_data IS 'Loan-level view with customer aggregates for campaign evaluation. One row per loan. Refresh regularly via scheduled job.';
COMMENT ON FUNCTION bank_sync_service.refresh_loan_campaign_data() IS 'Refreshes loan campaign data materialized view. Should be called regularly (e.g., every hour or after loan updates).';