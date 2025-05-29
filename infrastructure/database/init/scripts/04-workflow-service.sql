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

-- Action Records table with partitioning
CREATE TABLE workflow_service.action_records (
    id UUID DEFAULT uuid_generate_v4(),
    PRIMARY KEY (id, action_date),
    cif VARCHAR(20) NOT NULL,
    loan_account_number VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    type action_type NOT NULL,
    subtype action_subtype NOT NULL,
    action_result action_result NOT NULL,
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
    CONSTRAINT fk_action_agent FOREIGN KEY (agent_id) REFERENCES workflow_service.agents(id)
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

-- Action Record indexes
-- Note: For partitioned tables, indexes should be created on each partition
-- These will be automatically created on all partitions
CREATE INDEX idx_action_records_cif ON workflow_service.action_records(cif);
CREATE INDEX idx_action_records_loan_account_number ON workflow_service.action_records(loan_account_number);
CREATE INDEX idx_action_records_agent_id ON workflow_service.action_records(agent_id);
CREATE INDEX idx_action_records_type ON workflow_service.action_records(type);
CREATE INDEX idx_action_records_action_date ON workflow_service.action_records(action_date);
CREATE INDEX idx_action_records_action_result ON workflow_service.action_records(action_result);
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
    COUNT(DISTINCT CASE WHEN ar.action_result = 'PROMISE_TO_PAY' THEN ar.id END) AS payment_promises,
    COUNT(DISTINCT CASE WHEN ar.action_result = 'PAYMENT_MADE' THEN ar.id END) AS payments_received,
    EXTRACT(MONTH FROM ar.action_date) AS month,
    EXTRACT(YEAR FROM ar.action_date) AS year
FROM
    workflow_service.agents a
LEFT JOIN
    workflow_service.action_records ar ON a.id = ar.agent_id
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