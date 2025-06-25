-- =============================================
-- Test Data for Workflow-Service
-- This file creates test data for testing campaign-engine contact selection
-- Including agents, user-input phones, addresses, emails, and reference customers
-- =============================================

-- Clean up existing test data first
DELETE FROM workflow_service.phones WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.addresses WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.emails WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.reference_customers WHERE ref_cif LIKE 'TESTREF%' OR primary_cif LIKE 'TEST%';
DELETE FROM workflow_service.customer_cases WHERE cif LIKE 'TEST%';
DELETE FROM workflow_service.agents WHERE employee_id LIKE 'TEST%';

-- =============================================
-- INSERT TEST AGENTS
-- =============================================

INSERT INTO workflow_service.agents (
    employee_id, name, email, phone, type, team, is_active, created_by, updated_by
) VALUES
-- Call center agents
('TESTAGENT001', 'Alice Chen', 'alice.chen@collectioncrm.com', '+84971234567', 'CALL_AGENT', 'EARLY_STAGE', true, 'HR_SYSTEM', 'HR_SYSTEM'),
('TESTAGENT002', 'Bob Nguyen', 'bob.nguyen@collectioncrm.com', '+84972345678', 'CALL_AGENT', 'HIGH_RISK', true, 'HR_SYSTEM', 'HR_SYSTEM'),
('TESTAGENT003', 'Carol Tran', 'carol.tran@collectioncrm.com', '+84973456789', 'CALL_AGENT', 'RECOVERY', true, 'HR_SYSTEM', 'HR_SYSTEM'),

-- Field agents
('TESTAGENT004', 'David Le', 'david.le@collectioncrm.com', '+84974567890', 'FIELD_AGENT', 'HIGH_RISK', true, 'HR_SYSTEM', 'HR_SYSTEM'),
('TESTAGENT005', 'Eva Pham', 'eva.pham@collectioncrm.com', '+84975678901', 'FIELD_AGENT', 'RECOVERY', true, 'HR_SYSTEM', 'HR_SYSTEM'),
('TESTAGENT006', 'Frank Do', 'frank.do@collectioncrm.com', '+84976789012', 'FIELD_AGENT', 'LEGAL', true, 'HR_SYSTEM', 'HR_SYSTEM'),

-- Supervisors
('TESTAGENT007', 'Grace Vo', 'grace.vo@collectioncrm.com', '+84977890123', 'SUPERVISOR', 'HIGH_RISK', true, 'HR_SYSTEM', 'HR_SYSTEM'),
('TESTAGENT008', 'Henry Bui', 'henry.bui@collectioncrm.com', '+84978901234', 'SUPERVISOR', 'RECOVERY', true, 'HR_SYSTEM', 'HR_SYSTEM'),

-- Premium customer team
('TESTAGENT009', 'Iris Hoang', 'iris.hoang@collectioncrm.com', '+84979012345', 'CALL_AGENT', 'PREMIUM', true, 'HR_SYSTEM', 'HR_SYSTEM'),
('TESTAGENT010', 'Jack Lam', 'jack.lam@collectioncrm.com', '+84970123456', 'FIELD_AGENT', 'PREMIUM', true, 'HR_SYSTEM', 'HR_SYSTEM');

-- =============================================
-- INSERT USER-INPUT PHONE NUMBERS
-- =============================================
-- These are additional/updated phone numbers added by agents during collection activities

INSERT INTO workflow_service.phones (
    cif, type, number, is_primary, is_verified, verification_date, created_by, updated_by
) VALUES
-- Additional phones discovered by agents for existing customers
('TEST001', 'work', '+84281111111', false, true, '2024-11-01', 'TESTAGENT001', 'TESTAGENT001'),
('TEST001', 'mobile', '+84901111111', false, false, NULL, 'TESTAGENT001', 'TESTAGENT001'), -- Secondary mobile

('TEST002', 'home', '+84282222222', false, true, '2024-11-05', 'TESTAGENT002', 'TESTAGENT002'),
('TEST002', 'work', '+84282222223', false, false, NULL, 'TESTAGENT002', 'TESTAGENT002'),

('TEST003', 'mobile', '+84903333333', false, true, '2024-11-10', 'TESTAGENT003', 'TESTAGENT003'), -- Updated mobile

