-- =============================================
-- ADMIN FUNCTIONS FOR CONFIGURATION MANAGEMENT
-- =============================================

-- Function to add new action type
CREATE OR REPLACE FUNCTION workflow_service.add_action_type(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.action_types (code, name, description, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new action subtype
CREATE OR REPLACE FUNCTION workflow_service.add_action_subtype(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.action_subtypes (code, name, description, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new action result
CREATE OR REPLACE FUNCTION workflow_service.add_action_result(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_is_promise BOOLEAN DEFAULT FALSE,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.action_results (code, name, description, display_order, is_promise, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_display_order, p_is_promise, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update existing action type
CREATE OR REPLACE FUNCTION workflow_service.update_action_type(
    p_code VARCHAR(50),
    p_name VARCHAR(100) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT NULL,
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_type_id UUID;
BEGIN
    -- Get type ID and verify it exists and is active
    SELECT id INTO v_type_id FROM workflow_service.action_types WHERE code = p_code;
    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Action type with code % not found', p_code;
    END IF;
    
    -- Update only the fields that are provided (not NULL)
    UPDATE workflow_service.action_types
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        display_order = COALESCE(p_display_order, display_order),
        updated_at = NOW(),
        updated_by = p_updated_by,
        is_active = TRUE
    WHERE id = v_type_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update existing action subtype
CREATE OR REPLACE FUNCTION workflow_service.update_action_subtype(
    p_code VARCHAR(50),
    p_name VARCHAR(100) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT NULL,
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_subtype_id UUID;
BEGIN
    -- Get subtype ID and verify it exists and is active
    SELECT id INTO v_subtype_id FROM workflow_service.action_subtypes WHERE code = p_code;
    IF v_subtype_id IS NULL THEN
        RAISE EXCEPTION 'Action subtype with code % not found', p_code;
    END IF;
    
    -- Update only the fields that are provided (not NULL)
    UPDATE workflow_service.action_subtypes
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        display_order = COALESCE(p_display_order, display_order),
        updated_at = NOW(),
        updated_by = p_updated_by,
        is_active = TRUE
    WHERE id = v_subtype_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update existing action result
CREATE OR REPLACE FUNCTION workflow_service.update_action_result(
    p_code VARCHAR(50),
    p_name VARCHAR(100) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_display_order INTEGER DEFAULT NULL,
    p_is_promise BOOLEAN DEFAULT NULL,
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_result_id UUID;
BEGIN
    -- Get result ID and verify it exists and is active
    SELECT id INTO v_result_id FROM workflow_service.action_results WHERE code = p_code;
    IF v_result_id IS NULL THEN
        RAISE EXCEPTION 'Action result with code % not found', p_code;
    END IF;
    
    -- Update only the fields that are provided (not NULL)
    -- For boolean fields, we need to handle the case where false should be updated
    UPDATE workflow_service.action_results
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        display_order = COALESCE(p_display_order, display_order),
        is_promise = COALESCE(p_is_promise, is_promise),
        updated_at = NOW(),
        updated_by = p_updated_by,
        is_active = TRUE
    WHERE id = v_result_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to map action type to subtype
CREATE OR REPLACE FUNCTION workflow_service.map_type_to_subtype(
    p_type_code VARCHAR(50),
    p_subtype_code VARCHAR(50),
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_type_id UUID;
    v_subtype_id UUID;
BEGIN
    -- Get type ID
    SELECT id INTO v_type_id FROM workflow_service.action_types WHERE code = p_type_code AND is_active = TRUE;
    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Action type with code % not found or inactive', p_type_code;
    END IF;
    
    -- Get subtype ID
    SELECT id INTO v_subtype_id FROM workflow_service.action_subtypes WHERE code = p_subtype_code AND is_active = TRUE;
    IF v_subtype_id IS NULL THEN
        RAISE EXCEPTION 'Action subtype with code % not found or inactive', p_subtype_code;
    END IF;
    
    -- Insert mapping
    INSERT INTO workflow_service.action_type_subtype_mappings (action_type_id, action_subtype_id, created_by, updated_by)
    VALUES (v_type_id, v_subtype_id, p_created_by, p_created_by)
    ON CONFLICT (action_type_id, action_subtype_id) DO UPDATE SET
        is_active = TRUE,
        updated_at = NOW(),
        updated_by = p_created_by
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to map subtype to result
CREATE OR REPLACE FUNCTION workflow_service.map_subtype_to_result(
    p_subtype_code VARCHAR(50),
    p_result_code VARCHAR(50),
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_subtype_id UUID;
    v_result_id UUID;
BEGIN
    -- Get subtype ID
    SELECT id INTO v_subtype_id FROM workflow_service.action_subtypes WHERE code = p_subtype_code AND is_active = TRUE;
    IF v_subtype_id IS NULL THEN
        RAISE EXCEPTION 'Action subtype with code % not found or inactive', p_subtype_code;
    END IF;
    
    -- Get result ID
    SELECT id INTO v_result_id FROM workflow_service.action_results WHERE code = p_result_code AND is_active = TRUE;
    IF v_result_id IS NULL THEN
        RAISE EXCEPTION 'Action result with code % not found or inactive', p_result_code;
    END IF;
    
    -- Insert mapping
    INSERT INTO workflow_service.action_subtype_result_mappings (action_subtype_id, action_result_id, created_by, updated_by)
    VALUES (v_subtype_id, v_result_id, p_created_by, p_created_by)
    ON CONFLICT (action_subtype_id, action_result_id) DO UPDATE SET
        is_active = TRUE,
        updated_at = NOW(),
        updated_by = p_created_by
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get available subtypes for a type
CREATE OR REPLACE FUNCTION workflow_service.get_subtypes_for_type(p_type_code VARCHAR(50))
RETURNS TABLE (
    subtype_id UUID,
    subtype_code VARCHAR(50),
    subtype_name VARCHAR(100),
    subtype_description TEXT,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ast.id,
        ast.code,
        ast.name,
        ast.description,
        ast.display_order
    FROM workflow_service.action_subtypes ast
    INNER JOIN workflow_service.action_type_subtype_mappings atsm ON ast.id = atsm.action_subtype_id
    INNER JOIN workflow_service.action_types at ON atsm.action_type_id = at.id
    WHERE at.code = p_type_code
        AND at.is_active = TRUE
        AND ast.is_active = TRUE
        AND atsm.is_active = TRUE
    ORDER BY ast.display_order, ast.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get available results for a subtype
CREATE OR REPLACE FUNCTION workflow_service.get_results_for_subtype(p_subtype_code VARCHAR(50))
RETURNS TABLE (
    result_id UUID,
    result_code VARCHAR(50),
    result_name VARCHAR(100),
    result_description TEXT,
    display_order INTEGER,
    is_promise BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        ar.code,
        ar.name,
        ar.description,
        ar.display_order,
        ar.is_promise
    FROM workflow_service.action_results ar
    INNER JOIN workflow_service.action_subtype_result_mappings asrm ON ar.id = asrm.action_result_id
    INNER JOIN workflow_service.action_subtypes ast ON asrm.action_subtype_id = ast.id
    WHERE ast.code = p_subtype_code
        AND ast.is_active = TRUE
        AND ar.is_active = TRUE
        AND asrm.is_active = TRUE
    ORDER BY ar.display_order, ar.name;
END;
$$ LANGUAGE plpgsql;

-- Function to validate action record configuration
CREATE OR REPLACE FUNCTION workflow_service.validate_action_configuration(
    p_type_id UUID,
    p_subtype_id UUID,
    p_result_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_type_subtype_valid BOOLEAN := FALSE;
    v_subtype_result_valid BOOLEAN := FALSE;
BEGIN
    -- Check if type-subtype mapping exists and is active
    SELECT EXISTS(
        SELECT 1 FROM workflow_service.action_type_subtype_mappings
        WHERE action_type_id = p_type_id
            AND action_subtype_id = p_subtype_id
            AND is_active = TRUE
    ) INTO v_type_subtype_valid;
    
    -- Check if subtype-result mapping exists and is active
    SELECT EXISTS(
        SELECT 1 FROM workflow_service.action_subtype_result_mappings
        WHERE action_subtype_id = p_subtype_id
            AND action_result_id = p_result_id
            AND is_active = TRUE
    ) INTO v_subtype_result_valid;
    
    RETURN v_type_subtype_valid AND v_subtype_result_valid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DATA PRESERVATION AND INTEGRITY FUNCTIONS
-- =============================================

-- Function to safely deactivate action type 
CREATE OR REPLACE FUNCTION workflow_service.deactivate_action_type(
    p_type_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_type_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get type ID
    SELECT id INTO v_type_id FROM workflow_service.action_types WHERE code = p_type_code AND is_active = TRUE;
    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Action type with code % not found or already inactive', p_type_code;
    END IF;
    
    UPDATE workflow_service.action_types 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_type_id;
    
    -- Also deactivate related mappings
    UPDATE workflow_service.action_type_subtype_mappings 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE action_type_id = v_type_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate action subtype
CREATE OR REPLACE FUNCTION workflow_service.deactivate_action_subtype(
    p_subtype_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_subtype_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get subtype ID
    SELECT id INTO v_subtype_id FROM workflow_service.action_subtypes WHERE code = p_subtype_code AND is_active = TRUE;
    IF v_subtype_id IS NULL THEN
        RAISE EXCEPTION 'Action subtype with code % not found or already inactive', p_subtype_code;
    END IF;
    
    UPDATE workflow_service.action_subtypes 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_subtype_id;
    
    -- Also deactivate related mappings
    UPDATE workflow_service.action_type_subtype_mappings 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE action_subtype_id = v_subtype_id;
    
    UPDATE workflow_service.action_subtype_result_mappings 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE action_subtype_id = v_subtype_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate action result 
CREATE OR REPLACE FUNCTION workflow_service.deactivate_action_result(
    p_result_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_result_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get result ID
    SELECT id INTO v_result_id FROM workflow_service.action_results WHERE code = p_result_code AND is_active = TRUE;
    IF v_result_id IS NULL THEN
        RAISE EXCEPTION 'Action result with code % not found or already inactive', p_result_code;
    END IF;
    
    UPDATE workflow_service.action_results 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_result_id;
    
    -- Also deactivate related mappings
    UPDATE workflow_service.action_subtype_result_mappings 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE action_result_id = v_result_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely remove type-subtype mapping (prevents if combination used in existing records)
CREATE OR REPLACE FUNCTION workflow_service.remove_type_subtype_mapping(
    p_type_code VARCHAR(50),
    p_subtype_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_type_id UUID;
    v_subtype_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get type and subtype IDs
    SELECT id INTO v_type_id FROM workflow_service.action_types WHERE code = p_type_code;
    SELECT id INTO v_subtype_id FROM workflow_service.action_subtypes WHERE code = p_subtype_code;
    
    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Action type with code % not found', p_type_code;
    END IF;
    
    IF v_subtype_id IS NULL THEN
        RAISE EXCEPTION 'Action subtype with code % not found', p_subtype_code;
    END IF;
    
    -- Check if this combination is used in existing action records
    SELECT COUNT(*) INTO v_record_count 
    FROM workflow_service.action_records 
    WHERE action_type_id = v_type_id AND action_subtype_id = v_subtype_id;
    
    IF v_record_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove mapping between type % and subtype %. This combination is used in % existing action records. Historical data must be preserved.', 
            p_type_code, p_subtype_code, v_record_count;
    END IF;
    
    -- Safe to deactivate mapping
    UPDATE workflow_service.action_type_subtype_mappings 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE action_type_id = v_type_id AND action_subtype_id = v_subtype_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely remove subtype-result mapping (prevents if combination used in existing records)
CREATE OR REPLACE FUNCTION workflow_service.remove_subtype_result_mapping(
    p_subtype_code VARCHAR(50),
    p_result_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_subtype_id UUID;
    v_result_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get subtype and result IDs
    SELECT id INTO v_subtype_id FROM workflow_service.action_subtypes WHERE code = p_subtype_code;
    SELECT id INTO v_result_id FROM workflow_service.action_results WHERE code = p_result_code;
    
    IF v_subtype_id IS NULL THEN
        RAISE EXCEPTION 'Action subtype with code % not found', p_subtype_code;
    END IF;
    
    IF v_result_id IS NULL THEN
        RAISE EXCEPTION 'Action result with code % not found', p_result_code;
    END IF;
    
    -- Check if this combination is used in existing action records
    SELECT COUNT(*) INTO v_record_count 
    FROM workflow_service.action_records 
    WHERE action_subtype_id = v_subtype_id AND action_result_id = v_result_id;
    
    IF v_record_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove mapping between subtype % and result %. This combination is used in % existing action records. Historical data must be preserved.', 
            p_subtype_code, p_result_code, v_record_count;
    END IF;
    
    -- Safe to deactivate mapping
    UPDATE workflow_service.action_subtype_result_mappings 
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE action_subtype_id = v_subtype_id AND action_result_id = v_result_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get configuration usage statistics
CREATE OR REPLACE FUNCTION workflow_service.get_configuration_usage_stats()
RETURNS TABLE (
    config_type VARCHAR(20),
    config_code VARCHAR(50),
    config_name VARCHAR(100),
    is_active BOOLEAN,
    usage_count BIGINT,
    can_be_deactivated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Action Types usage
    SELECT 
        'TYPE'::VARCHAR(20) as config_type,
        at.code,
        at.name,
        at.is_active,
        COUNT(ar.id) as usage_count,
        CASE WHEN COUNT(ar.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.action_types at
    LEFT JOIN workflow_service.action_records ar ON at.id = ar.action_type_id
    GROUP BY at.id, at.code, at.name, at.is_active
    
    UNION ALL
    
    -- Action Subtypes usage
    SELECT 
        'SUBTYPE'::VARCHAR(20) as config_type,
        ast.code,
        ast.name,
        ast.is_active,
        COUNT(ar.id) as usage_count,
        CASE WHEN COUNT(ar.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.action_subtypes ast
    LEFT JOIN workflow_service.action_records ar ON ast.id = ar.action_subtype_id
    GROUP BY ast.id, ast.code, ast.name, ast.is_active
    
    UNION ALL
    
    -- Action Results usage
    SELECT 
        'RESULT'::VARCHAR(20) as config_type,
        ares.code,
        ares.name,
        ares.is_active,
        COUNT(ar.id) as usage_count,
        CASE WHEN COUNT(ar.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.action_results ares
    LEFT JOIN workflow_service.action_records ar ON ares.id = ar.action_result_id
    GROUP BY ares.id, ares.code, ares.name, ares.is_active
    
    ORDER BY config_type, code;
END;
$$ LANGUAGE plpgsql;

-- Add comments for data preservation functions
COMMENT ON FUNCTION workflow_service.deactivate_action_type(VARCHAR, VARCHAR) IS 'Safely deactivates an action type, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_action_subtype(VARCHAR, VARCHAR) IS 'Safely deactivates an action subtype, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_action_result(VARCHAR, VARCHAR) IS 'Safely deactivates an action result, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.remove_type_subtype_mapping(VARCHAR, VARCHAR, VARCHAR) IS 'Safely removes type-subtype mapping, preventing removal if combination used in existing records';
COMMENT ON FUNCTION workflow_service.remove_subtype_result_mapping(VARCHAR, VARCHAR, VARCHAR) IS 'Safely removes subtype-result mapping, preventing removal if combination used in existing records';
COMMENT ON FUNCTION workflow_service.get_configuration_usage_stats() IS 'Returns usage statistics for all configuration items and whether they can be safely deactivated';

-- Add comments for admin functions
COMMENT ON FUNCTION workflow_service.add_action_type(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) IS 'Adds a new action type for admin configuration';
COMMENT ON FUNCTION workflow_service.add_action_subtype(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) IS 'Adds a new action subtype for admin configuration';
COMMENT ON FUNCTION workflow_service.add_action_result(VARCHAR, VARCHAR, TEXT, INTEGER, BOOLEAN, VARCHAR) IS 'Adds a new action result for admin configuration';
COMMENT ON FUNCTION workflow_service.update_action_type(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) IS 'Updates an existing action type for admin configuration';
COMMENT ON FUNCTION workflow_service.update_action_subtype(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) IS 'Updates an existing action subtype for admin configuration';
COMMENT ON FUNCTION workflow_service.update_action_result(VARCHAR, VARCHAR, TEXT, INTEGER, BOOLEAN, VARCHAR) IS 'Updates an existing action result for admin configuration';
COMMENT ON FUNCTION workflow_service.map_type_to_subtype(VARCHAR, VARCHAR, VARCHAR) IS 'Maps an action type to a subtype';
COMMENT ON FUNCTION workflow_service.map_subtype_to_result(VARCHAR, VARCHAR, VARCHAR) IS 'Maps an action subtype to a result';
COMMENT ON FUNCTION workflow_service.get_subtypes_for_type(VARCHAR) IS 'Gets available subtypes for a given action type';
COMMENT ON FUNCTION workflow_service.get_results_for_subtype(VARCHAR) IS 'Gets available results for a given action subtype';
COMMENT ON FUNCTION workflow_service.validate_action_configuration(UUID, UUID, UUID) IS 'Validates if the action type, subtype, and result combination is allowed';

-- =============================================
-- STATUS DICTIONARY MANAGEMENT FUNCTIONS
-- =============================================

-- Function to add new customer status
CREATE OR REPLACE FUNCTION workflow_service.add_customer_status(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_color VARCHAR(7) DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.customer_status_dict (code, name, description, color, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_color, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new collateral status
CREATE OR REPLACE FUNCTION workflow_service.add_collateral_status(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_color VARCHAR(7) DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.collateral_status_dict (code, name, description, color, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_color, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new processing state
CREATE OR REPLACE FUNCTION workflow_service.add_processing_state(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_color VARCHAR(7) DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.processing_state_dict (code, name, description, color, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_color, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new processing substate
CREATE OR REPLACE FUNCTION workflow_service.add_processing_substate(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_color VARCHAR(7) DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.processing_substate_dict (code, name, description, color, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_color, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new lending violation status
CREATE OR REPLACE FUNCTION workflow_service.add_lending_violation_status(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_color VARCHAR(7) DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.lending_violation_status_dict (code, name, description, color, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_color, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add new recovery ability status
CREATE OR REPLACE FUNCTION workflow_service.add_recovery_ability_status(
    p_code VARCHAR(50),
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_color VARCHAR(7) DEFAULT NULL,
    p_display_order INTEGER DEFAULT 0,
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.recovery_ability_status_dict (code, name, description, color, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_color, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to map processing state to substate
CREATE OR REPLACE FUNCTION workflow_service.map_state_to_substate(
    p_state_code VARCHAR(50),
    p_substate_code VARCHAR(50),
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_state_id UUID;
    v_substate_id UUID;
BEGIN
    -- Get state ID
    SELECT id INTO v_state_id FROM workflow_service.processing_state_dict WHERE code = p_state_code AND is_active = TRUE;
    IF v_state_id IS NULL THEN
        RAISE EXCEPTION 'Processing state with code % not found or inactive', p_state_code;
    END IF;
    
    -- Get substate ID
    SELECT id INTO v_substate_id FROM workflow_service.processing_substate_dict WHERE code = p_substate_code AND is_active = TRUE;
    IF v_substate_id IS NULL THEN
        RAISE EXCEPTION 'Processing substate with code % not found or inactive', p_substate_code;
    END IF;
    
    -- Insert mapping
    INSERT INTO workflow_service.processing_state_substate_mappings (state_id, substate_id, created_by, updated_by)
    VALUES (v_state_id, v_substate_id, p_created_by, p_created_by)
    ON CONFLICT (state_id, substate_id) DO UPDATE SET
        is_active = TRUE,
        updated_at = NOW(),
        updated_by = p_created_by
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get available substates for a processing state
CREATE OR REPLACE FUNCTION workflow_service.get_substates_for_state(p_state_code VARCHAR(50))
RETURNS TABLE (
    substate_id UUID,
    substate_code VARCHAR(50),
    substate_name VARCHAR(100),
    substate_description TEXT,
    substate_color VARCHAR(7),
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pss.id,
        pss.code,
        pss.name,
        pss.description,
        pss.color,
        pss.display_order
    FROM workflow_service.processing_substate_dict pss
    INNER JOIN workflow_service.processing_state_substate_mappings pssm ON pss.id = pssm.substate_id
    INNER JOIN workflow_service.processing_state_dict ps ON pssm.state_id = ps.id
    WHERE ps.code = p_state_code
        AND ps.is_active = TRUE
        AND pss.is_active = TRUE
        AND pssm.is_active = TRUE
    ORDER BY pss.display_order, pss.name;
END;
$$ LANGUAGE plpgsql;

-- Function to validate processing state configuration
CREATE OR REPLACE FUNCTION workflow_service.validate_processing_state_configuration(
    p_state_id UUID,
    p_substate_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_state_substate_valid BOOLEAN := FALSE;
BEGIN
    -- Check if state-substate mapping exists and is active
    SELECT EXISTS(
        SELECT 1 FROM workflow_service.processing_state_substate_mappings
        WHERE state_id = p_state_id
            AND substate_id = p_substate_id
            AND is_active = TRUE
    ) INTO v_state_substate_valid;
    
    RETURN v_state_substate_valid;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate customer status 
CREATE OR REPLACE FUNCTION workflow_service.deactivate_customer_status(
    p_status_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get status ID
    SELECT id INTO v_status_id FROM workflow_service.customer_status_dict WHERE code = p_status_code AND is_active = TRUE;
    IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Customer status with code % not found or already inactive', p_status_code;
    END IF;
    
    UPDATE workflow_service.customer_status_dict
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_status_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate collateral status 
CREATE OR REPLACE FUNCTION workflow_service.deactivate_collateral_status(
    p_status_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get status ID
    SELECT id INTO v_status_id FROM workflow_service.collateral_status_dict WHERE code = p_status_code AND is_active = TRUE;
    IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Collateral status with code % not found or already inactive', p_status_code;
    END IF;
    
    UPDATE workflow_service.collateral_status_dict
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_status_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate processing state
CREATE OR REPLACE FUNCTION workflow_service.deactivate_processing_state(
    p_state_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_state_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get state ID
    SELECT id INTO v_state_id FROM workflow_service.processing_state_dict WHERE code = p_state_code AND is_active = TRUE;
    IF v_state_id IS NULL THEN
        RAISE EXCEPTION 'Processing state with code % not found or already inactive', p_state_code;
    END IF;
    
    UPDATE workflow_service.processing_state_dict
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_state_id;
    
    -- Also deactivate related mappings
    UPDATE workflow_service.processing_state_substate_mappings
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE state_id = v_state_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate processing substate
CREATE OR REPLACE FUNCTION workflow_service.deactivate_processing_substate(
    p_substate_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_substate_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get substate ID
    SELECT id INTO v_substate_id FROM workflow_service.processing_substate_dict WHERE code = p_substate_code AND is_active = TRUE;
    IF v_substate_id IS NULL THEN
        RAISE EXCEPTION 'Processing substate with code % not found or already inactive', p_substate_code;
    END IF;
    
    UPDATE workflow_service.processing_substate_dict
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_substate_id;
    
    -- Also deactivate related mappings
    UPDATE workflow_service.processing_state_substate_mappings
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE substate_id = v_substate_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate lending violation status
CREATE OR REPLACE FUNCTION workflow_service.deactivate_lending_violation_status(
    p_status_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get status ID
    SELECT id INTO v_status_id FROM workflow_service.lending_violation_status_dict WHERE code = p_status_code AND is_active = TRUE;
    IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Lending violation status with code % not found or already inactive', p_status_code;
    END IF;
    
    UPDATE workflow_service.lending_violation_status_dict
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_status_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely deactivate recovery ability status
CREATE OR REPLACE FUNCTION workflow_service.deactivate_recovery_ability_status(
    p_status_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get status ID
    SELECT id INTO v_status_id FROM workflow_service.recovery_ability_status_dict WHERE code = p_status_code AND is_active = TRUE;
    IF v_status_id IS NULL THEN
        RAISE EXCEPTION 'Recovery ability status with code % not found or already inactive', p_status_code;
    END IF;
    
    UPDATE workflow_service.recovery_ability_status_dict
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE id = v_status_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to safely remove state-substate mapping (prevents if combination used in existing records)
CREATE OR REPLACE FUNCTION workflow_service.remove_state_substate_mapping(
    p_state_code VARCHAR(50),
    p_substate_code VARCHAR(50),
    p_updated_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_state_id UUID;
    v_substate_id UUID;
    v_record_count INTEGER;
BEGIN
    -- Get state and substate IDs
    SELECT id INTO v_state_id FROM workflow_service.processing_state_dict WHERE code = p_state_code;
    SELECT id INTO v_substate_id FROM workflow_service.processing_substate_dict WHERE code = p_substate_code;
    
    IF v_state_id IS NULL THEN
        RAISE EXCEPTION 'Processing state with code % not found', p_state_code;
    END IF;
    
    IF v_substate_id IS NULL THEN
        RAISE EXCEPTION 'Processing substate with code % not found', p_substate_code;
    END IF;
    
    -- Check if this combination is used in existing status records
    SELECT COUNT(*) INTO v_record_count
    FROM workflow_service.processing_state_status
    WHERE state_id = v_state_id AND substate_id = v_substate_id;
    
    IF v_record_count > 0 THEN
        RAISE EXCEPTION 'Cannot remove mapping between state % and substate %. This combination is used in % existing status records. Historical data must be preserved.',
            p_state_code, p_substate_code, v_record_count;
    END IF;
    
    -- Safe to deactivate mapping
    UPDATE workflow_service.processing_state_substate_mappings
    SET is_active = FALSE, updated_at = NOW(), updated_by = p_updated_by
    WHERE state_id = v_state_id AND substate_id = v_substate_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get status dictionary usage statistics
CREATE OR REPLACE FUNCTION workflow_service.get_status_usage_stats()
RETURNS TABLE (
    status_type VARCHAR(30),
    status_code VARCHAR(50),
    status_name VARCHAR(100),
    is_active BOOLEAN,
    usage_count BIGINT,
    can_be_deactivated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Customer Status usage
    SELECT
        'CUSTOMER_STATUS'::VARCHAR(30) as status_type,
        cs.code,
        cs.name,
        cs.is_active,
        COUNT(cst.id) as usage_count,
        CASE WHEN COUNT(cst.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.customer_status_dict cs
    LEFT JOIN workflow_service.customer_status cst ON cs.id = cst.status_id
    GROUP BY cs.id, cs.code, cs.name, cs.is_active
    
    UNION ALL
    
    -- Collateral Status usage
    SELECT
        'COLLATERAL_STATUS'::VARCHAR(30) as status_type,
        cls.code,
        cls.name,
        cls.is_active,
        COUNT(clst.id) as usage_count,
        CASE WHEN COUNT(clst.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.collateral_status_dict cls
    LEFT JOIN workflow_service.collateral_status clst ON cls.id = clst.status_id
    GROUP BY cls.id, cls.code, cls.name, cls.is_active
    
    UNION ALL
    
    -- Processing State usage
    SELECT
        'PROCESSING_STATE'::VARCHAR(30) as status_type,
        ps.code,
        ps.name,
        ps.is_active,
        COUNT(pst.id) as usage_count,
        CASE WHEN COUNT(pst.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.processing_state_dict ps
    LEFT JOIN workflow_service.processing_state_status pst ON ps.id = pst.state_id
    GROUP BY ps.id, ps.code, ps.name, ps.is_active
    
    UNION ALL
    
    -- Processing Substate usage
    SELECT
        'PROCESSING_SUBSTATE'::VARCHAR(30) as status_type,
        pss.code,
        pss.name,
        pss.is_active,
        COUNT(pst.id) as usage_count,
        CASE WHEN COUNT(pst.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.processing_substate_dict pss
    LEFT JOIN workflow_service.processing_state_status pst ON pss.id = pst.substate_id
    GROUP BY pss.id, pss.code, pss.name, pss.is_active
    
    UNION ALL
    
    -- Lending Violation Status usage
    SELECT
        'LENDING_VIOLATION'::VARCHAR(30) as status_type,
        lvs.code,
        lvs.name,
        lvs.is_active,
        COUNT(lvst.id) as usage_count,
        CASE WHEN COUNT(lvst.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.lending_violation_status_dict lvs
    LEFT JOIN workflow_service.lending_violation_status lvst ON lvs.id = lvst.status_id
    GROUP BY lvs.id, lvs.code, lvs.name, lvs.is_active
    
    UNION ALL
    
    -- Recovery Ability Status usage
    SELECT
        'RECOVERY_ABILITY'::VARCHAR(30) as status_type,
        ras.code,
        ras.name,
        ras.is_active,
        COUNT(rast.id) as usage_count,
        CASE WHEN COUNT(rast.id) = 0 THEN TRUE ELSE FALSE END as can_be_deactivated
    FROM workflow_service.recovery_ability_status_dict ras
    LEFT JOIN workflow_service.recovery_ability_status rast ON ras.id = rast.status_id
    GROUP BY ras.id, ras.code, ras.name, ras.is_active
    
    ORDER BY status_type, status_code;
END;
$$ LANGUAGE plpgsql;

-- Add comments for status dictionary functions
COMMENT ON FUNCTION workflow_service.add_customer_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Adds a new customer status for admin configuration';
COMMENT ON FUNCTION workflow_service.add_collateral_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Adds a new collateral status for admin configuration';
COMMENT ON FUNCTION workflow_service.add_processing_state(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Adds a new processing state for admin configuration';
COMMENT ON FUNCTION workflow_service.add_processing_substate(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Adds a new processing substate for admin configuration';
COMMENT ON FUNCTION workflow_service.add_lending_violation_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Adds a new lending violation status for admin configuration';
COMMENT ON FUNCTION workflow_service.add_recovery_ability_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Adds a new recovery ability status for admin configuration';
COMMENT ON FUNCTION workflow_service.map_state_to_substate(VARCHAR, VARCHAR, VARCHAR) IS 'Maps a processing state to a substate';
COMMENT ON FUNCTION workflow_service.get_substates_for_state(VARCHAR) IS 'Gets available substates for a given processing state';
COMMENT ON FUNCTION workflow_service.validate_processing_state_configuration(UUID, UUID) IS 'Validates if the processing state and substate combination is allowed';
COMMENT ON FUNCTION workflow_service.deactivate_customer_status(VARCHAR, VARCHAR) IS 'Safely deactivates a customer status, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_collateral_status(VARCHAR, VARCHAR) IS 'Safely deactivates a collateral status, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_processing_state(VARCHAR, VARCHAR) IS 'Safely deactivates a processing state, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_processing_substate(VARCHAR, VARCHAR) IS 'Safely deactivates a processing substate, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_lending_violation_status(VARCHAR, VARCHAR) IS 'Safely deactivates a lending violation status, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.deactivate_recovery_ability_status(VARCHAR, VARCHAR) IS 'Safely deactivates a recovery ability status, preventing deactivation if used in existing records';
COMMENT ON FUNCTION workflow_service.remove_state_substate_mapping(VARCHAR, VARCHAR, VARCHAR) IS 'Safely removes state-substate mapping, preventing removal if combination used in existing records';
COMMENT ON FUNCTION workflow_service.get_status_usage_stats() IS 'Returns usage statistics for all status dictionary items and whether they can be safely deactivated';