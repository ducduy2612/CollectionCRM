# Workflow Service Schema

This file contains the SQL script for implementing the workflow_service schema of the CollectionCRM database.

## SQL Script

```sql
-- =============================================
-- CREATE SCHEMAS
-- =============================================

CREATE SCHEMA IF NOT EXISTS workflow_service;
COMMENT ON SCHEMA workflow_service IS 'Collection workflow-related tables including agents, actions, and cases';

-- =============================================
-- CREATE TYPES
-- =============================================

-- Agent type
CREATE TYPE agent_type AS ENUM ('AGENT', 'SUPERVISOR', 'ADMIN');

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
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workflow_service.agents IS 'Stores information about collection agents and their teams';

-- Action Records table
CREATE TABLE workflow_service.action_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    loan_account_number VARCHAR(20) NOT NULL,
    agent_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    subtype VARCHAR(30) NOT NULL,
    action_result VARCHAR(30) NOT NULL,
    action_date TIMESTAMP NOT NULL,
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

-- Create partitions for action records (example for 2025)
CREATE TABLE workflow_service.action_records_2025_q1 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    
CREATE TABLE workflow_service.action_records_2025_q2 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
    
CREATE TABLE workflow_service.action_records_2025_q3 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
    
CREATE TABLE workflow_service.action_records_2025_q4 PARTITION OF workflow_service.action_records
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Customer Agents table (SCD Type 2)
CREATE TABLE workflow_service.customer_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create partitions for customer agents (example for 2025)
CREATE TABLE workflow_service.customer_agents_2025_q1 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    
CREATE TABLE workflow_service.customer_agents_2025_q2 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
    
CREATE TABLE workflow_service.customer_agents_2025_q3 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
    
CREATE TABLE workflow_service.customer_agents_2025_q4 PARTITION OF workflow_service.customer_agents
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Customer Cases table
CREATE TABLE workflow_service.customer_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL UNIQUE,
    assigned_call_agent_id UUID,
    assigned_field_agent_id UUID,
    f_update TIMESTAMP,
    customer_status VARCHAR(30) NOT NULL,
    collateral_status VARCHAR(30) NOT NULL,
    processing_state_status VARCHAR(30) NOT NULL,
    lending_violation_status VARCHAR(30) NOT NULL,
    recovery_ability_status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
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
    customer_status VARCHAR(30),
    collateral_status VARCHAR(30),
    processing_state_status VARCHAR(30),
    lending_violation_status VARCHAR(30),
    recovery_ability_status VARCHAR(30),
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

-- Action Record indexes
CREATE INDEX idx_action_records_cif ON workflow_service.action_records(cif);
CREATE INDEX idx_action_records_loan_account_number ON workflow_service.action_records(loan_account_number);
CREATE INDEX idx_action_records_agent_id ON workflow_service.action_records(agent_id);
CREATE INDEX idx_action_records_type ON workflow_service.action_records(type);
CREATE INDEX idx_action_records_action_date ON workflow_service.action_records(action_date);
CREATE INDEX idx_action_records_action_result ON workflow_service.action_records(action_result);
CREATE INDEX idx_action_records_cif_action_date ON workflow_service.action_records(cif, action_date);
CREATE INDEX idx_action_records_loan_account_number_action_date ON workflow_service.action_records(loan_account_number, action_date);

-- Customer Agent indexes
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
CREATE INDEX idx_customer_cases_processing_state_status ON workflow_service.customer_cases(processing_state_status);
CREATE INDEX idx_customer_cases_recovery_ability_status ON workflow_service.customer_cases(recovery_ability_status);
CREATE INDEX idx_customer_cases_status_composite ON workflow_service.customer_cases(customer_status, processing_state_status, recovery_ability_status);

-- Customer Case Action indexes
CREATE INDEX idx_customer_case_actions_cif ON workflow_service.customer_case_actions(cif);
CREATE INDEX idx_customer_case_actions_agent_id ON workflow_service.customer_case_actions(agent_id);
CREATE INDEX idx_customer_case_actions_action_date ON workflow_service.customer_case_actions(action_date);

-- =============================================
-- CREATE MATERIALIZED VIEWS
-- =============================================

-- Agent Performance View
CREATE MATERIALIZED VIEW workflow_service.agent_performance AS
SELECT 
    a.id AS agent_id,
    a.name AS agent_name,
    a.team,
    COUNT(DISTINCT ar.id) AS total_actions,
    COUNT(DISTINCT ar.cif) AS total_customers,
    COUNT(DISTINCT CASE WHEN ar.action_result = 'PAYMENT_PROMISE' THEN ar.id END) AS payment_promises,
    COUNT(DISTINCT CASE WHEN ar.action_result = 'PAYMENT_RECEIVED' THEN ar.id END) AS payments_received,
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
    a_call.name AS call_agent_name,
    a_field.name AS field_agent_name,
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
    a_call.name, a_field.name;

COMMENT ON MATERIALIZED VIEW workflow_service.customer_collection_status IS 'Provides customer collection status summary for reporting';