-- Premium customers - agents found additional contacts
('TEST004', 'work', '+84284444444', false, true, '2024-11-15', 'TESTAGENT009', 'TESTAGENT009'),
('TEST005', 'mobile', '+84905555555', false, true, '2024-11-20', 'TESTAGENT009', 'TESTAGENT009'), -- Updated mobile

-- SME customers - business contacts found by field agents
('TEST006', 'work', '+84286666666', false, true, '2024-11-12', 'TESTAGENT004', 'TESTAGENT004'),
('TEST007', 'mobile', '+84907777777', false, false, NULL, 'TESTAGENT005', 'TESTAGENT005'), -- Personal mobile of business owner
('TEST008', 'home', '+84288888888', false, true, '2024-11-18', 'TESTAGENT006', 'TESTAGENT006'),

-- Additional contacts for other customers
('TEST009', 'work', '+84289999999', false, true, '2024-11-22', 'TESTAGENT001', 'TESTAGENT001'),
('TEST010', 'home', '+84280000000', false, false, NULL, 'TESTAGENT002', 'TESTAGENT002'),
('TEST012', 'work', '+84281212121', false, true, '2024-11-25', 'TESTAGENT003', 'TESTAGENT003'),
('TEST013', 'mobile', '+84901313131', false, true, '2024-11-28', 'TESTAGENT009', 'TESTAGENT009'), -- Updated for premium customer
('TEST015', 'home', '+84281515151', false, false, NULL, 'TESTAGENT001', 'TESTAGENT001');

-- =============================================
-- INSERT USER-INPUT REFERENCE CUSTOMERS
-- =============================================
-- Additional reference contacts discovered by agents

INSERT INTO workflow_service.reference_customers (
    ref_cif, primary_cif, relationship_type, type, name, date_of_birth, 
    national_id, gender, created_by, updated_by
) VALUES
-- Additional family contacts discovered by agents
('TESTREF_WF001', 'TEST001', 'brother', 'INDIVIDUAL', 'Michael Smith', '1983-08-12', 'WF001234567', 'MALE', 'TESTAGENT001', 'TESTAGENT001'),
('TESTREF_WF002', 'TEST002', 'sister', 'INDIVIDUAL', 'Patricia Johnson', '1988-04-15', 'WF002345678', 'FEMALE', 'TESTAGENT002', 'TESTAGENT002'),
('TESTREF_WF003', 'TEST003', 'friend', 'INDIVIDUAL', 'Steven Brown', '1979-12-20', 'WF003456789', 'MALE', 'TESTAGENT003', 'TESTAGENT003'),

-- Business contacts discovered for SME customers
('TESTREF_WF004', 'TEST006', 'business_partner', 'INDIVIDUAL', 'Nancy Garcia', '1985-06-08', 'WF004567890', 'FEMALE', 'TESTAGENT004', 'TESTAGENT004'),
('TESTREF_WF005', 'TEST007', 'secretary', 'INDIVIDUAL', 'Lisa Manager', '1990-03-22', 'WF005678901', 'FEMALE', 'TESTAGENT005', 'TESTAGENT005'),
('TESTREF_WF006', 'TEST008', 'partner', 'INDIVIDUAL', 'Kevin Trade', '1982-09-15', 'WF006789012', 'MALE', 'TESTAGENT006', 'TESTAGENT006'),

-- Additional guarantors and contacts
('TESTREF_WF007', 'TEST004', 'colleague', 'INDIVIDUAL', 'Amanda Wilson', '1986-11-30', 'WF007890123', 'FEMALE', 'TESTAGENT009', 'TESTAGENT009'),
('TESTREF_WF008', 'TEST005', 'neighbor', 'INDIVIDUAL', 'Richard Davis', '1975-07-18', 'WF008901234', 'MALE', 'TESTAGENT009', 'TESTAGENT009'),
('TESTREF_WF009', 'TEST009', 'cousin', 'INDIVIDUAL', 'Sandra Martinez', '1991-01-25', 'WF009012345', 'FEMALE', 'TESTAGENT001', 'TESTAGENT001'),
('TESTREF_WF010', 'TEST010', 'friend', 'INDIVIDUAL', 'Tony Anderson', '1984-05-12', 'WF010123456', 'MALE', 'TESTAGENT002', 'TESTAGENT002'),

