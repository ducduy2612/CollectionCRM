-- =============================================
-- CollectionCRM Database Initialization
-- 04-payment-staging-data.sql: Sample data for payment_service.payment_staging
-- =============================================

-- Insert sample payment staging data using existing loan accounts and CIFs from bank_sync_service
INSERT INTO payment_service.payment_staging (
    reference_number,
    loan_account_number,
    cif,
    amount,
    payment_date,
    payment_channel,
    metadata,
    processed
) VALUES
    -- Recent unprocessed payments (various channels) - Individual customers
    ('REF-2025-001234', 'LOAN10000001', 'CIF10000001', 450.00, '2025-07-01 09:30:00', 'BANK_TRANSFER', '{"bank":"VCB","transaction_id":"VCB202507010001"}', false),
    ('REF-2025-001235', 'LOAN10000002', 'CIF10000001', 520.00, '2025-07-01 10:15:00', 'MOBILE_BANKING', '{"app":"MB_VCB","device":"iOS"}', false),
    ('REF-2025-001236', 'LOAN10000003', 'CIF10000002', 480.00, '2025-07-01 11:00:00', 'ATM', '{"atm_id":"ATM_HCM_001","location":"Ho Chi Minh"}', false),
    ('REF-2025-001237', 'LOAN10000004', 'CIF10000003', 1520.00, '2025-07-01 14:30:00', 'BANK_TRANSFER', '{"bank":"ACB","transaction_id":"ACB202507010002"}', false),
    ('REF-2025-001238', 'LOAN10000005', 'CIF10000003', 700.00, '2025-07-01 15:45:00', 'CASH', '{"collector_id":"COL001","receipt_number":"RC20250701001"}', false),
    
    -- Multiple payments from same customer
    ('REF-2025-001239', 'LOAN10000006', 'CIF10000004', 640.00, '2025-07-01 16:00:00', 'BANK_TRANSFER', '{"bank":"TCB","transaction_id":"TCB202507010001"}', false),
    ('REF-2025-001240', 'LOAN10000017', 'CIF10000004', 675.00, '2025-07-02 09:00:00', 'MOBILE_BANKING', '{"app":"MB_TCB","device":"Android"}', false),
    ('REF-2025-001241', 'LOAN10000006', 'CIF10000004', 320.00, '2025-07-02 14:30:00', 'ATM', '{"atm_id":"ATM_HN_001","location":"Hanoi"}', false),
    
    -- Payments with larger amounts (delinquent accounts)
    ('REF-2025-001242', 'LOAN10000007', 'CIF10000005', 1100.00, '2025-07-02 10:00:00', 'BANK_TRANSFER', '{"bank":"BIDV","transaction_id":"BIDV202507020001"}', false),
    ('REF-2025-001243', 'LOAN10000018', 'CIF10000005', 400.00, '2025-07-02 11:30:00', 'BANK_TRANSFER', '{"bank":"VTB","transaction_id":"VTB202507020001"}', false),
    
    -- Partial payments
    ('REF-2025-001244', 'LOAN10000008', 'CIF10000006', 325.00, '2025-07-02 13:00:00', 'CASH', '{"collector_id":"COL002","receipt_number":"RC20250702001"}', false),
    ('REF-2025-001245', 'LOAN10000019', 'CIF10000006', 180.00, '2025-07-02 13:30:00', 'MOBILE_BANKING', '{"app":"MB_VPB","device":"iOS"}', false),
    
    -- Historical processed payments (for testing)
    ('REF-2025-000001', 'LOAN10000009', 'CIF10000007', 1800.00, '2025-06-30 09:00:00', 'BANK_TRANSFER', '{"bank":"VCB","transaction_id":"VCB202506300001"}', true),
    ('REF-2025-000002', 'LOAN10000010', 'CIF10000007', 580.00, '2025-06-30 10:00:00', 'MOBILE_BANKING', '{"app":"MB_ACB","device":"Android"}', true),
    ('REF-2025-000003', 'LOAN10000011', 'CIF10000008', 600.00, '2025-06-30 11:00:00', 'ATM', '{"atm_id":"ATM_DN_001","location":"Da Nang"}', true),
    
    -- Payments with special characters in metadata
    ('REF-2025-001246', 'LOAN10000012', 'CIF10000009', 1400.00, '2025-07-02 14:00:00', 'BANK_TRANSFER', '{"bank":"SCB","transaction_id":"SCB202507020001","note":"Thanh toán nợ tháng 7"}', false),
    ('REF-2025-001247', 'LOAN10000013', 'CIF10000010', 1680.00, '2025-07-02 15:00:00', 'MOBILE_BANKING', '{"app":"MB_MSB","device":"iOS","customer_note":"Trả góp kỳ 3"}', false),
    
    -- Weekend payments
    ('REF-2025-001248', 'LOAN10000014', 'CIF10000010', 800.00, '2025-06-29 10:00:00', 'ATM', '{"atm_id":"ATM_HCM_002","location":"Ho Chi Minh","weekend":true}', false),
    ('REF-2025-001249', 'LOAN10000015', 'CIF10000001', 150.00, '2025-06-29 14:00:00', 'MOBILE_BANKING', '{"app":"MB_TPB","device":"Android","weekend":true}', false),
    
    -- Payments from different regions
    ('REF-2025-001250', 'LOAN10000016', 'CIF10000002', 440.00, '2025-07-02 16:00:00', 'BANK_TRANSFER', '{"bank":"ABB","transaction_id":"ABB202507020001","region":"North"}', false),
    ('REF-2025-001251', 'LOAN20000001', 'CIF20000001', 5000.00, '2025-07-02 16:30:00', 'BANK_TRANSFER', '{"bank":"PGB","transaction_id":"PGB202507020001","region":"Central"}', false),
    ('REF-2025-001252', 'LOAN20000002', 'CIF20000002', 3500.00, '2025-07-02 17:00:00', 'BANK_TRANSFER', '{"bank":"NCB","transaction_id":"NCB202507020001","region":"South"}', false),
    
    -- Bulk payments from corporate customer
    ('REF-2025-001253', 'LOAN20000003', 'CIF20000003', 25000.00, '2025-07-01 08:00:00', 'BANK_TRANSFER', '{"bank":"VCB","transaction_id":"VCB202507010100","type":"corporate","batch_id":"BATCH001"}', false),
    ('REF-2025-001254', 'LOAN20000004', 'CIF20000004', 15000.00, '2025-07-01 08:05:00', 'BANK_TRANSFER', '{"bank":"VCB","transaction_id":"VCB202507010101","type":"corporate","batch_id":"BATCH001"}', false),
    
    -- Edge case: very small payments
    ('REF-2025-001255', 'LOAN20000005', 'CIF20000005', 1000.00, '2025-07-02 18:00:00', 'CASH', '{"collector_id":"COL003","receipt_number":"RC20250702002","note":"Minimum payment"}', false),
    ('REF-2025-001256', 'LOAN20000006', 'CIF20000006', 500.00, '2025-07-02 18:30:00', 'CASH', '{"collector_id":"COL003","receipt_number":"RC20250702003","note":"Token payment"}', false);

