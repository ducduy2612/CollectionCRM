-- =============================================
-- CollectionCRM Database Initialization
-- 03-payment-service.sql: Payment service schema tables, indexes, partitions, and materialized views
-- =============================================

-- =============================================
-- CREATE PAYMENT SERVICE SCHEMA
-- =============================================

CREATE SCHEMA IF NOT EXISTS payment_service;

-- =============================================
-- CREATE STAGING TABLE (For ETL - Reference Only)
-- =============================================

-- Staging table structure for reference (managed by ETL)
CREATE TABLE payment_service.payment_staging (
  id BIGSERIAL PRIMARY KEY,
  reference_number VARCHAR(255) NOT NULL,
  loan_account_number VARCHAR(20) NOT NULL,
  cif VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_channel VARCHAR(100),
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_staging_processed ON payment_service.payment_staging (processed, created_at);
CREATE INDEX idx_staging_reference ON payment_service.payment_staging (reference_number);

-- =============================================
-- CREATE MAIN PAYMENT TABLE (PARTITIONED)
-- =============================================

-- Create partitioned payment table
CREATE TABLE payment_service.payments (
  id UUID DEFAULT gen_random_uuid(),
  reference_number VARCHAR(255) NOT NULL,
  loan_account_number VARCHAR(20) NOT NULL,
  cif VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  payment_channel VARCHAR(100),
  source VARCHAR(50) NOT NULL, -- 'staging' or 'webhook'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, payment_date)
) PARTITION BY RANGE (payment_date);

COMMENT ON TABLE payment_service.payments IS 'Main payments table with partitioning by payment_date';

-- =============================================
-- DEDUPLICATION CACHE TABLE
-- =============================================

-- High-performance deduplication table
CREATE TABLE payment_service.payment_references (
  reference_number VARCHAR(255) PRIMARY KEY,
  payment_id UUID NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for cleanup operations
CREATE INDEX idx_payment_refs_created ON payment_service.payment_references (created_at);
CREATE INDEX idx_payment_refs_payment_date ON payment_service.payment_references (payment_date);

COMMENT ON TABLE payment_service.payment_references IS 'Deduplication cache for payment references';

-- =============================================
-- PROCESSING STATUS TABLE
-- =============================================

-- Track staging batch processing
CREATE TABLE payment_service.staging_process_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_start_id BIGINT NOT NULL,
  batch_end_id BIGINT NOT NULL,
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_details JSONB
);

CREATE INDEX idx_staging_log_status ON payment_service.staging_process_log (status, started_at);
CREATE INDEX idx_staging_log_batch_range ON payment_service.staging_process_log (batch_start_id, batch_end_id);

COMMENT ON TABLE payment_service.staging_process_log IS 'Tracks batch processing of staging table records';

-- =============================================
-- CREATE PARTITIONS FOR PAYMENTS TABLE
-- =============================================

-- Create monthly partitions for current year (2025)
CREATE TABLE payment_service.payments_2025_06 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE payment_service.payments_2025_07 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE payment_service.payments_2025_08 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE payment_service.payments_2025_09 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE payment_service.payments_2025_10 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE payment_service.payments_2025_11 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE payment_service.payments_2025_12 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create partitions for next year (2026)
CREATE TABLE payment_service.payments_2026_01 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE payment_service.payments_2026_02 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE payment_service.payments_2026_03 PARTITION OF payment_service.payments
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Default partition for historical data (before 2025)
CREATE TABLE payment_service.payments_historical PARTITION OF payment_service.payments
  FOR VALUES FROM (MINVALUE) TO ('2025-01-01');

-- Default partition for future data (after 2026)
CREATE TABLE payment_service.payments_future PARTITION OF payment_service.payments
  FOR VALUES FROM ('2026-04-01') TO (MAXVALUE);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Payment table indexes (will be automatically created on all partitions)
CREATE INDEX idx_payments_reference ON payment_service.payments (reference_number);
CREATE INDEX idx_payments_loan_account ON payment_service.payments (loan_account_number, payment_date DESC);
CREATE INDEX idx_payments_cif ON payment_service.payments (cif, payment_date DESC);
CREATE INDEX idx_payments_created_at ON payment_service.payments (created_at);
CREATE INDEX idx_payments_source ON payment_service.payments (source);
CREATE INDEX idx_payments_channel ON payment_service.payments (payment_channel);

-- =============================================
-- CREATE MATERIALIZED VIEWS FOR REPORTING
-- =============================================

