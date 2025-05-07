-- =============================================
-- CollectionCRM Database Initialization
-- 03-payment-service.sql: Payment service schema tables, indexes, partitions, and materialized views
-- =============================================

-- =============================================
-- CREATE TABLES - PAYMENT_SERVICE SCHEMA
-- =============================================

-- Payments table with partitioning
CREATE TABLE payment_service.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    loan_account_number VARCHAR(20) NOT NULL,
    cif VARCHAR(20) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status payment_status NOT NULL,
    status_reason TEXT,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_editable BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP,
    CONSTRAINT fk_payment_loan FOREIGN KEY (loan_account_number) REFERENCES bank_sync_service.loans(account_number),
    CONSTRAINT fk_payment_customer FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif)
) PARTITION BY RANGE (payment_date);

COMMENT ON TABLE payment_service.payments IS 'Stores payments made toward loans';

-- Create partitions for payments (current year and next year)
-- Current year partitions (2025)
CREATE TABLE payment_service.payments_2025_q1 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
    
CREATE TABLE payment_service.payments_2025_q2 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
    
CREATE TABLE payment_service.payments_2025_q3 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
    
CREATE TABLE payment_service.payments_2025_q4 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Next year partitions (2026)
CREATE TABLE payment_service.payments_2026_q1 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
    
CREATE TABLE payment_service.payments_2026_q2 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
    
CREATE TABLE payment_service.payments_2026_q3 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
    
CREATE TABLE payment_service.payments_2026_q4 PARTITION OF payment_service.payments
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

-- Default partition for historical data (before 2025)
CREATE TABLE payment_service.payments_historical PARTITION OF payment_service.payments
    FOR VALUES FROM (MINVALUE) TO ('2025-01-01');

-- Default partition for future data (after 2026)
CREATE TABLE payment_service.payments_future PARTITION OF payment_service.payments
    FOR VALUES FROM ('2027-01-01') TO (MAXVALUE);

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Payment Service Indexes
-- Note: For partitioned tables, indexes should be created on each partition
-- These will be automatically created on all partitions
CREATE INDEX idx_payments_loan_account_number ON payment_service.payments(loan_account_number);
CREATE INDEX idx_payments_cif ON payment_service.payments(cif);
CREATE INDEX idx_payments_payment_date ON payment_service.payments(payment_date);
CREATE INDEX idx_payments_status ON payment_service.payments(status);
CREATE INDEX idx_payments_loan_account_number_payment_date ON payment_service.payments(loan_account_number, payment_date);
CREATE INDEX idx_payments_cif_payment_date ON payment_service.payments(cif, payment_date);

-- =============================================
-- CREATE MATERIALIZED VIEWS
-- =============================================

-- Payment Summary View
CREATE MATERIALIZED VIEW payment_service.payment_summary AS
SELECT 
    loan_account_number,
    cif,
    SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) AS total_paid_amount,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS total_successful_payments,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) AS total_failed_payments,
    MAX(CASE WHEN status = 'COMPLETED' THEN payment_date END) AS last_payment_date,
    EXTRACT(MONTH FROM payment_date) AS month,
    EXTRACT(YEAR FROM payment_date) AS year
FROM 
    payment_service.payments
GROUP BY 
    loan_account_number, cif, EXTRACT(MONTH FROM payment_date), EXTRACT(YEAR FROM payment_date);

COMMENT ON MATERIALIZED VIEW payment_service.payment_summary IS 'Provides payment summary metrics for reporting';

-- Create indexes on materialized view
CREATE INDEX idx_payment_summary_loan_account_number ON payment_service.payment_summary(loan_account_number);
CREATE INDEX idx_payment_summary_cif ON payment_service.payment_summary(cif);
CREATE INDEX idx_payment_summary_year_month ON payment_service.payment_summary(year, month);

-- Payment Method Analysis View
CREATE MATERIALIZED VIEW payment_service.payment_method_analysis AS
SELECT 
    payment_method,
    COUNT(*) AS total_payments,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS successful_payments,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) AS failed_payments,
    EXTRACT(MONTH FROM payment_date) AS month,
    EXTRACT(YEAR FROM payment_date) AS year
FROM 
    payment_service.payments
GROUP BY 
    payment_method, EXTRACT(MONTH FROM payment_date), EXTRACT(YEAR FROM payment_date);

COMMENT ON MATERIALIZED VIEW payment_service.payment_method_analysis IS 'Provides payment method analysis for reporting';

-- Create indexes on materialized view
CREATE INDEX idx_payment_method_analysis_method ON payment_service.payment_method_analysis(payment_method);
CREATE INDEX idx_payment_method_analysis_year_month ON payment_service.payment_method_analysis(year, month);

-- =============================================
-- CREATE FUNCTIONS FOR MATERIALIZED VIEW REFRESH
-- =============================================

-- Function to refresh payment materialized views
CREATE OR REPLACE FUNCTION payment_service.refresh_payment_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY payment_service.payment_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY payment_service.payment_method_analysis;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.refresh_payment_materialized_views() IS 'Refreshes all payment service materialized views';