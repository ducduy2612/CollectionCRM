-- Customer Aggregates Materialized View for Campaign Engine
-- This view provides pre-calculated customer-level metrics for campaign evaluation

CREATE MATERIALIZED VIEW bank_sync_service.customer_aggregates AS
SELECT 
    c.cif,
    c.segment,
    c.status as customer_status,
    
    -- Loan counts
    COUNT(l.account_number) as total_loans,
    COUNT(CASE WHEN l.status = 'OPEN' THEN 1 END) as active_loans,
    COUNT(CASE WHEN l.dpd > 0 THEN 1 END) as overdue_loans,
    
    -- Financial aggregates
    COALESCE(SUM(l.outstanding), 0) as client_outstanding,
    COALESCE(SUM(l.due_amount), 0) as total_due_amount,
    COALESCE(SUM(CASE WHEN l.dpd > 0 THEN l.outstanding ELSE 0 END), 0) as overdue_outstanding,
    COALESCE(SUM(CASE WHEN l.dpd > 0 THEN l.due_amount ELSE 0 END), 0) as overdue_due_amount,
    
    -- Risk metrics
    MAX(l.dpd) as max_dpd,
    AVG(l.dpd) as avg_dpd,
    COALESCE(SUM(l.outstanding) / NULLIF(SUM(l.original_amount), 0), 0) as utilization_ratio,
    
    -- Loan mix
    COUNT(CASE WHEN l.product_type = 'PERSONAL_LOAN' THEN 1 END) as personal_loans,
    COUNT(CASE WHEN l.product_type = 'BUSINESS_LOAN' THEN 1 END) as business_loans,
    COUNT(CASE WHEN l.product_type = 'CREDIT_CARD' THEN 1 END) as credit_cards,
    
    -- Timestamps
    MAX(l.updated_at) as last_loan_update,
    NOW() as calculated_at

FROM bank_sync_service.customers c
LEFT JOIN bank_sync_service.loans l ON c.cif = l.cif
WHERE c.cif IS NOT NULL
GROUP BY c.cif, c.segment, c.status;

-- Create indexes for performance
CREATE UNIQUE INDEX idx_customer_aggregates_cif ON bank_sync_service.customer_aggregates(cif);
CREATE INDEX idx_customer_aggregates_segment ON bank_sync_service.customer_aggregates(segment);
CREATE INDEX idx_customer_aggregates_customer_status ON bank_sync_service.customer_aggregates(customer_status);
CREATE INDEX idx_customer_aggregates_client_outstanding ON bank_sync_service.customer_aggregates(client_outstanding);
CREATE INDEX idx_customer_aggregates_max_dpd ON bank_sync_service.customer_aggregates(max_dpd);
CREATE INDEX idx_customer_aggregates_overdue_loans ON bank_sync_service.customer_aggregates(overdue_loans);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION bank_sync_service.refresh_customer_aggregates()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY bank_sync_service.customer_aggregates;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW bank_sync_service.customer_aggregates IS 'Pre-calculated customer-level metrics for campaign evaluation. Refresh regularly via scheduled job.';
COMMENT ON FUNCTION bank_sync_service.refresh_customer_aggregates() IS 'Refreshes customer aggregates materialized view. Should be called regularly (e.g., every hour or after loan updates).';