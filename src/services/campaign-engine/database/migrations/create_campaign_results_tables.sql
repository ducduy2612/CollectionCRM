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