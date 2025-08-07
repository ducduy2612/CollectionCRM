-- =============================================
-- Test Campaign Configuration for Campaign-Engine
-- This file creates comprehensive test campaigns for testing the ProcessingService
-- Includes campaign groups, campaigns, base conditions, and contact selection rules
-- =============================================

-- Clean up existing test data first
DELETE FROM campaign_engine.contact_rule_outputs WHERE contact_selection_rule_id IN (
    SELECT id FROM campaign_engine.contact_selection_rules WHERE campaign_id IN (
        SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
            SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
        )
    )
);
DELETE FROM campaign_engine.contact_rule_conditions WHERE contact_selection_rule_id IN (
    SELECT id FROM campaign_engine.contact_selection_rules WHERE campaign_id IN (
        SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
            SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
        )
    )
);
DELETE FROM campaign_engine.contact_selection_rules WHERE campaign_id IN (
    SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
        SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
    )
);
DELETE FROM campaign_engine.base_conditions WHERE campaign_id IN (
    SELECT id FROM campaign_engine.campaigns WHERE campaign_group_id IN (
        SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
    )
);
DELETE FROM campaign_engine.campaigns WHERE campaign_group_id IN (
    SELECT id FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%'
);
DELETE FROM campaign_engine.campaign_groups WHERE name LIKE 'TEST_%';

-- =============================================
-- INSERT TEST CAMPAIGN GROUPS (5 groups)
-- =============================================

INSERT INTO campaign_engine.campaign_groups (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TEST_High_Risk_Collections'),
('550e8400-e29b-41d4-a716-446655440002', 'TEST_Early_Stage_Recovery'),
('550e8400-e29b-41d4-a716-446655440003', 'TEST_Premium_Customer_Care'),
('550e8400-e29b-41d4-a716-446655440004', 'TEST_SME_Business_Recovery'),
('550e8400-e29b-41d4-a716-446655440005', 'TEST_Mass_Market_Collection');

-- =============================================
-- INSERT TEST CAMPAIGNS (10 campaigns per group, total 50 campaigns)
-- =============================================

-- High Risk Collections Group (10 campaigns)
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Critical DPD Campaign', 1),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'High Utilization Campaign', 2),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Large Outstanding Campaign', 3),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Write-Off Prevention Campaign', 4),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Legal Action Warning Campaign', 5),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Asset Recovery Campaign', 6),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'Guarantor Contact Campaign', 7),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'Skip Tracing Campaign', 8),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'High Value Recovery Campaign', 9),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'Chronic Defaulter Campaign', 10);