-- Reference contacts for testing relationship filtering
('TESTREF_WF011', 'TEST012', 'father', 'INDIVIDUAL', 'James Wilson Sr', '1955-03-08', 'WF011234567', 'MALE', 'TESTAGENT003', 'TESTAGENT003'),
('TESTREF_WF012', 'TEST013', 'daughter', 'INDIVIDUAL', 'Sofia Rodriguez', '2000-10-14', 'WF012345678', 'FEMALE', 'TESTAGENT009', 'TESTAGENT009'),
('TESTREF_WF013', 'TEST015', 'uncle', 'INDIVIDUAL', 'Paul Lee', '1968-12-03', 'WF013456789', 'MALE', 'TESTAGENT001', 'TESTAGENT001');

-- =============================================
-- INSERT REFERENCE CUSTOMER PHONE NUMBERS (WORKFLOW)
-- =============================================

INSERT INTO workflow_service.phones (
    cif, type, number, is_primary, is_verified, verification_date, created_by, updated_by
) VALUES
-- Phones for workflow-discovered reference customers
('TESTREF_WF001', 'mobile', '+84941234567', true, true, '2024-11-01', 'TESTAGENT001', 'TESTAGENT001'),
('TESTREF_WF002', 'mobile', '+84942345678', true, false, NULL, 'TESTAGENT002', 'TESTAGENT002'),
('TESTREF_WF003', 'home', '+84243456789', true, true, '2024-11-10', 'TESTAGENT003', 'TESTAGENT003'),
('TESTREF_WF004', 'work', '+84244567890', true, true, '2024-11-12', 'TESTAGENT004', 'TESTAGENT004'),
('TESTREF_WF005', 'mobile', '+84945678901', true, true, '2024-11-15', 'TESTAGENT005', 'TESTAGENT005'),
('TESTREF_WF006', 'mobile', '+84946789012', true, false, NULL, 'TESTAGENT006', 'TESTAGENT006'),
('TESTREF_WF007', 'mobile', '+84947890123', true, true, '2024-11-20', 'TESTAGENT009', 'TESTAGENT009'),
('TESTREF_WF008', 'home', '+84248901234', true, true, '2024-11-22', 'TESTAGENT009', 'TESTAGENT009'),
('TESTREF_WF009', 'mobile', '+84949012345', true, false, NULL, 'TESTAGENT001', 'TESTAGENT001'),
('TESTREF_WF010', 'mobile', '+84940123456', true, true, '2024-11-25', 'TESTAGENT002', 'TESTAGENT002'),
('TESTREF_WF011', 'home', '+84241234567', true, false, NULL, 'TESTAGENT003', 'TESTAGENT003'),
('TESTREF_WF012', 'mobile', '+84942345679', true, true, '2024-11-28', 'TESTAGENT009', 'TESTAGENT009'),
('TESTREF_WF013', 'mobile', '+84943456780', true, true, '2024-11-30', 'TESTAGENT001', 'TESTAGENT001');

-- =============================================
-- INSERT TEST ADDRESSES (User Input)
-- =============================================

INSERT INTO workflow_service.addresses (
    cif, type, address_line1, address_line2, city, state, district, country,
    is_primary, is_verified, verification_date, created_by, updated_by
) VALUES
-- Updated addresses discovered by field agents
('TEST001', 'current', '123 New Address St', 'Apt 5B', 'Ho Chi Minh City', 'Ho Chi Minh', 'District 1', 'Vietnam', false, true, '2024-11-01', 'TESTAGENT004', 'TESTAGENT004'),
('TEST002', 'work', '456 Office Building', 'Floor 10', 'Ho Chi Minh City', 'Ho Chi Minh', 'District 3', 'Vietnam', false, true, '2024-11-05', 'TESTAGENT004', 'TESTAGENT004'),
('TEST003', 'temporary', '789 Temp Residence', NULL, 'Hanoi', 'Hanoi', 'Ba Dinh', 'Vietnam', false, false, NULL, 'TESTAGENT005', 'TESTAGENT005'),

