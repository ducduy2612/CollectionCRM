DROP MATERIALIZED VIEW IF EXISTS workflow_service.agent_performance CASCADE;
DROP MATERIALIZED VIEW IF EXISTS workflow_service.customer_collection_status CASCADE;

-- Drop views
DROP VIEW IF EXISTS workflow_service.v_action_records CASCADE;
DROP VIEW IF EXISTS workflow_service.v_action_configuration CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS workflow_service.refresh_workflow_materialized_views() CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_action_type(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_action_subtype(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_action_result(VARCHAR, VARCHAR, TEXT, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.map_type_to_subtype(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.map_subtype_to_result(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.get_subtypes_for_type(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.get_results_for_subtype(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.validate_action_configuration(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_action_type(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_action_subtype(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_action_result(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.remove_type_subtype_mapping(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.remove_subtype_result_mapping(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.get_configuration_usage_stats() CASCADE;

-- Drop tables in dependency order (partitioned tables and their partitions will be dropped automatically)
DROP TABLE IF EXISTS workflow_service.customer_case_actions CASCADE;
DROP TABLE IF EXISTS workflow_service.customer_cases CASCADE;
DROP TABLE IF EXISTS workflow_service.action_records CASCADE; -- This will drop all partitions automatically
DROP TABLE IF EXISTS workflow_service.customer_agents CASCADE; -- This will drop all partitions automatically
DROP TABLE IF EXISTS workflow_service.action_subtype_result_mappings CASCADE;
DROP TABLE IF EXISTS workflow_service.action_type_subtype_mappings CASCADE;
DROP TABLE IF EXISTS workflow_service.action_results CASCADE;
DROP TABLE IF EXISTS workflow_service.action_subtypes CASCADE;
DROP TABLE IF EXISTS workflow_service.action_types CASCADE;
DROP TABLE IF EXISTS workflow_service.agents CASCADE;

-- =============================================
-- CollectionCRM Database Initialization
-- 04-workflow-service.sql: Workflow service schema tables, indexes, partitions, and materialized views
-- =============================================

-- =============================================
-- CREATE TABLES - WORKFLOW_SERVICE SCHEMA
-- =============================================

-- Agents table
CREATE TABLE workflow_service.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    type agent_type NOT NULL,
    team VARCHAR(30) NOT NULL,
    user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    CONSTRAINT fk_agents_user_id FOREIGN KEY (user_id) REFERENCES auth_service.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE workflow_service.agents IS 'Stores information about collection agents and their teams';

-- =============================================
-- CUSTOMIZABLE ACTION CONFIGURATION TABLES
-- =============================================

-- Action Types table (customizable by admin)
CREATE TABLE workflow_service.action_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.action_types IS 'Customizable action types (e.g., CALL, VISIT, EMAIL)';

-- Action Subtypes table (customizable by admin)
CREATE TABLE workflow_service.action_subtypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.action_subtypes IS 'Customizable action subtypes (e.g., REMINDER_CALL, FOLLOW_UP_CALL)';

-- Action Results table (customizable by admin)
CREATE TABLE workflow_service.action_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.action_results IS 'Customizable action results (e.g., PROMISE_TO_PAY, PAYMENT_MADE)';

-- Type to Subtype mapping table (one-to-many relationship)
CREATE TABLE workflow_service.action_type_subtype_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type_id UUID NOT NULL,
    action_subtype_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_type_subtype_type FOREIGN KEY (action_type_id) REFERENCES workflow_service.action_types(id) ON DELETE CASCADE,
    CONSTRAINT fk_type_subtype_subtype FOREIGN KEY (action_subtype_id) REFERENCES workflow_service.action_subtypes(id) ON DELETE CASCADE,
    CONSTRAINT uk_type_subtype_mapping UNIQUE (action_type_id, action_subtype_id)
);

COMMENT ON TABLE workflow_service.action_type_subtype_mappings IS 'Maps action types to their allowed subtypes (one-to-many)';

-- Subtype to Result mapping table (one-to-many relationship)
CREATE TABLE workflow_service.action_subtype_result_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_subtype_id UUID NOT NULL,
    action_result_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_subtype_result_subtype FOREIGN KEY (action_subtype_id) REFERENCES workflow_service.action_subtypes(id) ON DELETE CASCADE,
    CONSTRAINT fk_subtype_result_result FOREIGN KEY (action_result_id) REFERENCES workflow_service.action_results(id) ON DELETE CASCADE,
    CONSTRAINT uk_subtype_result_mapping UNIQUE (action_subtype_id, action_result_id)
);

COMMENT ON TABLE workflow_service.action_subtype_result_mappings IS 'Maps action subtypes to their allowed results (one-to-many)';

-- Action Records table with partitioning (updated to use foreign keys)
CREATE TABLE workflow_service.action_records (
    id UUID DEFAULT uuid_generate_v4(),
    PRIMARY KEY (id, action_date),
    cif VARCHAR(20) NOT NULL,
    loan_account_number VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    action_type_id UUID NOT NULL,
    action_subtype_id UUID NOT NULL,
    action_result_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    f_update TIMESTAMP,
    notes TEXT,
    call_trace_id VARCHAR(20),
    visit_latitude DECIMAL(10,8),
    visit_longitude DECIMAL(11,8),
    visit_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_action_customer FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif),
    CONSTRAINT fk_action_loan FOREIGN KEY (loan_account_number) REFERENCES bank_sync_service.loans(account_number),
    CONSTRAINT fk_action_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_action_type FOREIGN KEY (action_type_id) REFERENCES workflow_service.action_types(id),
    CONSTRAINT fk_action_subtype FOREIGN KEY (action_subtype_id) REFERENCES workflow_service.action_subtypes(id),
    CONSTRAINT fk_action_result FOREIGN KEY (action_result_id) REFERENCES workflow_service.action_results(id)
) PARTITION BY RANGE (action_date);

COMMENT ON TABLE workflow_service.action_records IS 'Stores actions taken by collection agents';

-- Create partitions for action records (current year and next year)
-- Current year partitions (2025)
CREATE TABLE workflow_service.action_records_2025_q1 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    
CREATE TABLE workflow_service.action_records_2025_q2 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
    
CREATE TABLE workflow_service.action_records_2025_q3 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
    
CREATE TABLE workflow_service.action_records_2025_q4 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Next year partitions (2026)
CREATE TABLE workflow_service.action_records_2026_q1 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
    
CREATE TABLE workflow_service.action_records_2026_q2 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
    
CREATE TABLE workflow_service.action_records_2026_q3 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
    
CREATE TABLE workflow_service.action_records_2026_q4 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Default partition for historical data (before 2025)
CREATE TABLE workflow_service.action_records_historical PARTITION OF workflow_service.action_records
    FOR VALUES FROM (MINVALUE) TO ('2025-01-01');

-- Default partition for future data (after 2026)
CREATE TABLE workflow_service.action_records_future PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2027-01-01') TO (MAXVALUE);

-- Customer Agents table (SCD Type 2) with partitioning
CREATE TABLE workflow_service.customer_agents (
    id UUID DEFAULT uuid_generate_v4(),
    PRIMARY KEY (id, start_date),
    cif VARCHAR(20) NOT NULL,
    assigned_call_agent_id UUID,
    assigned_field_agent_id UUID,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_customer_agent_customer FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif),
    CONSTRAINT fk_customer_agent_call_agent FOREIGN KEY (assigned_call_agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_customer_agent_field_agent FOREIGN KEY (assigned_field_agent_id) REFERENCES workflow_service.agents(id)
) PARTITION BY RANGE (start_date);

COMMENT ON TABLE workflow_service.customer_agents IS 'Stores the assignment of customers to agents with historical tracking (SCD Type 2)';

-- Create partitions for customer agents (current year and next year)
-- Current year partitions (2025)
CREATE TABLE workflow_service.customer_agents_2025_q1 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    
CREATE TABLE workflow_service.customer_agents_2025_q2 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
    
CREATE TABLE workflow_service.customer_agents_2025_q3 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
    
CREATE TABLE workflow_service.customer_agents_2025_q4 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Next year partitions (2026)
CREATE TABLE workflow_service.customer_agents_2026_q1 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
    
CREATE TABLE workflow_service.customer_agents_2026_q2 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
    
CREATE TABLE workflow_service.customer_agents_2026_q3 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
    
CREATE TABLE workflow_service.customer_agents_2026_q4 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Default partition for historical data (before 2025)
CREATE TABLE workflow_service.customer_agents_historical PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM (MINVALUE) TO ('2025-01-01');

-- Default partition for future data (after 2026)
CREATE TABLE workflow_service.customer_agents_future PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2027-01-01') TO (MAXVALUE);

-- Customer Cases table
CREATE TABLE workflow_service.customer_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL UNIQUE,
    assigned_call_agent_id UUID,
    assigned_field_agent_id UUID,
    f_update TIMESTAMP,
    customer_status customer_status,
    collateral_status collateral_status,
    processing_state_status processing_state_status,
    lending_violation_status lending_violation_status,
    recovery_ability_status recovery_ability_status,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    CONSTRAINT fk_customer_case_customer FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif),
    CONSTRAINT fk_customer_case_call_agent FOREIGN KEY (assigned_call_agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_customer_case_field_agent FOREIGN KEY (assigned_field_agent_id) REFERENCES workflow_service.agents(id)
);

COMMENT ON TABLE workflow_service.customer_cases IS 'Stores the current status of customers for strategy allocation';

-- Customer Case Actions table
CREATE TABLE workflow_service.customer_case_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    notes TEXT,
    customer_status customer_status,
    collateral_status collateral_status,
    processing_state_status processing_state_status,
    lending_violation_status lending_violation_status,
    recovery_ability_status recovery_ability_status,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_customer_case_action_customer FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif),
    CONSTRAINT fk_customer_case_action_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id)
);

COMMENT ON TABLE workflow_service.customer_case_actions IS 'Stores actions and status inputs from agents at the customer level';

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Agent indexes
CREATE INDEX idx_agents_team ON workflow_service.agents(team);
CREATE INDEX idx_agents_type ON workflow_service.agents(type);
CREATE INDEX idx_agents_is_active ON workflow_service.agents(is_active);
CREATE INDEX idx_agents_user_id ON workflow_service.agents(user_id);

-- Action Configuration indexes
CREATE INDEX idx_action_types_code ON workflow_service.action_types(code);
CREATE INDEX idx_action_types_is_active ON workflow_service.action_types(is_active);
CREATE INDEX idx_action_types_display_order ON workflow_service.action_types(display_order);

CREATE INDEX idx_action_subtypes_code ON workflow_service.action_subtypes(code);
CREATE INDEX idx_action_subtypes_is_active ON workflow_service.action_subtypes(is_active);
CREATE INDEX idx_action_subtypes_display_order ON workflow_service.action_subtypes(display_order);

CREATE INDEX idx_action_results_code ON workflow_service.action_results(code);
CREATE INDEX idx_action_results_is_active ON workflow_service.action_results(is_active);
CREATE INDEX idx_action_results_display_order ON workflow_service.action_results(display_order);

CREATE INDEX idx_type_subtype_mappings_type_id ON workflow_service.action_type_subtype_mappings(action_type_id);
CREATE INDEX idx_type_subtype_mappings_subtype_id ON workflow_service.action_type_subtype_mappings(action_subtype_id);
CREATE INDEX idx_type_subtype_mappings_is_active ON workflow_service.action_type_subtype_mappings(is_active);

CREATE INDEX idx_subtype_result_mappings_subtype_id ON workflow_service.action_subtype_result_mappings(action_subtype_id);
CREATE INDEX idx_subtype_result_mappings_result_id ON workflow_service.action_subtype_result_mappings(action_result_id);
CREATE INDEX idx_subtype_result_mappings_is_active ON workflow_service.action_subtype_result_mappings(is_active);

-- Action Record indexes
-- Note: For partitioned tables, indexes should be created on each partition
-- These will be automatically created on all partitions
CREATE INDEX idx_action_records_cif ON workflow_service.action_records(cif);
CREATE INDEX idx_action_records_loan_account_number ON workflow_service.action_records(loan_account_number);
CREATE INDEX idx_action_records_agent_id ON workflow_service.action_records(agent_id);
CREATE INDEX idx_action_records_action_type_id ON workflow_service.action_records(action_type_id);
CREATE INDEX idx_action_records_action_subtype_id ON workflow_service.action_records(action_subtype_id);
CREATE INDEX idx_action_records_action_result_id ON workflow_service.action_records(action_result_id);
CREATE INDEX idx_action_records_action_date ON workflow_service.action_records(action_date);
CREATE INDEX idx_action_records_cif_action_date ON workflow_service.action_records(cif, action_date);
CREATE INDEX idx_action_records_loan_account_number_action_date ON workflow_service.action_records(loan_account_number, action_date);
CREATE INDEX idx_action_records_f_update ON workflow_service.action_records(f_update);

-- Customer Agent indexes
-- Note: For partitioned tables, indexes should be created on each partition
-- These will be automatically created on all partitions
CREATE INDEX idx_customer_agents_cif ON workflow_service.customer_agents(cif);
CREATE INDEX idx_customer_agents_assigned_call_agent_id ON workflow_service.customer_agents(assigned_call_agent_id);
CREATE INDEX idx_customer_agents_assigned_field_agent_id ON workflow_service.customer_agents(assigned_field_agent_id);
CREATE INDEX idx_customer_agents_is_current ON workflow_service.customer_agents(is_current);
CREATE INDEX idx_customer_agents_cif_is_current ON workflow_service.customer_agents(cif, is_current);

-- Customer Case indexes
CREATE INDEX idx_customer_cases_assigned_call_agent_id ON workflow_service.customer_cases(assigned_call_agent_id);
CREATE INDEX idx_customer_cases_assigned_field_agent_id ON workflow_service.customer_cases(assigned_field_agent_id);
CREATE INDEX idx_customer_cases_f_update ON workflow_service.customer_cases(f_update);
CREATE INDEX idx_customer_cases_customer_status ON workflow_service.customer_cases(customer_status);
CREATE INDEX idx_customer_cases_collateral_status ON workflow_service.customer_cases(collateral_status);
CREATE INDEX idx_customer_cases_processing_state_status ON workflow_service.customer_cases(processing_state_status);
CREATE INDEX idx_customer_cases_lending_violation_status ON workflow_service.customer_cases(lending_violation_status);
CREATE INDEX idx_customer_cases_recovery_ability_status ON workflow_service.customer_cases(recovery_ability_status);
CREATE INDEX idx_customer_cases_status_composite ON workflow_service.customer_cases(customer_status, processing_state_status, recovery_ability_status);

-- Customer Case Action indexes
CREATE INDEX idx_customer_case_actions_cif ON workflow_service.customer_case_actions(cif);
CREATE INDEX idx_customer_case_actions_agent_id ON workflow_service.customer_case_actions(agent_id);
CREATE INDEX idx_customer_case_actions_action_date ON workflow_service.customer_case_actions(action_date);
CREATE INDEX idx_customer_case_actions_customer_status ON workflow_service.customer_case_actions(customer_status);
CREATE INDEX idx_customer_case_actions_processing_state_status ON workflow_service.customer_case_actions(processing_state_status);
CREATE INDEX idx_customer_case_actions_recovery_ability_status ON workflow_service.customer_case_actions(recovery_ability_status);

-- =============================================
-- CREATE MATERIALIZED VIEWS
-- =============================================

-- Agent Performance View
CREATE MATERIALIZED VIEW workflow_service.agent_performance AS
SELECT
    a.id AS agent_id,
    a.name AS agent_name,
    a.team,
    a.user_id,
    COUNT(DISTINCT ar.id) AS total_actions,
    COUNT(DISTINCT ar.cif) AS total_customers,
    COUNT(DISTINCT CASE WHEN ares.code = 'PROMISE_TO_PAY' THEN ar.id END) AS payment_promises,
    COUNT(DISTINCT CASE WHEN ares.code = 'PAYMENT_MADE' THEN ar.id END) AS payments_received,
    EXTRACT(MONTH FROM ar.action_date) AS month,
    EXTRACT(YEAR FROM ar.action_date) AS year
FROM
    workflow_service.agents a
LEFT JOIN
    workflow_service.action_records ar ON a.id = ar.agent_id
LEFT JOIN
    workflow_service.action_results ares ON ar.action_result_id = ares.id
WHERE
    a.is_active = TRUE
GROUP BY
    a.id, a.name, a.team, EXTRACT(MONTH FROM ar.action_date), EXTRACT(YEAR FROM ar.action_date);

COMMENT ON MATERIALIZED VIEW workflow_service.agent_performance IS 'Provides agent performance metrics for reporting';

-- Create indexes on materialized view
CREATE INDEX idx_agent_performance_agent_id ON workflow_service.agent_performance(agent_id);
CREATE INDEX idx_agent_performance_user_id ON workflow_service.agent_performance(user_id);
CREATE INDEX idx_agent_performance_team ON workflow_service.agent_performance(team);
CREATE INDEX idx_agent_performance_year_month ON workflow_service.agent_performance(year, month);

-- Customer Collection Status View
CREATE MATERIALIZED VIEW workflow_service.customer_collection_status AS
SELECT
    c.cif,
    c.name,
    c.company_name,
    c.segment,
    cc.customer_status,
    cc.collateral_status,
    cc.processing_state_status,
    cc.lending_violation_status,
    cc.recovery_ability_status,
    a_call.id AS call_agent_id,
    a_call.name AS call_agent_name,
    a_call.user_id AS call_agent_user_id,
    a_field.id AS field_agent_id,
    a_field.name AS field_agent_name,
    a_field.user_id AS field_agent_user_id,
    COUNT(DISTINCT l.account_number) AS total_loans,
    SUM(l.outstanding) AS total_outstanding,
    SUM(l.due_amount) AS total_due_amount,
    MAX(l.dpd) AS max_dpd,
    COUNT(DISTINCT ar.id) AS total_actions,
    MAX(ar.action_date) AS last_action_date
FROM
    bank_sync_service.customers c
LEFT JOIN
    workflow_service.customer_cases cc ON c.cif = cc.cif
LEFT JOIN
    workflow_service.agents a_call ON cc.assigned_call_agent_id = a_call.id
LEFT JOIN
    workflow_service.agents a_field ON cc.assigned_field_agent_id = a_field.id
LEFT JOIN
    bank_sync_service.loans l ON c.cif = l.cif
LEFT JOIN
    workflow_service.action_records ar ON c.cif = ar.cif
GROUP BY
    c.cif, c.name, c.company_name, c.segment, cc.customer_status, cc.collateral_status,
    cc.processing_state_status, cc.lending_violation_status, cc.recovery_ability_status,
    a_call.id, a_call.name, a_call.user_id, a_field.id, a_field.name, a_field.user_id;

COMMENT ON MATERIALIZED VIEW workflow_service.customer_collection_status IS 'Provides customer collection status summary for reporting';

-- Create indexes on materialized view
CREATE INDEX idx_customer_collection_status_cif ON workflow_service.customer_collection_status(cif);
CREATE INDEX idx_customer_collection_status_segment ON workflow_service.customer_collection_status(segment);
CREATE INDEX idx_customer_collection_status_customer_status ON workflow_service.customer_collection_status(customer_status);
CREATE INDEX idx_customer_collection_status_max_dpd ON workflow_service.customer_collection_status(max_dpd);
CREATE INDEX idx_customer_collection_status_call_agent_id ON workflow_service.customer_collection_status(call_agent_id);
CREATE INDEX idx_customer_collection_status_field_agent_id ON workflow_service.customer_collection_status(field_agent_id);
CREATE INDEX idx_customer_collection_status_call_agent_user_id ON workflow_service.customer_collection_status(call_agent_user_id);
CREATE INDEX idx_customer_collection_status_field_agent_user_id ON workflow_service.customer_collection_status(field_agent_user_id);

-- =============================================
-- CREATE FUNCTIONS FOR MATERIALIZED VIEW REFRESH
-- =============================================

-- Function to refresh workflow materialized views
CREATE OR REPLACE FUNCTION workflow_service.refresh_workflow_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY workflow_service.agent_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY workflow_service.customer_collection_status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.refresh_workflow_materialized_views() IS 'Refreshes all workflow service materialized views';

-- =============================================
-- INSERT INITIAL CONFIGURATION DATA
-- =============================================

-- Insert initial action types (migrated from enum)
INSERT INTO workflow_service.action_types (code, name, description, display_order, created_by, updated_by) VALUES
('CALL', 'Call', 'Phone call to customer', 1, 'SYSTEM', 'SYSTEM'),
('VISIT', 'Visit', 'Physical visit to customer location', 2, 'SYSTEM', 'SYSTEM'),
('EMAIL', 'Email', 'Email communication', 3, 'SYSTEM', 'SYSTEM'),
('SMS', 'SMS', 'SMS text message', 4, 'SYSTEM', 'SYSTEM'),
('LETTER', 'Letter', 'Physical letter sent to customer', 5, 'SYSTEM', 'SYSTEM');

-- Insert initial action subtypes (migrated from enum)
INSERT INTO workflow_service.action_subtypes (code, name, description, display_order, created_by, updated_by) VALUES
('REMINDER_CALL', 'Reminder Call', 'Call to remind customer about payment', 1, 'SYSTEM', 'SYSTEM'),
('FOLLOW_UP_CALL', 'Follow-up Call', 'Follow-up call after previous contact', 2, 'SYSTEM', 'SYSTEM'),
('FIELD_VISIT', 'Field Visit', 'Visit to customer premises', 3, 'SYSTEM', 'SYSTEM'),
('COURTESY_CALL', 'Courtesy Call', 'Courtesy call to customer', 4, 'SYSTEM', 'SYSTEM'),
('PAYMENT_REMINDER', 'Payment Reminder', 'Reminder about due payment', 5, 'SYSTEM', 'SYSTEM'),
('DISPUTE_RESOLUTION', 'Dispute Resolution', 'Call to resolve disputes', 6, 'SYSTEM', 'SYSTEM');

-- Insert initial action results (migrated from enum)
INSERT INTO workflow_service.action_results (code, name, description, display_order, created_by, updated_by) VALUES
('PROMISE_TO_PAY', 'Promise to Pay', 'Customer promised to make payment', 1, 'SYSTEM', 'SYSTEM'),
('PAYMENT_MADE', 'Payment Made', 'Customer made payment during contact', 2, 'SYSTEM', 'SYSTEM'),
('NO_CONTACT', 'No Contact', 'Unable to contact customer', 3, 'SYSTEM', 'SYSTEM'),
('REFUSED_TO_PAY', 'Refused to Pay', 'Customer refused to make payment', 4, 'SYSTEM', 'SYSTEM'),
('DISPUTE', 'Dispute', 'Customer disputed the debt', 5, 'SYSTEM', 'SYSTEM'),
('PARTIAL_PAYMENT', 'Partial Payment', 'Customer made partial payment', 6, 'SYSTEM', 'SYSTEM'),
('RESCHEDULED', 'Rescheduled', 'Contact rescheduled for later', 7, 'SYSTEM', 'SYSTEM');

-- Insert initial type-subtype mappings
INSERT INTO workflow_service.action_type_subtype_mappings (action_type_id, action_subtype_id, created_by, updated_by)
SELECT
    at.id,
    ast.id,
    'SYSTEM',
    'SYSTEM'
FROM workflow_service.action_types at
CROSS JOIN workflow_service.action_subtypes ast
WHERE
    (at.code = 'CALL' AND ast.code IN ('REMINDER_CALL', 'FOLLOW_UP_CALL', 'COURTESY_CALL', 'DISPUTE_RESOLUTION'))
    OR (at.code = 'VISIT' AND ast.code IN ('FIELD_VISIT'))
    OR (at.code = 'EMAIL' AND ast.code IN ('PAYMENT_REMINDER', 'DISPUTE_RESOLUTION'))
    OR (at.code = 'SMS' AND ast.code IN ('PAYMENT_REMINDER'))
    OR (at.code = 'LETTER' AND ast.code IN ('PAYMENT_REMINDER', 'DISPUTE_RESOLUTION'));

-- Insert initial subtype-result mappings
INSERT INTO workflow_service.action_subtype_result_mappings (action_subtype_id, action_result_id, created_by, updated_by)
SELECT
    ast.id,
    ar.id,
    'SYSTEM',
    'SYSTEM'
FROM workflow_service.action_subtypes ast
CROSS JOIN workflow_service.action_results ar
WHERE
    -- All subtypes can have these common results
    ar.code IN ('NO_CONTACT', 'RESCHEDULED')
    OR
    -- Specific mappings
    (ast.code IN ('REMINDER_CALL', 'FOLLOW_UP_CALL', 'COURTESY_CALL') AND ar.code IN ('PROMISE_TO_PAY', 'PAYMENT_MADE', 'REFUSED_TO_PAY', 'DISPUTE', 'PARTIAL_PAYMENT'))
    OR (ast.code = 'FIELD_VISIT' AND ar.code IN ('PROMISE_TO_PAY', 'PAYMENT_MADE', 'REFUSED_TO_PAY', 'DISPUTE', 'PARTIAL_PAYMENT'))
    OR (ast.code = 'PAYMENT_REMINDER' AND ar.code IN ('PROMISE_TO_PAY', 'PAYMENT_MADE', 'PARTIAL_PAYMENT'))
    OR (ast.code = 'DISPUTE_RESOLUTION' AND ar.code IN ('DISPUTE', 'PROMISE_TO_PAY', 'PAYMENT_MADE'));

-- =============================================
-- VIEWS FOR EASY QUERYING
-- =============================================

-- View to get action records with readable names
CREATE VIEW workflow_service.v_action_records AS
SELECT 
    ar.id,
    ar.cif,
    ar.loan_account_number,
    ar.agent_id,
    a.name AS agent_name,
    at.code AS action_type_code,
    at.name AS action_type_name,
    ast.code AS action_subtype_code,
    ast.name AS action_subtype_name,
    ares.code AS action_result_code,
    ares.name AS action_result_name,
    ar.action_date,
    ar.f_update,
    ar.notes,
    ar.call_trace_id,
    ar.visit_latitude,
    ar.visit_longitude,
    ar.visit_address,
    ar.created_at,
    ar.updated_at,
    ar.created_by,
    ar.updated_by
FROM workflow_service.action_records ar
INNER JOIN workflow_service.agents a ON ar.agent_id = a.id
INNER JOIN workflow_service.action_types at ON ar.action_type_id = at.id
INNER JOIN workflow_service.action_subtypes ast ON ar.action_subtype_id = ast.id
INNER JOIN workflow_service.action_results ares ON ar.action_result_id = ares.id;

COMMENT ON VIEW workflow_service.v_action_records IS 'View providing action records with readable type, subtype, and result names';

-- View to get action configuration hierarchy
CREATE VIEW workflow_service.v_action_configuration AS
SELECT 
    at.id AS type_id,
    at.code AS type_code,
    at.name AS type_name,
    ast.id AS subtype_id,
    ast.code AS subtype_code,
    ast.name AS subtype_name,
    ar.id AS result_id,
    ar.code AS result_code,
    ar.name AS result_name,
    atsm.is_active AS type_subtype_active,
    asrm.is_active AS subtype_result_active
FROM workflow_service.action_types at
INNER JOIN workflow_service.action_type_subtype_mappings atsm ON at.id = atsm.action_type_id
INNER JOIN workflow_service.action_subtypes ast ON atsm.action_subtype_id = ast.id
INNER JOIN workflow_service.action_subtype_result_mappings asrm ON ast.id = asrm.action_subtype_id
INNER JOIN workflow_service.action_results ar ON asrm.action_result_id = ar.id
WHERE at.is_active = TRUE 
    AND ast.is_active = TRUE 
    AND ar.is_active = TRUE
ORDER BY at.display_order, at.name, ast.display_order, ast.name, ar.display_order, ar.name;

COMMENT ON VIEW workflow_service.v_action_configuration IS 'View showing the complete action configuration hierarchy with all valid combinations';