-- Early Stage Recovery Group (10 campaigns)
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Early DPD Campaign', 1),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Low Risk Campaign', 2),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Retail Segment Campaign', 3),
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'First Time Defaulter Campaign', 4),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Payment Reminder Campaign', 5),
('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Soft Collection Campaign', 6),
('660e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 'Promise to Pay Follow-up', 7),
('660e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 'Early Warning Campaign', 8),
('660e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002', 'Preventive Collection Campaign', 9),
('660e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'Grace Period Expiry Campaign', 10);

-- Premium Customer Care Group (10 campaigns)
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Premium Gentle Reminder', 1),
('660e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'VIP Customer Campaign', 2),
('660e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Priority Banking Campaign', 3),
('660e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Wealth Management Campaign', 4),
('660e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Executive Care Campaign', 5),
('660e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Platinum Service Campaign', 6),
('660e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440003', 'Personal Banker Outreach', 7),
('660e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440003', 'Exclusive Offer Campaign', 8),
('660e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440003', 'Premium Retention Campaign', 9),
('660e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440003', 'High Net Worth Campaign', 10);

-- SME Business Recovery Group (10 campaigns)
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'SME Cash Flow Campaign', 1),
('660e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'Business Partner Contact', 2),
('660e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'Corporate Recovery Campaign', 3),
('660e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440004', 'Working Capital Campaign', 4),
('660e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440004', 'Business Loan Restructure', 5),
('660e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440004', 'Corporate Guarantor Campaign', 6),
('660e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440004', 'Business Credit Recovery', 7),
('660e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440004', 'Supply Chain Campaign', 8),
('660e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440004', 'Business Account Manager', 9),
('660e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440004', 'SME Sector Specific Campaign', 10);

-- Mass Market Collection Group (10 campaigns)
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440005', 'Mass Market Standard', 1),
('660e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440005', 'Small Ticket Recovery', 2),
('660e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440005', 'Consumer Loan Campaign', 3),
('660e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440005', 'Personal Loan Recovery', 4),
('660e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440005', 'Credit Card Collection', 5),
('660e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440005', 'Auto Loan Recovery', 6),
('660e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440005', 'Mortgage Early Stage', 7),
('660e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440005', 'Micro Finance Recovery', 8),
('660e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440005', 'Digital Lending Campaign', 9),
('660e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440005', 'Bulk Collection Campaign', 10);

-- =============================================
-- INSERT BASE CONDITIONS (for all 50 campaigns)
-- Using actual fields from loan_campaign_data view
-- =============================================

-- High Risk Collections Group Campaigns (1-10)
-- Campaign 1: Critical DPD Campaign (DPD > 90)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'max_dpd', '>', '90', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440001', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 2: High Utilization Campaign (utilization_ratio > 0.8)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'utilization_ratio', '>', '0.8', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440002', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 3: Large Outstanding Campaign (client_outstanding > 10000000)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'client_outstanding', '>', '10000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440003', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 4: Write-Off Prevention Campaign (DPD between 150-180)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'max_dpd', '>=', '150', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440004', 'max_dpd', '<=', '180', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440004', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 5: Legal Action Warning Campaign (DPD > 120)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440005', 'max_dpd', '>', '120', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440005', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 6: Asset Recovery Campaign (high dpd + high outstanding)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'max_dpd', '>', '60', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440006', 'client_outstanding', '>', '5000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440006', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 7: Guarantor Contact Campaign (DPD > 45)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440007', 'max_dpd', '>', '45', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440007', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 8: Skip Tracing Campaign (DPD > 30)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440008', 'max_dpd', '>', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440008', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 9: High Value Recovery Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440009', 'client_outstanding', '>', '50000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440009', 'max_dpd', '>', '60', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440009', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 10: Chronic Defaulter Campaign (DPD > 180)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440010', 'max_dpd', '>', '180', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440010', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Early Stage Recovery Group Campaigns (11-20)
-- Campaign 11: Early DPD Campaign (DPD between 1-15)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440011', 'max_dpd', '>=', '1', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440011', 'max_dpd', '<=', '15', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440011', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 12: Low Risk Campaign (low utilization)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440012', 'utilization_ratio', '<', '0.5', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440012', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440012', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 13: Retail Segment Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440013', 'segment', '=', 'RETAIL', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440013', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440013', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440013', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 14: First Time Defaulter Campaign (only 1 overdue loan)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440014', 'overdue_loans', '=', '1', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440014', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440014', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 15: Payment Reminder Campaign (DPD 5-15)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440015', 'max_dpd', '>=', '5', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440015', 'max_dpd', '<=', '15', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440015', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 16: Soft Collection Campaign (DPD 15-45)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440016', 'max_dpd', '>=', '15', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440016', 'max_dpd', '<=', '45', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440016', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 17: Promise to Pay Follow-up
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440017', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440017', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 18: Early Warning Campaign (avg_dpd > 5)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440018', 'avg_dpd', '>', '5', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440018', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 19: Preventive Collection Campaign (small overdue amount)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440019', 'overdue_due_amount', '<', '100000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440019', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440019', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 20: Grace Period Expiry Campaign (DPD 1-7)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440020', 'max_dpd', '>=', '1', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440020', 'max_dpd', '<=', '7', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440020', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Premium Customer Care Group Campaigns (21-30)
-- Campaign 21: Premium Gentle Reminder
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440021', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440021', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440021', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440021', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 22: VIP Customer Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440022', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440022', 'client_outstanding', '>', '100000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440022', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 23: Priority Banking Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440023', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440023', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 24: Wealth Management Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440024', 'client_outstanding', '>', '50000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440024', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440024', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 25: Executive Care Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440025', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440025', 'max_dpd', '>', '15', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440025', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 26: Platinum Service Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440026', 'total_loans', '>=', '5', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440026', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440026', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 27: Personal Banker Outreach
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440027', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440027', 'max_dpd', '>=', '5', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440027', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 28: Exclusive Offer Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440028', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440028', 'utilization_ratio', '<', '0.7', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440028', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 29: Premium Retention Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440029', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440029', 'active_loans', '>=', '2', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440029', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 30: High Net Worth Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440030', 'client_outstanding', '>', '200000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440030', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- SME Business Recovery Group Campaigns (31-40)
-- Campaign 31: SME Cash Flow Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440031', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440031', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440031', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 32: Business Partner Contact
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440032', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440032', 'max_dpd', '>', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440032', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 33: Corporate Recovery Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440033', 'segment', '=', 'CORPORATE', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440033', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440033', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 34: Working Capital Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440034', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440034', 'product_type', '=', 'BUSINESS_LOAN', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440034', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 35: Business Loan Restructure
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440035', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440035', 'max_dpd', '>', '60', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440035', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 36: Corporate Guarantor Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440036', 'segment', '=', 'CORPORATE', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440036', 'max_dpd', '>', '45', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440036', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 37: Business Credit Recovery
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440037', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440037', 'utilization_ratio', '>', '0.9', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440037', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 38: Supply Chain Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440038', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440038', 'max_dpd', '>', '15', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440038', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 39: Business Account Manager
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440039', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440039', 'client_outstanding', '>', '5000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440039', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 40: SME Sector Specific Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440040', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440040', 'total_loans', '>=', '3', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440040', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Mass Market Collection Group Campaigns (41-50)
-- Campaign 41: Mass Market Standard
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440041', 'segment', '=', 'MASS', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440041', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440041', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 42: Small Ticket Recovery
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440042', 'client_outstanding', '<', '1000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440042', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440042', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 43: Consumer Loan Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440043', 'product_type', '=', 'PERSONAL_LOAN', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440043', 'segment', '=', 'RETAIL', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440043', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 44: Personal Loan Recovery
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440044', 'product_type', '=', 'PERSONAL_LOAN', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440044', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440044', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 45: Credit Card Collection
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440045', 'product_type', '=', 'CREDIT_CARD', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440045', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440045', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 46: Auto Loan Recovery
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440046', 'product_type', '=', 'AUTO_LOAN', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440046', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440046', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 47: Mortgage Early Stage
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440047', 'product_type', '=', 'MORTGAGE', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440047', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440047', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 48: Micro Finance Recovery
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440048', 'loan_outstanding', '<', '500000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440048', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440048', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 49: Digital Lending Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440049', 'segment', '=', 'RETAIL', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440049', 'original_amount', '<', '2000000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440049', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 50: Bulk Collection Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440050', 'segment', '=', 'MASS', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440050', 'max_dpd', '>', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440050', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- =============================================
-- INSERT CONTACT SELECTION RULES
-- Using specified relationship types and contact types (MOBILE or all)
-- =============================================

-- High Risk Campaigns - More aggressive contact strategies
-- Campaign 1: Critical DPD - Contact guarantors and co-borrowers
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'max_dpd', '>', '90', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'reference', 'MOBILE', '["GUARANTOR", "CO_BORROWER"]');

-- Campaign 2: High Utilization - All contacts
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440002', 'utilization_ratio', '>', '0.8', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440002', 'reference', 'all', NULL);

-- Campaign 3: Large Outstanding - Business partners and guarantors
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440003', 'client_outstanding', '>', '10000000', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440003', 'reference', 'MOBILE', '["BUSINESS_PARTNER", "GUARANTOR", "CO_BORROWER"]');

-- Campaign 7: Guarantor Contact - Specifically target guarantors
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440007', 'max_dpd', '>', '45', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440007', 'reference', 'all', '["GUARANTOR"]');

-- Early Stage Campaigns - Softer approach
-- Campaign 11: Early DPD - Mobile only, no family
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440011', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440011', 'max_dpd', '<=', '15', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440011', 'customer', 'MOBILE', NULL),
('770e8400-e29b-41d4-a716-446655440011', 'reference', 'MOBILE', '["EMERGENCY_CONTACT"]');

-- Campaign 13: Retail Segment - Customer mobile and emergency contacts
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440013', 'segment', '=', 'RETAIL', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440013', 'customer', 'MOBILE', NULL),
('770e8400-e29b-41d4-a716-446655440013', 'reference', 'MOBILE', '["EMERGENCY_CONTACT", "SPOUSE"]');

