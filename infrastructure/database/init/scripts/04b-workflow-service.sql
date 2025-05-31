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
    p_created_by VARCHAR(50) DEFAULT 'ADMIN'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO workflow_service.action_results (code, name, description, display_order, created_by, updated_by)
    VALUES (p_code, p_name, p_description, p_display_order, p_created_by, p_created_by)
    RETURNING id INTO v_id;
    
    RETURN v_id;
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
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.id,
        ar.code,
        ar.name,
        ar.description,
        ar.display_order
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

-- Function to safely deactivate action type (prevents if used in existing records)
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
    
    -- Check if type is used in existing action records
    SELECT COUNT(*) INTO v_record_count 
    FROM workflow_service.action_records 
    WHERE action_type_id = v_type_id;
    
    IF v_record_count > 0 THEN
        RAISE EXCEPTION 'Cannot deactivate action type %. It is used in % existing action records. Historical data must be preserved.', 
            p_type_code, v_record_count;
    END IF;
    
    -- Safe to deactivate - no existing records use this type
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

-- Function to safely deactivate action subtype (prevents if used in existing records)
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
    
    -- Check if subtype is used in existing action records
    SELECT COUNT(*) INTO v_record_count 
    FROM workflow_service.action_records 
    WHERE action_subtype_id = v_subtype_id;
    
    IF v_record_count > 0 THEN
        RAISE EXCEPTION 'Cannot deactivate action subtype %. It is used in % existing action records. Historical data must be preserved.', 
            p_subtype_code, v_record_count;
    END IF;
    
    -- Safe to deactivate - no existing records use this subtype
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

-- Function to safely deactivate action result (prevents if used in existing records)
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
    
    -- Check if result is used in existing action records
    SELECT COUNT(*) INTO v_record_count 
    FROM workflow_service.action_records 
    WHERE action_result_id = v_result_id;
    
    IF v_record_count > 0 THEN
        RAISE EXCEPTION 'Cannot deactivate action result %. It is used in % existing action records. Historical data must be preserved.', 
            p_result_code, v_record_count;
    END IF;
    
    -- Safe to deactivate - no existing records use this result
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
    
    ORDER BY config_type, config_code;
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
COMMENT ON FUNCTION workflow_service.add_action_result(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) IS 'Adds a new action result for admin configuration';
COMMENT ON FUNCTION workflow_service.map_type_to_subtype(VARCHAR, VARCHAR, VARCHAR) IS 'Maps an action type to a subtype';
COMMENT ON FUNCTION workflow_service.map_subtype_to_result(VARCHAR, VARCHAR, VARCHAR) IS 'Maps an action subtype to a result';
COMMENT ON FUNCTION workflow_service.get_subtypes_for_type(VARCHAR) IS 'Gets available subtypes for a given action type';
COMMENT ON FUNCTION workflow_service.get_results_for_subtype(VARCHAR) IS 'Gets available results for a given action subtype';
COMMENT ON FUNCTION workflow_service.validate_action_configuration(UUID, UUID, UUID) IS 'Validates if the action type, subtype, and result combination is allowed';