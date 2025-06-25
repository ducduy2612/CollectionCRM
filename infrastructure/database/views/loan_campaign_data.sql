-- Loan-Level Aggregates Materialized View for Campaign Engine
-- This view provides one row per loan with customer-level aggregates included
-- Eliminates the need for multiple joins during campaign processing

CREATE MATERIALIZED VIEW bank_sync_service.loan_campaign_data AS
WITH customer_aggregates AS (
    SELECT 
        c.id as customer_id,
        c.cif,
        c.segment,
        c.status as customer_status,
        
        -- Customer-level loan counts
        COUNT(l.account_number) as total_loans,
        COUNT(CASE WHEN l.status = 'OPEN' THEN 1 END) as active_loans,
        COUNT(CASE WHEN l.dpd > 0 THEN 1 END) as overdue_loans,
        
        -- Customer-level financial aggregates
        COALESCE(SUM(l.outstanding), 0) as client_outstanding,
        COALESCE(SUM(l.due_amount), 0) as total_due_amount,
        COALESCE(SUM(CASE WHEN l.dpd > 0 THEN l.outstanding ELSE 0 END), 0) as overdue_outstanding,
        COALESCE(SUM(CASE WHEN l.dpd > 0 THEN l.due_amount ELSE 0 END), 0) as overdue_due_amount,
        
        -- Customer-level risk metrics
        MAX(l.dpd) as max_dpd,
        AVG(l.dpd) as avg_dpd,
        COALESCE(SUM(l.outstanding) / NULLIF(SUM(l.original_amount), 0), 0) as utilization_ratio
    
    FROM bank_sync_service.customers c
    LEFT JOIN bank_sync_service.loans l ON c.cif = l.cif
    WHERE c.cif IS NOT NULL
    GROUP BY c.id, c.cif, c.segment, c.status
)
SELECT 
    -- Customer fields
    ca.customer_id,
    ca.cif,
    ca.segment,
    ca.customer_status,
    
    -- Loan-specific fields
    l.account_number,
    l.product_type,
    l.outstanding as loan_outstanding,
    l.due_amount as loan_due_amount,
    l.dpd as loan_dpd,
    l.delinquency_status,
    l.status as loan_status,
    l.original_amount,
    
    -- Customer aggregates (repeated for each loan)
    ca.total_loans,
    ca.active_loans,
    ca.overdue_loans,
    ca.client_outstanding,
    ca.total_due_amount,
    ca.overdue_outstanding,
    ca.overdue_due_amount,
    ca.max_dpd,
    ca.avg_dpd,
    ca.utilization_ratio,
    
    -- Custom fields for this loan
    COALESCE(lcf.fields, '{}'::jsonb) as custom_fields,
    
    -- Timestamps
    l.updated_at as loan_updated_at,
    NOW() as calculated_at

FROM customer_aggregates ca
JOIN bank_sync_service.loans l ON ca.cif = l.cif
LEFT JOIN bank_sync_service.loan_custom_fields lcf ON l.account_number = lcf.account_number;

-- Create indexes for performance
CREATE UNIQUE INDEX idx_loan_campaign_data_account ON bank_sync_service.loan_campaign_data(account_number);
CREATE INDEX idx_loan_campaign_data_cif ON bank_sync_service.loan_campaign_data(cif);
CREATE INDEX idx_loan_campaign_data_customer_id ON bank_sync_service.loan_campaign_data(customer_id);
CREATE INDEX idx_loan_campaign_data_segment ON bank_sync_service.loan_campaign_data(segment);
CREATE INDEX idx_loan_campaign_data_customer_status ON bank_sync_service.loan_campaign_data(customer_status);
CREATE INDEX idx_loan_campaign_data_client_outstanding ON bank_sync_service.loan_campaign_data(client_outstanding);
CREATE INDEX idx_loan_campaign_data_max_dpd ON bank_sync_service.loan_campaign_data(max_dpd);
CREATE INDEX idx_loan_campaign_data_loan_dpd ON bank_sync_service.loan_campaign_data(loan_dpd);
CREATE INDEX idx_loan_campaign_data_loan_status ON bank_sync_service.loan_campaign_data(loan_status);
CREATE INDEX idx_loan_campaign_data_product_type ON bank_sync_service.loan_campaign_data(product_type);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION bank_sync_service.refresh_loan_campaign_data()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY bank_sync_service.loan_campaign_data;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW bank_sync_service.loan_campaign_data IS 'Loan-level view with customer aggregates for campaign evaluation. One row per loan. Refresh regularly via scheduled job.';
COMMENT ON FUNCTION bank_sync_service.refresh_loan_campaign_data() IS 'Refreshes loan campaign data materialized view. Should be called regularly (e.g., every hour or after loan updates).';