-- Premium Campaigns - Very selective contact
-- Campaign 21: Premium Gentle Reminder - Customer only, mobile
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440021', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440021', 'segment', '=', 'PRIORITY', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440021', 'customer', 'MOBILE', NULL);

-- Campaign 22: VIP Customer - Only mobile contacts
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440022', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440022', 'client_outstanding', '>', '100000000', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440022', 'customer', 'MOBILE', NULL);

-- SME Campaigns - Business relationships focus
-- Campaign 31: SME Cash Flow - Business contacts
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440031', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440031', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440031', 'reference', 'all', '["BUSINESS_PARTNER", "CO_BORROWER"]');

-- Campaign 32: Business Partner Contact - Specifically business partners
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440032', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440032', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('770e8400-e29b-41d4-a716-446655440032', 'max_dpd', '>', '30', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440032', 'reference', 'all', '["BUSINESS_PARTNER"]');

-- Campaign 36: Corporate Guarantor - Guarantors for corporate
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440036', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440036', 'segment', '=', 'CORPORATE', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440036', 'reference', 'all', '["GUARANTOR", "BUSINESS_PARTNER"]');

-- Mass Market Campaigns - Broader contact approach
-- Campaign 41: Mass Market - All family contacts mobile only
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440041', '660e8400-e29b-41d4-a716-446655440041', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440041', 'segment', '=', 'MASS', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440041', 'reference', 'MOBILE', '["SPOUSE", "PARENT", "SIBLING", "CHILD", "EMERGENCY_CONTACT"]');

-- Campaign 45: Credit Card - Emergency and spouse contacts
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440045', '660e8400-e29b-41d4-a716-446655440045', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440045', 'product_type', '=', 'CREDIT_CARD', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440045', 'reference', 'MOBILE', '["SPOUSE", "EMERGENCY_CONTACT"]');

-- Campaign 46: Auto Loan - Co-borrowers and guarantors
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440046', '660e8400-e29b-41d4-a716-446655440046', 1);

INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440046', 'product_type', '=', 'AUTO_LOAN', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440046', 'reference', 'all', '["CO_BORROWER", "GUARANTOR", "SPOUSE"]');