-- Payment summary by loan account
CREATE MATERIALIZED VIEW payment_service.payment_summary_by_loan AS
SELECT 
    loan_account_number,
    cif,
    COUNT(*) AS total_payments,
    SUM(amount) AS total_amount,
    MIN(payment_date) AS first_payment_date,
    MAX(payment_date) AS last_payment_date,
    AVG(amount) AS average_payment_amount,
    DATE_TRUNC('month', payment_date) AS month_year
FROM payment_service.payments
GROUP BY loan_account_number, cif, DATE_TRUNC('month', payment_date);

CREATE UNIQUE INDEX idx_payment_summary_loan_unique ON payment_service.payment_summary_by_loan (loan_account_number, month_year);
CREATE INDEX idx_payment_summary_loan_cif ON payment_service.payment_summary_by_loan (cif);
CREATE INDEX idx_payment_summary_loan_month ON payment_service.payment_summary_by_loan (month_year);

COMMENT ON MATERIALIZED VIEW payment_service.payment_summary_by_loan IS 'Monthly payment summary by loan account';

-- Payment channel analysis
CREATE MATERIALIZED VIEW payment_service.payment_channel_analysis AS
SELECT 
    payment_channel,
    source,
    COUNT(*) AS total_payments,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount,
    DATE_TRUNC('day', payment_date) AS payment_day
FROM payment_service.payments
WHERE payment_channel IS NOT NULL
GROUP BY payment_channel, source, DATE_TRUNC('day', payment_date);

CREATE UNIQUE INDEX idx_payment_channel_unique ON payment_service.payment_channel_analysis (payment_channel, source, payment_day);
CREATE INDEX idx_payment_channel_day ON payment_service.payment_channel_analysis (payment_day);

COMMENT ON MATERIALIZED VIEW payment_service.payment_channel_analysis IS 'Daily payment analysis by channel and source';

-- =============================================
-- MATERIALIZED VIEW REFRESH FUNCTIONS
-- =============================================

-- Function to refresh payment materialized views
CREATE OR REPLACE FUNCTION payment_service.refresh_payment_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY payment_service.payment_summary_by_loan;
    REFRESH MATERIALIZED VIEW CONCURRENTLY payment_service.payment_channel_analysis;
    
    -- Log refresh completion
    RAISE NOTICE 'Payment service materialized views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.refresh_payment_materialized_views() IS 'Refreshes all payment service materialized views';

-- =============================================
-- PARTITION MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create monthly partitions for payments
CREATE OR REPLACE FUNCTION payment_service.create_monthly_partition(
    p_year INTEGER,
    p_month INTEGER
)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Calculate start and end dates for the partition
    start_date := make_date(p_year, p_month, 1);
    end_date := start_date + INTERVAL '1 month';
    
    -- Create partition name
    partition_name := 'payments_' || p_year || '_' || LPAD(p_month::TEXT, 2, '0');
    
    -- Create the partition
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS payment_service.%I PARTITION OF payment_service.payments
        FOR VALUES FROM (%L) TO (%L)
    ', partition_name, start_date, end_date);
    
    RAISE NOTICE 'Created partition payment_service.% for period % to %', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.create_monthly_partition(INTEGER, INTEGER) IS 'Creates a new monthly partition for the payments table';

-- Function to automatically create next month's partition
CREATE OR REPLACE FUNCTION payment_service.create_next_month_partition()
RETURNS void AS $$
DECLARE
    next_month_date DATE;
    next_year INTEGER;
    next_month INTEGER;
BEGIN
    -- Calculate next month
    next_month_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
    next_year := EXTRACT(YEAR FROM next_month_date);
    next_month := EXTRACT(MONTH FROM next_month_date);
    
    -- Create the partition
    PERFORM payment_service.create_monthly_partition(next_year, next_month);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.create_next_month_partition() IS 'Creates next months partition for the payments table';

-- =============================================
-- CLEANUP FUNCTIONS
-- =============================================

-- Function to cleanup old reference cache entries
CREATE OR REPLACE FUNCTION payment_service.cleanup_old_references(
    p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMP;
BEGIN
    cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    DELETE FROM payment_service.payment_references 
    WHERE created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % old reference cache entries older than %', deleted_count, cutoff_date;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.cleanup_old_references(INTEGER) IS 'Cleans up old reference cache entries';

-- Function to cleanup old staging process logs
CREATE OR REPLACE FUNCTION payment_service.cleanup_old_process_logs(
    p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMP;
BEGIN
    cutoff_date := NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    DELETE FROM payment_service.staging_process_log 
    WHERE started_at < cutoff_date AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % old process log entries older than %', deleted_count, cutoff_date;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION payment_service.cleanup_old_process_logs(INTEGER) IS 'Cleans up old staging process log entries';