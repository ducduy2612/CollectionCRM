-- =============================================
-- Test Data for Bank-Sync-Service
-- This file creates comprehensive test data for testing the campaign-engine ProcessingService
-- All data complies with ENUM types defined in 00-common.sql
-- =============================================

-- Clean up existing test data first
DELETE FROM bank_sync_service.loan_custom_fields WHERE account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.loan_collaterals WHERE loan_account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.due_segmentations WHERE loan_account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.loans WHERE account_number LIKE 'TEST_%';
DELETE FROM bank_sync_service.phones WHERE cif LIKE 'TEST_%';
DELETE FROM bank_sync_service.addresses WHERE cif LIKE 'TEST_%';
DELETE FROM bank_sync_service.emails WHERE cif LIKE 'TEST_%';
DELETE FROM bank_sync_service.reference_customers WHERE ref_cif LIKE 'TESTREF_%' OR primary_cif LIKE 'TEST_%';
DELETE FROM bank_sync_service.collaterals WHERE cif LIKE 'TEST_%';
DELETE FROM bank_sync_service.customers WHERE cif LIKE 'TEST_%';

-- =============================================
-- INSERT TEST CUSTOMERS
-- =============================================

-- Individual customers with varied segments and statuses
INSERT INTO bank_sync_service.customers (
    cif, type, name, date_of_birth, national_id, gender, 
    segment, status, source_system, created_by, updated_by
) VALUES
-- High-risk retail customers (for testing high DPD campaigns)
('TEST001', 'INDIVIDUAL', 'John Smith', '1985-03-15', 'ID001234567', 'MALE', 'RETAIL', 'ACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST002', 'INDIVIDUAL', 'Mary Johnson', '1990-07-22', 'ID002345678', 'FEMALE', 'RETAIL', 'ACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST003', 'INDIVIDUAL', 'Robert Brown', '1978-11-08', 'ID003456789', 'MALE', 'RETAIL', 'INACTIVE', 'W4', 'SYSTEM', 'SYSTEM'),

-- Premium customers (for testing segment-based campaigns)
('TEST004', 'INDIVIDUAL', 'Sarah Wilson', '1982-05-30', 'ID004567890', 'FEMALE', 'PREMIUM', 'ACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST005', 'INDIVIDUAL', 'Michael Davis', '1975-09-12', 'ID005678901', 'MALE', 'PREMIUM', 'ACTIVE', 'CRM', 'SYSTEM', 'SYSTEM'),

-- SME customers (mix of individual and organization)
('TEST006', 'INDIVIDUAL', 'Jennifer Garcia', '1988-01-25', 'ID006789012', 'FEMALE', 'SME', 'ACTIVE', 'W4', 'SYSTEM', 'SYSTEM'),
('TEST007', 'ORGANIZATION', 'TechCorp Ltd', NULL, NULL, NULL, 'SME', 'ACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST008', 'ORGANIZATION', 'Global Trade Inc', NULL, NULL, NULL, 'SME', 'ACTIVE', 'OTHER', 'SYSTEM', 'SYSTEM'),