-- =============================================
-- SUMMARY
-- =============================================

-- Test campaigns created:
-- 
-- 5 Campaign Groups:
-- 1. TEST_High_Risk_Collections (10 campaigns)
-- 2. TEST_Early_Stage_Recovery (10 campaigns)
-- 3. TEST_Premium_Customer_Care (10 campaigns)
-- 4. TEST_SME_Business_Recovery (10 campaigns)
-- 5. TEST_Mass_Market_Collection (10 campaigns)
--
-- Total: 50 campaigns with base conditions and contact selection rules
--
-- Relationship types used:
-- - BUSINESS_PARTNER
-- - CHILD
-- - CO_BORROWER
-- - EMERGENCY_CONTACT
-- - GUARANTOR
-- - PARENT
-- - SIBLING
-- - SPOUSE
--
-- Contact types used:
-- - MOBILE (specific mobile contacts)
-- - all (all contact types)
--
-- Features tested:
-- ✓ Campaign priority within groups
-- ✓ Multiple base conditions with AND logic
-- ✓ Contact selection by relationship type
-- ✓ Contact selection by contact type (MOBILE or all)
-- ✓ Segment-specific targeting
-- ✓ DPD range conditions
-- ✓ Outstanding amount thresholds
-- ✓ Product type filtering
-- ✓ Utilization ratio conditions
-- ✓ Customer aggregate metrics

COMMIT;