-- Add some duplicate reference numbers (for testing deduplication)
INSERT INTO payment_service.payment_staging (
    reference_number,
    loan_account_number,
    cif,
    amount,
    payment_date,
    payment_channel,
    metadata,
    processed
) VALUES
    -- Duplicate of REF-2025-001234 (should be caught by deduplication)
    ('REF-2025-001234', 'LOAN10000001', 'CIF10000001', 450.00, '2025-07-01 09:30:00', 'BANK_TRANSFER', '{"bank":"VCB","transaction_id":"VCB202507010001","duplicate":true}', false),
    -- Duplicate of REF-2025-001235 with different amount (data quality issue)
    ('REF-2025-001235', 'LOAN10000002', 'CIF10000001', 530.00, '2025-07-01 10:20:00', 'MOBILE_BANKING', '{"app":"MB_VCB","device":"iOS","duplicate":true}', false);

-- Insert some payments with null channels (for testing)
INSERT INTO payment_service.payment_staging (
    reference_number,
    loan_account_number,
    cif,
    amount,
    payment_date,
    payment_channel,
    metadata,
    processed
) VALUES
    ('REF-2025-001257', 'LOAN20000007', 'CIF20000007', 2500.00, '2025-07-02 19:00:00', NULL, '{"source":"unknown"}', false),
    ('REF-2025-001258', 'LOAN20000008', 'CIF20000008', 3300.00, '2025-07-02 19:30:00', NULL, '{"source":"legacy_system"}', false);

-- Verify the data insertion
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN processed = false THEN 1 END) as unprocessed_records,
    COUNT(CASE WHEN processed = true THEN 1 END) as processed_records,
    COUNT(DISTINCT reference_number) as unique_references,
    COUNT(DISTINCT loan_account_number) as unique_loans,
    COUNT(DISTINCT cif) as unique_customers,
    SUM(amount) as total_amount,
    MIN(payment_date) as earliest_payment,
    MAX(payment_date) as latest_payment
FROM payment_service.payment_staging;

-- Summary by payment channel
SELECT 
    COALESCE(payment_channel, 'UNKNOWN') as channel,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM payment_service.payment_staging
GROUP BY payment_channel
ORDER BY payment_count DESC;