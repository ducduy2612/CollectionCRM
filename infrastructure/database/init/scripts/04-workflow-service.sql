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
-- Drop status dictionary management functions
DROP FUNCTION IF EXISTS workflow_service.add_customer_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_collateral_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_processing_state(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_processing_substate(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_lending_violation_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.add_recovery_ability_status(VARCHAR, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.map_state_to_substate(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.get_substates_for_state(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.validate_processing_state_configuration(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_customer_status(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_collateral_status(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_processing_state(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_processing_substate(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_lending_violation_status(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.deactivate_recovery_ability_status(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.remove_state_substate_mapping(VARCHAR, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS workflow_service.get_status_usage_stats() CASCADE;

-- Drop tables in dependency order (partitioned tables and their partitions will be dropped automatically)
DROP TABLE IF EXISTS workflow_service.customer_case_actions CASCADE;
-- Drop status tracking tables
DROP TABLE IF EXISTS workflow_service.recovery_ability_status CASCADE;
DROP TABLE IF EXISTS workflow_service.lending_violation_status CASCADE;
DROP TABLE IF EXISTS workflow_service.processing_state_status CASCADE;
DROP TABLE IF EXISTS workflow_service.collateral_status CASCADE;
DROP TABLE IF EXISTS workflow_service.customer_status CASCADE;
-- Drop mapping tables
DROP TABLE IF EXISTS workflow_service.processing_state_substate_mappings CASCADE;
-- Drop dictionary tables
DROP TABLE IF EXISTS workflow_service.recovery_ability_status_dict CASCADE;
DROP TABLE IF EXISTS workflow_service.lending_violation_status_dict CASCADE;
DROP TABLE IF EXISTS workflow_service.processing_substate_dict CASCADE;
DROP TABLE IF EXISTS workflow_service.processing_state_dict CASCADE;
DROP TABLE IF EXISTS workflow_service.collateral_status_dict CASCADE;
DROP TABLE IF EXISTS workflow_service.customer_status_dict CASCADE;
DROP TABLE IF EXISTS workflow_service.customer_cases CASCADE;
DROP TABLE IF EXISTS workflow_service.action_records CASCADE; -- This will drop all partitions automatically
DROP TABLE IF EXISTS workflow_service.customer_agents CASCADE; -- This will drop all partitions automatically
DROP TABLE IF EXISTS workflow_service.customer_agent_staging CASCADE;
DROP TABLE IF EXISTS workflow_service.action_subtype_result_mappings CASCADE;
DROP TABLE IF EXISTS workflow_service.action_type_subtype_mappings CASCADE;
DROP TABLE IF EXISTS workflow_service.action_results CASCADE;
DROP TABLE IF EXISTS workflow_service.action_subtypes CASCADE;
DROP TABLE IF EXISTS workflow_service.action_types CASCADE;
DROP TABLE IF EXISTS workflow_service.agents CASCADE;
-- DROP User input tables:
DROP TABLE IF EXISTS workflow_service.phones CASCADE;
DROP TABLE IF EXISTS workflow_service.addresses CASCADE;
DROP TABLE IF EXISTS workflow_service.emails CASCADE;
DROP TABLE IF EXISTS workflow_service.reference_customers CASCADE;

-- =============================================
-- CollectionCRM Database Initialization
-- 04-workflow-service.sql: Workflow service schema tables, indexes, partitions, and materialized views
-- =============================================

-- =============================================
-- CREATE TABLES - WORKFLOW_SERVICE SCHEMA
-- =============================================

-- Reference Customers table
CREATE TABLE workflow_service.reference_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_cif VARCHAR(20) NOT NULL UNIQUE,
    primary_cif VARCHAR(20) NOT NULL,
    relationship_type VARCHAR(30) NOT NULL,
    type customer_type NOT NULL,
    name VARCHAR(100),
    date_of_birth DATE,
    national_id VARCHAR(20),
    gender VARCHAR(10),
    company_name VARCHAR(100),
    registration_number VARCHAR(20),
    tax_id VARCHAR(20),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workflow_service.reference_customers IS 'Stores related contacts to customers (such as guarantors, spouses, or other related parties) - user input';

-- Phones table
CREATE TABLE workflow_service.phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    ref_cif VARCHAR(20) NULL,
    type VARCHAR(20) NOT NULL,
    number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (cif, ref_cif, type)
);

COMMENT ON TABLE workflow_service.phones IS 'Stores phone numbers associated with customers - user input';

-- Addresses table
CREATE TABLE workflow_service.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    ref_cif VARCHAR(20) NULL,
    type VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (cif, ref_cif, type)
);

COMMENT ON TABLE workflow_service.addresses IS 'Stores physical addresses associated with customers - user input';

-- Emails table
CREATE TABLE workflow_service.emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    ref_cif VARCHAR(20) NULL,
    address VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (cif, ref_cif, address)
);

COMMENT ON TABLE workflow_service.emails IS 'Stores email addresses associated with customers - user input';

-- Agents table
CREATE TABLE workflow_service.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    type VARCHAR(20) NOT NULL,
    team VARCHAR(30) NOT NULL,
    user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
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
    is_promise BOOLEAN NOT NULL DEFAULT FALSE,
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
    action_date TIMESTAMP NOT NULL DEFAULT NOW(),
    promise_date TIMESTAMP,
    promise_amount DECIMAL(18,2),
    due_amount DECIMAL(18,2),
    dpd INTEGER,
    f_update TIMESTAMP,
    notes TEXT,
    visit_latitude DECIMAL(10,8),
    visit_longitude DECIMAL(11,8),
    visit_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
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
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
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

-- Customer Agent Staging table for bulk operations
CREATE TABLE workflow_service.customer_agent_staging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL,
    line_number INTEGER NOT NULL,
    cif VARCHAR(20) NOT NULL,
    assigned_call_agent_name VARCHAR(100),
    assigned_field_agent_name VARCHAR(100),
    assigned_call_agent_id UUID,
    assigned_field_agent_id UUID,
    validation_status VARCHAR(20) DEFAULT 'pending',
    validation_errors TEXT,
    processing_status VARCHAR(20) DEFAULT 'pending',
    processing_errors TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.customer_agent_staging IS 'Staging table for bulk customer agent assignment operations';

-- Create indexes for staging table
CREATE INDEX idx_customer_agent_staging_batch_id ON workflow_service.customer_agent_staging(batch_id);
CREATE INDEX idx_customer_agent_staging_validation_status ON workflow_service.customer_agent_staging(validation_status);
CREATE INDEX idx_customer_agent_staging_processing_status ON workflow_service.customer_agent_staging(processing_status);
CREATE INDEX idx_customer_agent_staging_cif ON workflow_service.customer_agent_staging(cif);
CREATE INDEX idx_customer_agent_staging_line_number ON workflow_service.customer_agent_staging(line_number);

-- Customer Cases table
CREATE TABLE workflow_service.customer_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL UNIQUE,
    assigned_call_agent_id UUID,
    assigned_field_agent_id UUID,
    f_update TIMESTAMP,
    master_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    CONSTRAINT fk_customer_case_call_agent FOREIGN KEY (assigned_call_agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_customer_case_field_agent FOREIGN KEY (assigned_field_agent_id) REFERENCES workflow_service.agents(id)
);

COMMENT ON TABLE workflow_service.customer_cases IS 'Stores the current status of customers for strategy allocation';

-- =============================================
-- STATUS DICTIONARY TABLES (Frontend Manageable)
-- =============================================

-- Customer Status Dictionary
CREATE TABLE workflow_service.customer_status_dict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.customer_status_dict IS 'Dictionary of customer status values - manageable from frontend';

-- Collateral Status Dictionary
CREATE TABLE workflow_service.collateral_status_dict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.collateral_status_dict IS 'Dictionary of collateral status values - manageable from frontend';

-- Processing State Dictionary
CREATE TABLE workflow_service.processing_state_dict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.processing_state_dict IS 'Dictionary of processing state values - manageable from frontend';

-- Processing Substate Dictionary
CREATE TABLE workflow_service.processing_substate_dict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.processing_substate_dict IS 'Dictionary of processing substate values - manageable from frontend';

-- State-Substate Mapping table
CREATE TABLE workflow_service.processing_state_substate_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID NOT NULL,
    substate_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_state_mapping_state FOREIGN KEY (state_id) REFERENCES workflow_service.processing_state_dict(id) ON DELETE CASCADE,
    CONSTRAINT fk_state_mapping_substate FOREIGN KEY (substate_id) REFERENCES workflow_service.processing_substate_dict(id) ON DELETE CASCADE,
    CONSTRAINT uk_state_substate_mapping UNIQUE (state_id, substate_id)
);

COMMENT ON TABLE workflow_service.processing_state_substate_mappings IS 'Maps processing states to their allowed substates';

-- Lending Violation Status Dictionary
CREATE TABLE workflow_service.lending_violation_status_dict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.lending_violation_status_dict IS 'Dictionary of lending violation status values - manageable from frontend';

-- Recovery Ability Status Dictionary
CREATE TABLE workflow_service.recovery_ability_status_dict (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL
);

COMMENT ON TABLE workflow_service.recovery_ability_status_dict IS 'Dictionary of recovery ability status values - manageable from frontend';

-- =============================================
-- STATUS TRACKING TABLES (Using Dictionary References)
-- =============================================

-- Customer Status table
CREATE TABLE workflow_service.customer_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    status_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_customer_status_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_customer_status_dict FOREIGN KEY (status_id) REFERENCES workflow_service.customer_status_dict(id)
);

COMMENT ON TABLE workflow_service.customer_status IS 'Stores customer status updates from agents';

-- Collateral Status table (with link to collaterals)
CREATE TABLE workflow_service.collateral_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    collateral_number VARCHAR(20),
    agent_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    status_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_collateral_status_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_collateral_status_dict FOREIGN KEY (status_id) REFERENCES workflow_service.collateral_status_dict(id)
);

COMMENT ON TABLE workflow_service.collateral_status IS 'Stores collateral status updates from agents - linked to specific collaterals';

-- Processing State Status table (with state and substate)
CREATE TABLE workflow_service.processing_state_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    state_id UUID NOT NULL,
    substate_id UUID,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_processing_state_status_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_processing_state_status_state FOREIGN KEY (state_id) REFERENCES workflow_service.processing_state_dict(id),
    CONSTRAINT fk_processing_state_status_substate FOREIGN KEY (substate_id) REFERENCES workflow_service.processing_substate_dict(id)
);

COMMENT ON TABLE workflow_service.processing_state_status IS 'Stores processing state updates with state and substate';

-- Lending Violation Status table
CREATE TABLE workflow_service.lending_violation_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    status_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_lending_violation_status_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_lending_violation_status_dict FOREIGN KEY (status_id) REFERENCES workflow_service.lending_violation_status_dict(id)
);

COMMENT ON TABLE workflow_service.lending_violation_status IS 'Stores lending violation status updates from agents';

-- Recovery Ability Status table
CREATE TABLE workflow_service.recovery_ability_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    action_date TIMESTAMP NOT NULL,
    status_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    CONSTRAINT fk_recovery_ability_status_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id),
    CONSTRAINT fk_recovery_ability_status_dict FOREIGN KEY (status_id) REFERENCES workflow_service.recovery_ability_status_dict(id)
);

COMMENT ON TABLE workflow_service.recovery_ability_status IS 'Stores recovery ability status updates from agents';

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

-- =============================================
-- STATUS DICTIONARY TABLE INDEXES
-- =============================================

-- Customer Status Dictionary indexes
CREATE INDEX idx_customer_status_dict_code ON workflow_service.customer_status_dict(code);
CREATE INDEX idx_customer_status_dict_is_active ON workflow_service.customer_status_dict(is_active);
CREATE INDEX idx_customer_status_dict_display_order ON workflow_service.customer_status_dict(display_order);

-- Collateral Status Dictionary indexes
CREATE INDEX idx_collateral_status_dict_code ON workflow_service.collateral_status_dict(code);
CREATE INDEX idx_collateral_status_dict_is_active ON workflow_service.collateral_status_dict(is_active);
CREATE INDEX idx_collateral_status_dict_display_order ON workflow_service.collateral_status_dict(display_order);

-- Processing State Dictionary indexes
CREATE INDEX idx_processing_state_dict_code ON workflow_service.processing_state_dict(code);
CREATE INDEX idx_processing_state_dict_is_active ON workflow_service.processing_state_dict(is_active);
CREATE INDEX idx_processing_state_dict_display_order ON workflow_service.processing_state_dict(display_order);

-- Processing Substate Dictionary indexes
CREATE INDEX idx_processing_substate_dict_code ON workflow_service.processing_substate_dict(code);
CREATE INDEX idx_processing_substate_dict_is_active ON workflow_service.processing_substate_dict(is_active);
CREATE INDEX idx_processing_substate_dict_display_order ON workflow_service.processing_substate_dict(display_order);

-- Processing State-Substate Mappings indexes
CREATE INDEX idx_processing_state_substate_mappings_state_id ON workflow_service.processing_state_substate_mappings(state_id);
CREATE INDEX idx_processing_state_substate_mappings_substate_id ON workflow_service.processing_state_substate_mappings(substate_id);
CREATE INDEX idx_processing_state_substate_mappings_is_active ON workflow_service.processing_state_substate_mappings(is_active);

-- Lending Violation Status Dictionary indexes
CREATE INDEX idx_lending_violation_status_dict_code ON workflow_service.lending_violation_status_dict(code);
CREATE INDEX idx_lending_violation_status_dict_is_active ON workflow_service.lending_violation_status_dict(is_active);
CREATE INDEX idx_lending_violation_status_dict_display_order ON workflow_service.lending_violation_status_dict(display_order);

-- Recovery Ability Status Dictionary indexes
CREATE INDEX idx_recovery_ability_status_dict_code ON workflow_service.recovery_ability_status_dict(code);
CREATE INDEX idx_recovery_ability_status_dict_is_active ON workflow_service.recovery_ability_status_dict(is_active);
CREATE INDEX idx_recovery_ability_status_dict_display_order ON workflow_service.recovery_ability_status_dict(display_order);

-- =============================================
-- STATUS TRACKING TABLE INDEXES
-- =============================================

-- Customer Status indexes
CREATE INDEX idx_customer_status_cif ON workflow_service.customer_status(cif);
CREATE INDEX idx_customer_status_agent_id ON workflow_service.customer_status(agent_id);
CREATE INDEX idx_customer_status_action_date ON workflow_service.customer_status(action_date);
CREATE INDEX idx_customer_status_status_id ON workflow_service.customer_status(status_id);
CREATE INDEX idx_customer_status_cif_action_date ON workflow_service.customer_status(cif, action_date);

-- Collateral Status indexes
CREATE INDEX idx_collateral_status_cif ON workflow_service.collateral_status(cif);
CREATE INDEX idx_collateral_status_collateral_number ON workflow_service.collateral_status(collateral_number);
CREATE INDEX idx_collateral_status_agent_id ON workflow_service.collateral_status(agent_id);
CREATE INDEX idx_collateral_status_action_date ON workflow_service.collateral_status(action_date);
CREATE INDEX idx_collateral_status_status_id ON workflow_service.collateral_status(status_id);
CREATE INDEX idx_collateral_status_cif_action_date ON workflow_service.collateral_status(cif, action_date);

-- Processing State Status indexes
CREATE INDEX idx_processing_state_status_cif ON workflow_service.processing_state_status(cif);
CREATE INDEX idx_processing_state_status_agent_id ON workflow_service.processing_state_status(agent_id);
CREATE INDEX idx_processing_state_status_action_date ON workflow_service.processing_state_status(action_date);
CREATE INDEX idx_processing_state_status_state_id ON workflow_service.processing_state_status(state_id);
CREATE INDEX idx_processing_state_status_substate_id ON workflow_service.processing_state_status(substate_id);
CREATE INDEX idx_processing_state_status_cif_action_date ON workflow_service.processing_state_status(cif, action_date);

-- Lending Violation Status indexes
CREATE INDEX idx_lending_violation_status_cif ON workflow_service.lending_violation_status(cif);
CREATE INDEX idx_lending_violation_status_agent_id ON workflow_service.lending_violation_status(agent_id);
CREATE INDEX idx_lending_violation_status_action_date ON workflow_service.lending_violation_status(action_date);
CREATE INDEX idx_lending_violation_status_status_id ON workflow_service.lending_violation_status(status_id);
CREATE INDEX idx_lending_violation_status_cif_action_date ON workflow_service.lending_violation_status(cif, action_date);

-- Recovery Ability Status indexes
CREATE INDEX idx_recovery_ability_status_cif ON workflow_service.recovery_ability_status(cif);
CREATE INDEX idx_recovery_ability_status_agent_id ON workflow_service.recovery_ability_status(agent_id);
CREATE INDEX idx_recovery_ability_status_action_date ON workflow_service.recovery_ability_status(action_date);
CREATE INDEX idx_recovery_ability_status_status_id ON workflow_service.recovery_ability_status(status_id);
CREATE INDEX idx_recovery_ability_status_cif_action_date ON workflow_service.recovery_ability_status(cif, action_date);

-- Phone indexes
CREATE INDEX idx_phones_number ON workflow_service.phones(number);
CREATE INDEX idx_phones_cif ON workflow_service.phones(cif);
CREATE INDEX idx_phones_ref_cif ON workflow_service.phones(ref_cif);

-- Address indexes
CREATE INDEX idx_addresses_city ON workflow_service.addresses(city);
CREATE INDEX idx_addresses_state ON workflow_service.addresses(state);
CREATE INDEX idx_addresses_country ON workflow_service.addresses(country);
CREATE INDEX idx_addresses_cif ON workflow_service.addresses(cif);
CREATE INDEX idx_addresses_ref_cif ON workflow_service.addresses(ref_cif);

-- Email indexes
CREATE INDEX idx_emails_address ON workflow_service.emails(address);
CREATE INDEX idx_emails_cif ON workflow_service.emails(cif);
CREATE INDEX idx_emails_ref_cif ON workflow_service.emails(ref_cif);

-- Reference Customer indexes
CREATE INDEX idx_reference_customers_primary_cif ON workflow_service.reference_customers(primary_cif);
CREATE INDEX idx_reference_customers_relationship_type ON workflow_service.reference_customers(relationship_type);
CREATE INDEX idx_reference_customers_national_id ON workflow_service.reference_customers(national_id);
CREATE INDEX idx_reference_customers_registration_number ON workflow_service.reference_customers(registration_number);

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

-- =============================================
-- CREATE FUNCTIONS FOR MATERIALIZED VIEW REFRESH
-- =============================================

-- Function to refresh workflow materialized views
CREATE OR REPLACE FUNCTION workflow_service.refresh_workflow_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY workflow_service.agent_performance;
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
-- INSERT INITIAL STATUS DICTIONARY DATA
-- =============================================

-- Insert initial customer status dictionary
INSERT INTO workflow_service.customer_status_dict (code, name, description, color, display_order, created_by, updated_by) VALUES
('ACTIVE', 'Active', 'Customer is actively engaged', '#28a745', 1, 'SYSTEM', 'SYSTEM'),
('UNRESPONSIVE', 'Unresponsive', 'Customer is not responding to contacts', '#ffc107', 2, 'SYSTEM', 'SYSTEM'),
('COOPERATIVE', 'Cooperative', 'Customer is cooperative and willing to resolve', '#17a2b8', 3, 'SYSTEM', 'SYSTEM'),
('HOSTILE', 'Hostile', 'Customer is hostile or aggressive', '#dc3545', 4, 'SYSTEM', 'SYSTEM'),
('DECEASED', 'Deceased', 'Customer is deceased', '#6c757d', 5, 'SYSTEM', 'SYSTEM'),
('RELOCATED', 'Relocated', 'Customer has moved to unknown address', '#fd7e14', 6, 'SYSTEM', 'SYSTEM');

-- Insert initial collateral status dictionary
INSERT INTO workflow_service.collateral_status_dict (code, name, description, color, display_order, created_by, updated_by) VALUES
('SECURED', 'Secured', 'Collateral is properly secured', '#28a745', 1, 'SYSTEM', 'SYSTEM'),
('AT_RISK', 'At Risk', 'Collateral may be at risk', '#ffc107', 2, 'SYSTEM', 'SYSTEM'),
('MISSING', 'Missing', 'Collateral cannot be located', '#dc3545', 3, 'SYSTEM', 'SYSTEM'),
('DAMAGED', 'Damaged', 'Collateral is damaged', '#fd7e14', 4, 'SYSTEM', 'SYSTEM'),
('SOLD', 'Sold', 'Collateral has been sold by customer', '#6c757d', 5, 'SYSTEM', 'SYSTEM'),
('REPOSSESSED', 'Repossessed', 'Collateral has been repossessed', '#17a2b8', 6, 'SYSTEM', 'SYSTEM');

-- Insert initial processing state dictionary
INSERT INTO workflow_service.processing_state_dict (code, name, description, color, display_order, created_by, updated_by) VALUES
('INVESTIGATION', 'Investigation', 'Case is under investigation', '#17a2b8', 1, 'SYSTEM', 'SYSTEM'),
('CONTACT', 'Contact', 'Attempting to contact customer', '#ffc107', 2, 'SYSTEM', 'SYSTEM'),
('NEGOTIATION', 'Negotiation', 'Negotiating with customer', '#fd7e14', 3, 'SYSTEM', 'SYSTEM'),
('LEGAL', 'Legal', 'Legal action in progress', '#dc3545', 4, 'SYSTEM', 'SYSTEM'),
('RESOLUTION', 'Resolution', 'Case is being resolved', '#28a745', 5, 'SYSTEM', 'SYSTEM');

-- Insert initial processing substate dictionary
INSERT INTO workflow_service.processing_substate_dict (code, name, description, color, display_order, created_by, updated_by) VALUES
-- Investigation substates
('INITIAL_REVIEW', 'Initial Review', 'Initial case review and assessment', '#17a2b8', 1, 'SYSTEM', 'SYSTEM'),
('DOCUMENT_COLLECTION', 'Document Collection', 'Collecting required documents', '#17a2b8', 2, 'SYSTEM', 'SYSTEM'),
('VERIFICATION', 'Verification', 'Verifying customer information and claims', '#17a2b8', 3, 'SYSTEM', 'SYSTEM'),
-- Contact substates
('FIRST_CONTACT', 'First Contact', 'Initial contact attempt', '#ffc107', 10, 'SYSTEM', 'SYSTEM'),
('FOLLOW_UP', 'Follow Up', 'Follow-up contact', '#ffc107', 11, 'SYSTEM', 'SYSTEM'),
('ESCALATED_CONTACT', 'Escalated Contact', 'Escalated contact attempt', '#ffc107', 12, 'SYSTEM', 'SYSTEM'),
-- Negotiation substates
('PAYMENT_PLAN', 'Payment Plan', 'Negotiating payment plan', '#fd7e14', 20, 'SYSTEM', 'SYSTEM'),
('SETTLEMENT', 'Settlement', 'Settlement negotiation', '#fd7e14', 21, 'SYSTEM', 'SYSTEM'),
('RESTRUCTURE', 'Restructure', 'Loan restructuring discussion', '#fd7e14', 22, 'SYSTEM', 'SYSTEM'),
-- Legal substates
('NOTICE_SENT', 'Notice Sent', 'Legal notice sent', '#dc3545', 30, 'SYSTEM', 'SYSTEM'),
('COURT_FILING', 'Court Filing', 'Court case filed', '#dc3545', 31, 'SYSTEM', 'SYSTEM'),
('JUDGMENT', 'Judgment', 'Court judgment obtained', '#dc3545', 32, 'SYSTEM', 'SYSTEM'),
-- Resolution substates
('PAID_IN_FULL', 'Paid in Full', 'Account paid in full', '#28a745', 40, 'SYSTEM', 'SYSTEM'),
('SETTLED', 'Settled', 'Account settled', '#28a745', 41, 'SYSTEM', 'SYSTEM'),
('WRITTEN_OFF', 'Written Off', 'Account written off', '#6c757d', 42, 'SYSTEM', 'SYSTEM'),
('CLOSED', 'Closed', 'Case closed', '#28a745', 43, 'SYSTEM', 'SYSTEM');

-- Insert initial lending violation status dictionary
INSERT INTO workflow_service.lending_violation_status_dict (code, name, description, color, display_order, created_by, updated_by) VALUES
('NONE', 'None', 'No lending violations detected', '#28a745', 1, 'SYSTEM', 'SYSTEM'),
('MINOR', 'Minor', 'Minor lending violations', '#ffc107', 2, 'SYSTEM', 'SYSTEM'),
('MAJOR', 'Major', 'Major lending violations', '#fd7e14', 3, 'SYSTEM', 'SYSTEM'),
('CRITICAL', 'Critical', 'Critical lending violations', '#dc3545', 4, 'SYSTEM', 'SYSTEM'),
('FRAUD_SUSPECTED', 'Fraud Suspected', 'Suspected fraudulent activity', '#6f42c1', 5, 'SYSTEM', 'SYSTEM'),
('UNDER_REVIEW', 'Under Review', 'Violation under review', '#17a2b8', 6, 'SYSTEM', 'SYSTEM');

-- Insert initial recovery ability status dictionary
INSERT INTO workflow_service.recovery_ability_status_dict (code, name, description, color, display_order, created_by, updated_by) VALUES
('HIGH', 'High', 'High recovery potential', '#28a745', 1, 'SYSTEM', 'SYSTEM'),
('MEDIUM', 'Medium', 'Medium recovery potential', '#ffc107', 2, 'SYSTEM', 'SYSTEM'),
('LOW', 'Low', 'Low recovery potential', '#fd7e14', 3, 'SYSTEM', 'SYSTEM'),
('NONE', 'None', 'No recovery potential', '#dc3545', 4, 'SYSTEM', 'SYSTEM'),
('UNKNOWN', 'Unknown', 'Recovery potential unknown', '#6c757d', 5, 'SYSTEM', 'SYSTEM'),
('UNDER_ASSESSMENT', 'Under Assessment', 'Recovery ability being assessed', '#17a2b8', 6, 'SYSTEM', 'SYSTEM');

-- Insert initial processing state-substate mappings
INSERT INTO workflow_service.processing_state_substate_mappings (state_id, substate_id, created_by, updated_by)
SELECT
    ps.id,
    pss.id,
    'SYSTEM',
    'SYSTEM'
FROM workflow_service.processing_state_dict ps
CROSS JOIN workflow_service.processing_substate_dict pss
WHERE
    (ps.code = 'INVESTIGATION' AND pss.code IN ('INITIAL_REVIEW', 'DOCUMENT_COLLECTION', 'VERIFICATION'))
    OR (ps.code = 'CONTACT' AND pss.code IN ('FIRST_CONTACT', 'FOLLOW_UP', 'ESCALATED_CONTACT'))
    OR (ps.code = 'NEGOTIATION' AND pss.code IN ('PAYMENT_PLAN', 'SETTLEMENT', 'RESTRUCTURE'))
    OR (ps.code = 'LEGAL' AND pss.code IN ('NOTICE_SENT', 'COURT_FILING', 'JUDGMENT'))
    OR (ps.code = 'RESOLUTION' AND pss.code IN ('PAID_IN_FULL', 'SETTLED', 'WRITTEN_OFF', 'CLOSED'));

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
    ar.promise_date,
    ar.promise_amount,
    ar.due_amount,
    ar.dpd,
    ar.f_update,
    ar.notes,
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

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- Procedure to populate customer_cases from bank_sync_service.customers
CREATE OR REPLACE FUNCTION workflow_service.populate_customer_cases_from_bank_sync()
RETURNS TABLE(
    inserted_count INTEGER,
    skipped_count INTEGER,
    total_processed INTEGER
) AS $$
DECLARE
    v_inserted_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_total_processed INTEGER := 0;
BEGIN
    -- Insert new customer cases for CIFs that don't exist in workflow_service.customer_cases
    INSERT INTO workflow_service.customer_cases (
        cif,
        assigned_call_agent_id,
        assigned_field_agent_id,
        f_update,
        master_notes,
        created_by,
        updated_by
    )
    SELECT
        bsc.cif,
        NULL, -- assigned_call_agent_id - default to NULL
        NULL, -- assigned_field_agent_id - default to NULL
        NULL, -- f_update - default to NULL
        NULL, -- master_notes - default to NULL
        'SYSTEM', -- created_by
        'SYSTEM'  -- updated_by
    FROM bank_sync_service.customers bsc
    WHERE bsc.cif NOT IN (
        SELECT wcc.cif
        FROM workflow_service.customer_cases wcc
        WHERE wcc.cif IS NOT NULL
    )
    AND bsc.cif IS NOT NULL; -- Ensure we don't insert NULL CIFs
    
    -- Get the number of rows inserted
    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    
    -- Count total customers in bank_sync_service
    SELECT COUNT(*) INTO v_total_processed
    FROM bank_sync_service.customers
    WHERE cif IS NOT NULL;
    
    -- Calculate skipped count
    v_skipped_count := v_total_processed - v_inserted_count;
    
    -- Return the results
    RETURN QUERY SELECT v_inserted_count, v_skipped_count, v_total_processed;
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.populate_customer_cases_from_bank_sync() IS 'Populates workflow_service.customer_cases with CIFs from bank_sync_service.customers that do not already exist. Returns counts of inserted, skipped, and total processed records.';

-- Simple procedure wrapper for easier calling (without return values)
CREATE OR REPLACE FUNCTION workflow_service.sync_customer_cases()
RETURNS void AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- Call the main function and capture results
    SELECT * INTO result_record
    FROM workflow_service.populate_customer_cases_from_bank_sync();
    
    -- Log the results
    RAISE NOTICE 'Customer cases sync completed: % inserted, % skipped, % total processed',
        result_record.inserted_count,
        result_record.skipped_count,
        result_record.total_processed;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.sync_customer_cases() IS 'Simple wrapper to sync customer cases from bank sync service. Logs results to console.';

-- =============================================
-- BULK OPERATIONS STORED PROCEDURES
-- =============================================

-- Function to bulk validate staging batch
CREATE OR REPLACE FUNCTION workflow_service.bulk_validate_staging_batch(p_batch_id UUID)
RETURNS TABLE(
    valid_count INTEGER,
    invalid_count INTEGER
) AS $$
BEGIN
    -- Step 1: Validate and resolve call agent names
    UPDATE workflow_service.customer_agent_staging 
    SET assigned_call_agent_id = agents.id,
        validation_status = 'valid'
    FROM workflow_service.agents
    WHERE customer_agent_staging.batch_id = p_batch_id
      AND customer_agent_staging.assigned_call_agent_name = agents.name
      AND agents.is_active = true
      AND customer_agent_staging.assigned_call_agent_name IS NOT NULL;

    -- Step 2: Validate and resolve field agent names
    UPDATE workflow_service.customer_agent_staging 
    SET assigned_field_agent_id = agents.id,
        validation_status = 'valid'
    FROM workflow_service.agents
    WHERE customer_agent_staging.batch_id = p_batch_id
      AND customer_agent_staging.assigned_field_agent_name = agents.name
      AND agents.is_active = true
      AND customer_agent_staging.assigned_field_agent_name IS NOT NULL;

    -- Step 3: Mark records with invalid call agent names
    UPDATE workflow_service.customer_agent_staging 
    SET validation_status = 'invalid',
        validation_errors = 'Call agent not found: ' || assigned_call_agent_name
    WHERE batch_id = p_batch_id
      AND assigned_call_agent_name IS NOT NULL
      AND assigned_call_agent_id IS NULL;

    -- Step 4: Mark records with invalid field agent names
    UPDATE workflow_service.customer_agent_staging 
    SET validation_status = 'invalid',
        validation_errors = COALESCE(validation_errors || '; ', '') || 'Field agent not found: ' || assigned_field_agent_name
    WHERE batch_id = p_batch_id
      AND assigned_field_agent_name IS NOT NULL
      AND assigned_field_agent_id IS NULL;

    -- Step 5: Mark records with no agents assigned
    UPDATE workflow_service.customer_agent_staging 
    SET validation_status = 'invalid',
        validation_errors = 'At least one agent must be assigned'
    WHERE batch_id = p_batch_id
      AND assigned_call_agent_name IS NULL
      AND assigned_field_agent_name IS NULL;

    -- Step 6: Validate CIF format
    UPDATE workflow_service.customer_agent_staging 
    SET validation_status = 'invalid',
        validation_errors = COALESCE(validation_errors || '; ', '') || 'Invalid CIF format'
    WHERE batch_id = p_batch_id
      AND (cif IS NULL OR LENGTH(TRIM(cif)) < 3);

    -- Step 7: Set remaining records as valid
    UPDATE workflow_service.customer_agent_staging 
    SET validation_status = 'valid'
    WHERE batch_id = p_batch_id
      AND validation_status = 'pending';

    -- Return validation counts
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging 
         WHERE batch_id = p_batch_id AND validation_status = 'valid') as valid_count,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging 
         WHERE batch_id = p_batch_id AND validation_status = 'invalid') as invalid_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.bulk_validate_staging_batch(UUID) IS 'Validates staging batch by resolving agent names and validating CIFs';

-- Function to bulk process staging batch
CREATE OR REPLACE FUNCTION workflow_service.bulk_process_staging_batch(p_batch_id UUID, p_processed_by VARCHAR(50))
RETURNS TABLE(
    total_rows INTEGER,
    valid_rows INTEGER,
    invalid_rows INTEGER,
    processed_rows INTEGER,
    failed_rows INTEGER,
    skipped_rows INTEGER
) AS $$
DECLARE
    v_counts RECORD;
    v_first_occurrence_cte TEXT;
BEGIN
    -- Pre-calculate all counts in one query
    SELECT 
        COUNT(*)::INTEGER as total,
        COUNT(CASE WHEN validation_status = 'valid' THEN 1 END)::INTEGER as valid,
        COUNT(CASE WHEN validation_status = 'invalid' THEN 1 END)::INTEGER as invalid
    INTO v_counts
    FROM workflow_service.customer_agent_staging 
    WHERE batch_id = p_batch_id;

    -- Create temporary table with first occurrence CIFs for better performance
    CREATE TEMP TABLE temp_first_occurrence AS 
    SELECT DISTINCT ON (cif) id, cif, assigned_call_agent_id, assigned_field_agent_id, line_number
    FROM workflow_service.customer_agent_staging
    WHERE batch_id = p_batch_id AND validation_status = 'valid'
    ORDER BY cif, line_number ASC;

    -- Step 1: End current assignments for CIFs that will be reassigned
    -- Use EXISTS instead of IN for better performance
    UPDATE workflow_service.customer_agents 
    SET is_current = false, 
        end_date = CURRENT_DATE,
        updated_by = p_processed_by
    WHERE is_current = true
      AND EXISTS (
        SELECT 1 FROM temp_first_occurrence tfo 
        WHERE tfo.cif = customer_agents.cif
      );

    -- Step 2: Create new assignments from staging (using temp table)
    INSERT INTO workflow_service.customer_agents 
    (cif, assigned_call_agent_id, assigned_field_agent_id, start_date, is_current, created_by, updated_by)
    SELECT 
        tfo.cif,
        tfo.assigned_call_agent_id,
        tfo.assigned_field_agent_id,
        CURRENT_DATE,
        true,
        p_processed_by,
        p_processed_by
    FROM temp_first_occurrence tfo;

    -- Step 3a: Mark the first occurrence of each CIF as processed
    UPDATE workflow_service.customer_agent_staging 
    SET processing_status = 'processed'
    WHERE batch_id = p_batch_id 
      AND validation_status = 'valid'
      AND id IN (SELECT id FROM temp_first_occurrence);

    -- Step 3b: Mark duplicate CIFs as skipped
    UPDATE workflow_service.customer_agent_staging 
    SET processing_status = 'skipped',
        processing_errors = 'Duplicate CIF - only first occurrence processed'
    WHERE batch_id = p_batch_id 
      AND validation_status = 'valid'
      AND processing_status = 'pending';

    -- Step 4: Mark invalid records as failed
    UPDATE workflow_service.customer_agent_staging 
    SET processing_status = 'failed',
        processing_errors = validation_errors
    WHERE batch_id = p_batch_id AND validation_status = 'invalid';

    -- Clean up temp table
    DROP TABLE temp_first_occurrence;

    -- Return processing counts using pre-calculated values and final counts
    RETURN QUERY
    SELECT 
        v_counts.total as total_rows,
        v_counts.valid as valid_rows,
        v_counts.invalid as invalid_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging 
         WHERE batch_id = p_batch_id AND processing_status = 'processed') as processed_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging 
         WHERE batch_id = p_batch_id AND processing_status = 'failed') as failed_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging 
         WHERE batch_id = p_batch_id AND processing_status = 'skipped') as skipped_rows;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.bulk_process_staging_batch(UUID, VARCHAR) IS 'Processes staging batch by creating customer agent assignments';