-- Additional test customers for various scenarios
('TEST009', 'INDIVIDUAL', 'David Martinez', '1992-04-18', 'ID009012345', 'MALE', 'RETAIL', 'ACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST010', 'INDIVIDUAL', 'Lisa Anderson', '1987-12-03', 'ID010123456', 'FEMALE', 'PREMIUM', 'ACTIVE', 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST011', 'ORGANIZATION', 'Manufacturing Co', NULL, NULL, NULL, 'CORPORATE', 'ACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST012', 'INDIVIDUAL', 'James Wilson', '1980-06-14', 'ID012345678', 'MALE', 'RETAIL', 'ACTIVE', 'W4', 'SYSTEM', 'SYSTEM'),
('TEST013', 'INDIVIDUAL', 'Maria Rodriguez', '1995-08-27', 'ID013456789', 'FEMALE', 'PREMIUM', 'INACTIVE', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST014', 'ORGANIZATION', 'Service Solutions', NULL, NULL, NULL, 'SME', 'ACTIVE', 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST015', 'INDIVIDUAL', 'Thomas Lee', '1983-02-09', 'ID015678901', 'MALE', 'RETAIL', 'ACTIVE', 'OTHER', 'SYSTEM', 'SYSTEM');

-- =============================================
-- INSERT TEST LOANS
-- =============================================

INSERT INTO bank_sync_service.loans (
    account_number, cif, product_type, original_amount, currency, 
    disbursement_date, maturity_date, interest_rate, term, payment_frequency,
    outstanding, remaining_amount, due_amount, next_payment_date, dpd, 
    delinquency_status, status, source_system, created_by, updated_by
) VALUES
-- High DPD loans (for testing DPD-based campaigns)
('TEST_LOAN_001', 'TEST001', 'PERSONAL_LOAN', 50000.00, 'VND', '2023-01-15', '2026-01-15', 12.5000, 36, 'MONTHLY', 35000.00, 30000.00, 1500.00, '2024-12-15', 45, 'PAST_DUE_30', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_002', 'TEST002', 'CREDIT_CARD', 30000.00, 'VND', '2023-06-01', '2025-06-01', 18.0000, 24, 'MONTHLY', 25000.00, 20000.00, 2000.00, '2024-11-01', 60, 'PAST_DUE_60', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_003', 'TEST003', 'PERSONAL_LOAN', 75000.00, 'VND', '2022-09-10', '2025-09-10', 14.0000, 36, 'MONTHLY', 40000.00, 35000.00, 3000.00, '2024-10-10', 90, 'PAST_DUE_90', 'OPEN', 'W4', 'SYSTEM', 'SYSTEM'),

-- High outstanding amount loans (for testing amount-based campaigns)
('TEST_LOAN_004', 'TEST004', 'BUSINESS_LOAN', 500000.00, 'VND', '2023-03-01', '2028-03-01', 10.5000, 60, 'MONTHLY', 450000.00, 400000.00, 8500.00, '2025-01-01', 0, 'CURRENT', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_005', 'TEST005', 'PERSONAL_LOAN', 200000.00, 'VND', '2023-05-15', '2026-05-15', 13.0000, 36, 'MONTHLY', 180000.00, 150000.00, 5500.00, '2024-12-15', 0, 'CURRENT', 'OPEN', 'CRM', 'SYSTEM', 'SYSTEM'),

-- Premium customer loans (for testing segment-based campaigns)
('TEST_LOAN_006', 'TEST004', 'CREDIT_CARD', 100000.00, 'VND', '2023-08-01', '2026-08-01', 15.0000, 36, 'MONTHLY', 85000.00, 80000.00, 2500.00, '2024-12-01', 15, 'PAST_DUE_15', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_007', 'TEST005', 'BUSINESS_LOAN', 300000.00, 'VND', '2023-02-20', '2027-02-20', 11.0000, 48, 'MONTHLY', 280000.00, 250000.00, 6200.00, '2025-01-20', 0, 'CURRENT', 'OPEN', 'CRM', 'SYSTEM', 'SYSTEM'),

-- SME loans
('TEST_LOAN_008', 'TEST006', 'BUSINESS_LOAN', 150000.00, 'VND', '2023-04-10', '2026-04-10', 12.0000, 36, 'MONTHLY', 120000.00, 100000.00, 4000.00, '2024-12-10', 7, 'PAST_DUE_7', 'OPEN', 'W4', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_009', 'TEST007', 'BUSINESS_LOAN', 800000.00, 'VND', '2022-12-01', '2027-12-01', 9.5000, 60, 'MONTHLY', 720000.00, 650000.00, 12000.00, '2025-01-01', 0, 'CURRENT', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_010', 'TEST008', 'BUSINESS_LOAN', 250000.00, 'VND', '2023-07-15', '2026-07-15', 11.5000, 36, 'MONTHLY', 200000.00, 180000.00, 6500.00, '2024-11-15', 30, 'PAST_DUE_30', 'OPEN', 'OTHER', 'SYSTEM', 'SYSTEM'),

-- Additional loans for testing various scenarios
('TEST_LOAN_011', 'TEST009', 'PERSONAL_LOAN', 40000.00, 'VND', '2023-10-01', '2025-10-01', 16.0000, 24, 'MONTHLY', 32000.00, 28000.00, 1800.00, '2024-12-01', 0, 'CURRENT', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_012', 'TEST010', 'CREDIT_CARD', 80000.00, 'VND', '2023-09-15', '2025-09-15', 17.0000, 24, 'MONTHLY', 70000.00, 65000.00, 3200.00, '2024-11-15', 45, 'PAST_DUE_30', 'OPEN', 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_013', 'TEST011', 'BUSINESS_LOAN', 600000.00, 'VND', '2023-01-01', '2028-01-01', 8.5000, 60, 'MONTHLY', 560000.00, 520000.00, 9800.00, '2025-01-01', 0, 'CURRENT', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_014', 'TEST012', 'PERSONAL_LOAN', 60000.00, 'VND', '2023-11-01', '2025-11-01', 14.5000, 24, 'MONTHLY', 48000.00, 42000.00, 2500.00, '2024-12-01', 20, 'PAST_DUE_15', 'OPEN', 'W4', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_015', 'TEST013', 'PERSONAL_LOAN', 90000.00, 'VND', '2023-06-15', '2025-06-15', 13.5000, 24, 'MONTHLY', 75000.00, 68000.00, 3800.00, '2024-10-15', 75, 'PAST_DUE_60', 'OPEN', 'T24', 'SYSTEM', 'SYSTEM'),

-- Closed loans (should not appear in campaigns)
('TEST_LOAN_016', 'TEST014', 'BUSINESS_LOAN', 120000.00, 'VND', '2022-01-01', '2024-01-01', 10.0000, 24, 'MONTHLY', 0.00, 0.00, 0.00, '2024-01-01', 0, 'PAID_OFF', 'CLOSED', 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST_LOAN_017', 'TEST015', 'PERSONAL_LOAN', 35000.00, 'VND', '2022-06-01', '2024-06-01', 15.0000, 24, 'MONTHLY', 0.00, 0.00, 0.00, '2024-06-01', 0, 'PAID_OFF', 'CLOSED', 'OTHER', 'SYSTEM', 'SYSTEM');

-- =============================================
-- INSERT TEST PHONE NUMBERS
-- =============================================

INSERT INTO bank_sync_service.phones (
    cif, type, number, is_primary, is_verified, verification_date,
    source_system, created_by, updated_by
) VALUES
-- Primary customer phones (verified)
('TEST001', 'mobile', '+84901234567', true, true, '2023-01-20', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST001', 'home', '+84281234567', false, false, NULL, 'T24', 'SYSTEM', 'SYSTEM'),
('TEST002', 'mobile', '+84902345678', true, true, '2023-02-15', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST003', 'mobile', '+84903456789', true, false, NULL, 'W4', 'SYSTEM', 'SYSTEM'),
('TEST003', 'work', '+84283456789', false, true, '2023-03-10', 'W4', 'SYSTEM', 'SYSTEM'),

-- Premium customer phones
('TEST004', 'mobile', '+84904567890', true, true, '2023-04-05', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST004', 'home', '+84284567890', false, true, '2023-04-05', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST005', 'mobile', '+84905678901', true, true, '2023-05-01', 'CRM', 'SYSTEM', 'SYSTEM'),

-- SME customer phones
('TEST006', 'mobile', '+84906789012', true, true, '2023-06-15', 'W4', 'SYSTEM', 'SYSTEM'),
('TEST007', 'work', '+84287890123', true, true, '2023-07-01', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST008', 'work', '+84288901234', true, false, NULL, 'OTHER', 'SYSTEM', 'SYSTEM'),

-- Additional customer phones
('TEST009', 'mobile', '+84909012345', true, true, '2023-08-01', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST010', 'mobile', '+84910123456', true, true, '2023-09-01', 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST010', 'home', '+84290123456', false, false, NULL, 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST011', 'work', '+84291234567', true, true, '2023-10-01', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST012', 'mobile', '+84912345678', true, false, NULL, 'W4', 'SYSTEM', 'SYSTEM'),
('TEST013', 'mobile', '+84913456789', true, true, '2023-11-01', 'T24', 'SYSTEM', 'SYSTEM'),
('TEST014', 'work', '+84294567890', true, true, '2023-12-01', 'CRM', 'SYSTEM', 'SYSTEM'),
('TEST015', 'mobile', '+84915678901', true, false, NULL, 'OTHER', 'SYSTEM', 'SYSTEM');

-- =============================================
-- INSERT TEST REFERENCE CUSTOMERS
-- =============================================

INSERT INTO bank_sync_service.reference_customers (
    ref_cif, primary_cif, relationship_type, type, name, date_of_birth, 
    national_id, gender, source_system, created_by, updated_by
) VALUES
-- Spouses and family members
('TESTREF001', 'TEST001', 'spouse', 'INDIVIDUAL', 'Jane Smith', '1987-05-20', 'REF001234567', 'FEMALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF002', 'TEST002', 'parent', 'INDIVIDUAL', 'Robert Johnson Sr', '1960-03-15', 'REF002345678', 'MALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF003', 'TEST003', 'spouse', 'INDIVIDUAL', 'Linda Brown', '1980-07-12', 'REF003456789', 'FEMALE', 'W4', 'SYSTEM', 'SYSTEM'),

-- Business guarantors and partners
('TESTREF004', 'TEST004', 'guarantor', 'INDIVIDUAL', 'Peter Wilson', '1975-11-08', 'REF004567890', 'MALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF005', 'TEST005', 'business_partner', 'INDIVIDUAL', 'Susan Davis', '1978-09-25', 'REF005678901', 'FEMALE', 'CRM', 'SYSTEM', 'SYSTEM'),
('TESTREF006', 'TEST006', 'guarantor', 'INDIVIDUAL', 'Carlos Garcia', '1965-04-30', 'REF006789012', 'MALE', 'W4', 'SYSTEM', 'SYSTEM'),

-- Company contacts
('TESTREF007', 'TEST007', 'director', 'INDIVIDUAL', 'Mark Thompson', '1970-12-15', 'REF007890123', 'MALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF008', 'TEST008', 'cfo', 'INDIVIDUAL', 'Anna Chang', '1985-08-18', 'REF008901234', 'FEMALE', 'OTHER', 'SYSTEM', 'SYSTEM'),

-- Additional references for testing relationship filtering
('TESTREF009', 'TEST009', 'father', 'INDIVIDUAL', 'David Martinez Sr', '1965-02-28', 'REF009012345', 'MALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF010', 'TEST010', 'colleague', 'INDIVIDUAL', 'Sarah Lee', '1990-06-10', 'REF010123456', 'FEMALE', 'CRM', 'SYSTEM', 'SYSTEM'),
('TESTREF011', 'TEST011', 'legal_representative', 'INDIVIDUAL', 'John Attorney', '1975-01-05', 'REF011234567', 'MALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF012', 'TEST012', 'spouse', 'INDIVIDUAL', 'Emily Wilson', '1982-09-22', 'REF012345678', 'FEMALE', 'W4', 'SYSTEM', 'SYSTEM'),
('TESTREF013', 'TEST013', 'mother', 'INDIVIDUAL', 'Carmen Rodriguez', '1970-11-30', 'REF013456789', 'FEMALE', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF014', 'TEST014', 'accountant', 'INDIVIDUAL', 'Michael CPA', '1980-03-12', 'REF014567890', 'MALE', 'CRM', 'SYSTEM', 'SYSTEM'),
('TESTREF015', 'TEST015', 'brother', 'INDIVIDUAL', 'Daniel Lee', '1985-07-16', 'REF015678901', 'MALE', 'OTHER', 'SYSTEM', 'SYSTEM');

-- =============================================
-- INSERT REFERENCE CUSTOMER PHONE NUMBERS
-- =============================================

INSERT INTO bank_sync_service.phones (
    cif, type, number, is_primary, is_verified, verification_date,
    source_system, created_by, updated_by
) VALUES
-- Reference customer phones
('TESTREF001', 'mobile', '+84921234567', true, true, '2023-01-25', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF002', 'home', '+84222345678', true, false, NULL, 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF003', 'mobile', '+84923456789', true, true, '2023-02-10', 'W4', 'SYSTEM', 'SYSTEM'),
('TESTREF004', 'mobile', '+84924567890', true, true, '2023-03-15', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF005', 'work', '+84225678901', true, true, '2023-04-01', 'CRM', 'SYSTEM', 'SYSTEM'),
('TESTREF006', 'mobile', '+84926789012', true, false, NULL, 'W4', 'SYSTEM', 'SYSTEM'),
('TESTREF007', 'work', '+84227890123', true, true, '2023-05-01', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF008', 'mobile', '+84928901234', true, true, '2023-06-01', 'OTHER', 'SYSTEM', 'SYSTEM'),
('TESTREF009', 'mobile', '+84929012345', true, false, NULL, 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF010', 'mobile', '+84930123456', true, true, '2023-07-01', 'CRM', 'SYSTEM', 'SYSTEM'),
('TESTREF011', 'work', '+84231234567', true, true, '2023-08-01', 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF012', 'mobile', '+84932345678', true, true, '2023-09-01', 'W4', 'SYSTEM', 'SYSTEM'),
('TESTREF013', 'home', '+84233456789', true, false, NULL, 'T24', 'SYSTEM', 'SYSTEM'),
('TESTREF014', 'work', '+84234567890', true, true, '2023-10-01', 'CRM', 'SYSTEM', 'SYSTEM'),
('TESTREF015', 'mobile', '+84935678901', true, true, '2023-11-01', 'OTHER', 'SYSTEM', 'SYSTEM');

-- =============================================
-- INSERT TEST CUSTOM FIELDS
-- =============================================

INSERT INTO bank_sync_service.loan_custom_fields (
    account_number, fields, source_system, uploaded_by
) VALUES
-- High-risk score loans
('TEST_LOAN_001', '{"risk_score": 8, "collection_priority": "HIGH", "payment_likelihood": 0.3, "last_contact_date": "2024-11-15", "agent_notes": "Customer difficult to reach"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_002', '{"risk_score": 9, "collection_priority": "HIGH", "payment_likelihood": 0.2, "last_contact_date": "2024-11-10", "agent_notes": "Multiple failed payment attempts"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_003', '{"risk_score": 10, "collection_priority": "CRITICAL", "payment_likelihood": 0.1, "last_contact_date": "2024-10-20", "agent_notes": "Customer unresponsive for 30+ days"}', 'EXTERNAL', 'RISK_SYSTEM'),

-- Medium-risk score loans
('TEST_LOAN_004', '{"risk_score": 5, "collection_priority": "MEDIUM", "payment_likelihood": 0.7, "business_type": "TECH", "revenue": 500000}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_005', '{"risk_score": 4, "collection_priority": "MEDIUM", "payment_likelihood": 0.8, "employment_status": "EMPLOYED", "income": 25000}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_006', '{"risk_score": 6, "collection_priority": "MEDIUM", "payment_likelihood": 0.6, "premium_customer": true}', 'EXTERNAL', 'RISK_SYSTEM'),

-- Low-risk score loans
('TEST_LOAN_007', '{"risk_score": 2, "collection_priority": "LOW", "payment_likelihood": 0.9, "premium_customer": true, "vip_status": "GOLD"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_008', '{"risk_score": 3, "collection_priority": "LOW", "payment_likelihood": 0.85, "business_type": "MANUFACTURING"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_009', '{"risk_score": 1, "collection_priority": "LOW", "payment_likelihood": 0.95, "business_type": "TRADING", "revenue": 1200000}', 'EXTERNAL', 'RISK_SYSTEM'),

-- Additional custom field variations
('TEST_LOAN_010', '{"risk_score": 7, "collection_priority": "HIGH", "payment_likelihood": 0.4, "business_type": "SERVICE"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_011', '{"risk_score": 3, "collection_priority": "LOW", "payment_likelihood": 0.9, "employment_status": "EMPLOYED"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_012', '{"risk_score": 6, "collection_priority": "MEDIUM", "payment_likelihood": 0.65, "premium_customer": true}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_013', '{"risk_score": 2, "collection_priority": "LOW", "payment_likelihood": 0.92, "business_type": "TECH", "revenue": 800000}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_014', '{"risk_score": 5, "collection_priority": "MEDIUM", "payment_likelihood": 0.7, "employment_status": "EMPLOYED"}', 'EXTERNAL', 'RISK_SYSTEM'),
('TEST_LOAN_015', '{"risk_score": 8, "collection_priority": "HIGH", "payment_likelihood": 0.35, "premium_customer": false}', 'EXTERNAL', 'RISK_SYSTEM');

-- =============================================
-- SUMMARY
-- =============================================

-- Test data created:
-- - 15 customers (mix of INDIVIDUAL/ORGANIZATION, various segments)
-- - 17 loans (15 OPEN, 2 CLOSED - various DPD levels and amounts)
-- - 20 primary customer phone numbers (mix of verified/unverified)
-- - 15 reference customers (various relationship types)
-- - 15 reference customer phone numbers
-- - 15 custom field records (risk scores, priorities, payment likelihood)

-- This data will test:
-- ✓ High DPD campaigns (customers with dpd > 30)
-- ✓ High outstanding amount campaigns (client_outstanding > 100000)
-- ✓ Segment-based campaigns (PREMIUM, RETAIL, SME)
-- ✓ Custom field campaigns (risk_score > 7, collection_priority = 'HIGH')
-- ✓ Contact selection with relationship filtering
-- ✓ Verified vs unverified contact prioritization
-- ✓ Bank-sync vs user-input contact source handling

COMMIT;