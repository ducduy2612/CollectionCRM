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