-- Business addresses for SME customers
('TEST006', 'business', '321 Factory Road', 'Building A', 'Ho Chi Minh City', 'Ho Chi Minh', 'District 12', 'Vietnam', false, true, '2024-11-12', 'TESTAGENT006', 'TESTAGENT006'),
('TEST007', 'headquarters', '654 Corporate Center', 'Suite 2001', 'Ho Chi Minh City', 'Ho Chi Minh', 'District 1', 'Vietnam', false, true, '2024-11-15', 'TESTAGENT006', 'TESTAGENT006'),
('TEST008', 'warehouse', '987 Industrial Zone', 'Block C', 'Dong Nai', 'Dong Nai', 'Bien Hoa', 'Vietnam', false, true, '2024-11-18', 'TESTAGENT006', 'TESTAGENT006'),

-- Additional addresses
('TEST009', 'home', '147 Residential Area', 'House 25', 'Can Tho', 'Can Tho', 'Ninh Kieu', 'Vietnam', false, true, '2024-11-22', 'TESTAGENT004', 'TESTAGENT004'),
('TEST010', 'office', '258 Business District', 'Tower B', 'Ho Chi Minh City', 'Ho Chi Minh', 'District 7', 'Vietnam', false, false, NULL, 'TESTAGENT005', 'TESTAGENT005'),
('TEST012', 'current', '369 New Location', 'Villa 12', 'Da Nang', 'Da Nang', 'Hai Chau', 'Vietnam', false, true, '2024-11-25', 'TESTAGENT005', 'TESTAGENT005');

-- =============================================
-- INSERT TEST EMAILS (User Input)
-- =============================================

INSERT INTO workflow_service.emails (
    cif, address, is_primary, is_verified, verification_date, created_by, updated_by
) VALUES
-- Personal emails discovered by agents
('TEST001', 'john.smith.personal@gmail.com', false, true, '2024-11-01', 'TESTAGENT001', 'TESTAGENT001'),
('TEST002', 'mary.j.work@company.com', false, true, '2024-11-05', 'TESTAGENT002', 'TESTAGENT002'),
('TEST004', 'sarah.wilson.backup@yahoo.com', false, false, NULL, 'TESTAGENT009', 'TESTAGENT009'),
('TEST005', 'michael.d.business@outlook.com', false, true, '2024-11-20', 'TESTAGENT009', 'TESTAGENT009'),

-- Business emails for SME customers
('TEST006', 'jennifer.garcia@sme-business.com', false, true, '2024-11-12', 'TESTAGENT004', 'TESTAGENT004'),
('TEST007', 'info@techcorp-ltd.com', false, true, '2024-11-15', 'TESTAGENT005', 'TESTAGENT005'),
('TEST008', 'contact@globaltrade-inc.com', false, true, '2024-11-18', 'TESTAGENT006', 'TESTAGENT006'),

-- Additional emails
('TEST009', 'david.martinez.alt@hotmail.com', false, false, NULL, 'TESTAGENT001', 'TESTAGENT001'),
('TEST010', 'lisa.anderson.work@enterprise.com', false, true, '2024-11-25', 'TESTAGENT002', 'TESTAGENT002'),
('TEST012', 'james.wilson.new@email.com', false, true, '2024-11-28', 'TESTAGENT003', 'TESTAGENT003');

-- =============================================
-- SYNC CUSTOMER CASES
-- =============================================
-- This will create customer cases for all test customers

SELECT workflow_service.sync_customer_cases();

-- =============================================
-- SUMMARY
-- =============================================

-- Workflow test data created:
-- - 10 agents (call agents, field agents, supervisors across different teams)
-- - 14 additional phone numbers (user-input contacts with agent attribution)
-- - 13 additional reference customers (discovered by agents)
-- - 13 reference customer phone numbers (workflow source)
-- - 10 addresses (agent-discovered locations)
-- - 10 emails (agent-discovered email contacts)
-- - Customer cases synced from bank-sync customers

-- This data provides:
-- ✓ Mix of bank-sync vs workflow contact sources
-- ✓ Agent attribution for user-input contacts
-- ✓ Additional relationship types for filtering tests
-- ✓ Verified vs unverified contact variations
-- ✓ Different contact types (mobile, home, work)
-- ✓ Business vs personal contact scenarios
-- ✓ Complete agent setup for assignment testing

COMMIT;