-- Function to get batch status
CREATE OR REPLACE FUNCTION workflow_service.get_batch_status(p_batch_id UUID)
RETURNS TABLE(
    batch_id UUID,
    total_rows INTEGER,
    valid_rows INTEGER,
    invalid_rows INTEGER,
    processed_rows INTEGER,
    failed_rows INTEGER,
    skipped_rows INTEGER,
    error_details TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_batch_id,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging cas1
         WHERE cas1.batch_id = p_batch_id) as total_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging cas2
         WHERE cas2.batch_id = p_batch_id AND cas2.validation_status = 'valid') as valid_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging cas3
         WHERE cas3.batch_id = p_batch_id AND cas3.validation_status = 'invalid') as invalid_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging cas4
         WHERE cas4.batch_id = p_batch_id AND cas4.processing_status = 'processed') as processed_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging cas5
         WHERE cas5.batch_id = p_batch_id AND cas5.processing_status = 'failed') as failed_rows,
        (SELECT COUNT(*)::INTEGER FROM workflow_service.customer_agent_staging cas6
         WHERE cas6.batch_id = p_batch_id AND cas6.processing_status = 'skipped') as skipped_rows,
        (SELECT ARRAY_AGG('Line ' || cas7.line_number || ': ' || COALESCE(cas7.validation_errors, cas7.processing_errors) ORDER BY cas7.line_number) 
         FROM workflow_service.customer_agent_staging cas7
         WHERE cas7.batch_id = p_batch_id AND (cas7.validation_status = 'invalid' OR cas7.processing_status = 'failed' OR cas7.processing_status = 'skipped')) as error_details;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.get_batch_status(UUID) IS 'Gets comprehensive status of a staging batch';

-- Function to clear staging table
CREATE OR REPLACE FUNCTION workflow_service.clear_staging_table()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    -- Get count before truncate
    SELECT COUNT(*) INTO v_deleted_count FROM workflow_service.customer_agent_staging;
    
    -- Truncate the table (faster than DELETE)
    TRUNCATE TABLE workflow_service.customer_agent_staging;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION workflow_service.clear_staging_table() IS 'Clear all staging table data using TRUNCATE for better performance';