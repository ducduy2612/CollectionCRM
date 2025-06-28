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
    v_query := format('
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
    
    -- Debug: Print the customer selection SQL
    RAISE NOTICE '==================== CAMPAIGN CUSTOMER SELECTION SQL ====================';
    RAISE NOTICE 'Campaign ID: %', p_campaign_id;
    RAISE NOTICE 'WHERE clause: %', v_where_clause;
    RAISE NOTICE 'EXCLUDE clause: %', v_exclude_clause;
    RAISE NOTICE 'Full Query: %', v_query;
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
    
    -- Debug: Print the final results SQL
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
    
    -- Debug: Print the contacts creation SQL
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
            
            -- Debug: Print rule condition SQL
            RAISE NOTICE '==================== CONTACT RULE % CONDITION SQL ====================', v_rule_index;
            RAISE NOTICE 'Rule conditions WHERE: %', v_conditions_where;
            RAISE NOTICE 'Update Query: %', v_query;
            RAISE NOTICE '====================================================================';
            
            EXECUTE v_query;
        ELSE
            -- No conditions means apply rule to ALL contacts
            v_query := format('UPDATE %I SET rule_%s_applies = TRUE', 
                p_all_contacts_table, v_rule_index);
                
            -- Debug: Print rule condition SQL
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
    
    -- Debug: Print final exclusion SQL
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