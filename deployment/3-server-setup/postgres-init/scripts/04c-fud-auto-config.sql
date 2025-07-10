-- =============================================
-- FUD Auto Configuration Tables
-- 04c-fud-auto-config.sql: Follow-Up Date automatic calculation configuration
-- =============================================

-- FUD Auto Config table
CREATE TABLE workflow_service.fud_auto_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_result_id UUID NOT NULL,
    calculation_type VARCHAR(20) NOT NULL CHECK (calculation_type IN ('PROMISE_DATE', 'ACTION_DATE')),
    days_offset INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_fud_config_action_result FOREIGN KEY (action_result_id) REFERENCES workflow_service.action_results(id) ON DELETE CASCADE,
    CONSTRAINT uk_fud_config_action_result UNIQUE(action_result_id)
);

COMMENT ON TABLE workflow_service.fud_auto_config IS 'Configuration for automatic Follow-Up Date calculation based on action results';
COMMENT ON COLUMN workflow_service.fud_auto_config.calculation_type IS 'Base date for calculation: PROMISE_DATE or ACTION_DATE';
COMMENT ON COLUMN workflow_service.fud_auto_config.days_offset IS 'Number of days to add to the base date';
COMMENT ON COLUMN workflow_service.fud_auto_config.priority IS 'Priority for rule application (higher value = higher priority)';

-- Create indexes for better performance
CREATE INDEX idx_fud_config_active ON workflow_service.fud_auto_config(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_fud_config_action_result ON workflow_service.fud_auto_config(action_result_id);

-- Function to calculate FUD based on configuration
CREATE OR REPLACE FUNCTION workflow_service.calculate_fud_date(
    p_action_result_id UUID,
    p_action_date TIMESTAMP,
    p_promise_date TIMESTAMP DEFAULT NULL
) RETURNS TIMESTAMP AS $$
DECLARE
    v_config RECORD;
    v_base_date TIMESTAMP;
    v_fud_date TIMESTAMP;
BEGIN
    -- Get active FUD configuration for the action result
    SELECT * INTO v_config
    FROM workflow_service.fud_auto_config
    WHERE action_result_id = p_action_result_id
      AND is_active = TRUE
    LIMIT 1;
    
    -- If no config found, return NULL (manual FUD entry required)
    IF v_config.id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Determine base date based on calculation type
    IF v_config.calculation_type = 'PROMISE_DATE' THEN
        -- Use promise date if available, otherwise use action date
        v_base_date := COALESCE(p_promise_date, p_action_date);
    ELSE -- ACTION_DATE
        v_base_date := p_action_date;
    END IF;
    
    -- Calculate FUD by adding days offset
    v_fud_date := v_base_date + (v_config.days_offset || ' days')::INTERVAL;
    
    RETURN v_fud_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.calculate_fud_date IS 'Calculates Follow-Up Date based on FUD auto configuration';

-- Function to get FUD configuration for an action result
CREATE OR REPLACE FUNCTION workflow_service.get_fud_config(p_action_result_id UUID)
RETURNS TABLE (
    id UUID,
    action_result_id UUID,
    action_result_code VARCHAR,
    action_result_name VARCHAR,
    calculation_type VARCHAR,
    days_offset INTEGER,
    is_active BOOLEAN,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fc.id,
        fc.action_result_id,
        ar.code as action_result_code,
        ar.name as action_result_name,
        fc.calculation_type,
        fc.days_offset,
        fc.is_active,
        fc.priority
    FROM workflow_service.fud_auto_config fc
    JOIN workflow_service.action_results ar ON ar.id = fc.action_result_id
    WHERE fc.action_result_id = p_action_result_id
      AND fc.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate FUD configuration
CREATE OR REPLACE FUNCTION workflow_service.validate_fud_config()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate days_offset is reasonable (between -365 and 365)
    IF NEW.days_offset < -365 OR NEW.days_offset > 365 THEN
        RAISE EXCEPTION 'days_offset must be between -365 and 365';
    END IF;
    
    -- Validate that action_result exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM workflow_service.action_results 
        WHERE id = NEW.action_result_id AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'action_result_id must reference an active action result';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
CREATE TRIGGER trg_validate_fud_config
    BEFORE INSERT OR UPDATE ON workflow_service.fud_auto_config
    FOR EACH ROW
    EXECUTE FUNCTION workflow_service.validate_fud_config();

-- Sample FUD configurations (commented out - uncomment to insert sample data)
/*
-- Get some action result IDs for configuration
DO $$
DECLARE
    v_promise_to_pay_id UUID;
    v_no_answer_id UUID;
    v_wrong_number_id UUID;
    v_payment_made_id UUID;
BEGIN
    -- Get action result IDs
    SELECT id INTO v_promise_to_pay_id FROM workflow_service.action_results WHERE code = 'PROMISE_TO_PAY' LIMIT 1;
    SELECT id INTO v_no_answer_id FROM workflow_service.action_results WHERE code = 'NO_ANSWER' LIMIT 1;
    SELECT id INTO v_wrong_number_id FROM workflow_service.action_results WHERE code = 'WRONG_NUMBER' LIMIT 1;
    SELECT id INTO v_payment_made_id FROM workflow_service.action_results WHERE code = 'PAYMENT_MADE' LIMIT 1;
    
    -- Insert FUD configurations
    IF v_promise_to_pay_id IS NOT NULL THEN
        INSERT INTO workflow_service.fud_auto_config (action_result_id, calculation_type, days_offset, priority, created_by, updated_by)
        VALUES (v_promise_to_pay_id, 'PROMISE_DATE', 1, 100, 'system', 'system');
    END IF;
    
    IF v_no_answer_id IS NOT NULL THEN
        INSERT INTO workflow_service.fud_auto_config (action_result_id, calculation_type, days_offset, priority, created_by, updated_by)
        VALUES (v_no_answer_id, 'ACTION_DATE', 1, 90, 'system', 'system');
    END IF;
    
    IF v_wrong_number_id IS NOT NULL THEN
        INSERT INTO workflow_service.fud_auto_config (action_result_id, calculation_type, days_offset, priority, created_by, updated_by)
        VALUES (v_wrong_number_id, 'ACTION_DATE', 7, 80, 'system', 'system');
    END IF;
    
    IF v_payment_made_id IS NOT NULL THEN
        INSERT INTO workflow_service.fud_auto_config (action_result_id, calculation_type, days_offset, priority, created_by, updated_by)
        VALUES (v_payment_made_id, 'ACTION_DATE', 30, 70, 'system', 'system');
    END IF;
END $$;
*/