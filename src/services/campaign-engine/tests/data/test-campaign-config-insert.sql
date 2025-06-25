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
-- INSERT TEST CAMPAIGN GROUPS
-- =============================================

INSERT INTO campaign_engine.campaign_groups (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TEST_High_Risk_Collections'),
('550e8400-e29b-41d4-a716-446655440002', 'TEST_Early_Stage_Recovery'),
('550e8400-e29b-41d4-a716-446655440003', 'TEST_Premium_Customer_Care');

-- =============================================
-- INSERT TEST CAMPAIGNS
-- =============================================

-- High Risk Collections Group
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Critical DPD Campaign', 1),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'High Risk Score Campaign', 2),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Large Outstanding Campaign', 3);

-- Early Stage Recovery Group
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Early DPD Campaign', 1),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Medium Risk Campaign', 2),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Retail Segment Campaign', 3);

-- Premium Customer Care Group
INSERT INTO campaign_engine.campaigns (id, campaign_group_id, name, priority) VALUES
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Premium Gentle Reminder', 1),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'VIP Customer Campaign', 2);

-- =============================================
-- INSERT BASE CONDITIONS
-- =============================================

-- Campaign 1: Critical DPD Campaign (DPD > 60)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'max_dpd', '>', '60', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440001', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 2: High Risk Score Campaign (risk_score >= 8)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'risk_score', '>=', '8', 'custom_fields'),
('660e8400-e29b-41d4-a716-446655440002', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 3: Large Outstanding Campaign (client_outstanding > 100000)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'client_outstanding', '>', '100000', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440003', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 4: Early DPD Campaign (DPD between 15-30)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'max_dpd', '>=', '15', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440004', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440004', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 5: Medium Risk Campaign (risk_score between 5-7)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440005', 'risk_score', '>=', '5', 'custom_fields'),
('660e8400-e29b-41d4-a716-446655440005', 'risk_score', '<=', '7', 'custom_fields'),
('660e8400-e29b-41d4-a716-446655440005', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 6: Retail Segment Campaign
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'segment', '=', 'RETAIL', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440006', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440006', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 7: Premium Gentle Reminder (Premium segment with low DPD)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440007', 'segment', '=', 'PREMIUM', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440007', 'max_dpd', '>', '0', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440007', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440007', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- Campaign 8: VIP Customer Campaign (Premium + custom field)
INSERT INTO campaign_engine.base_conditions (campaign_id, field_name, operator, field_value, data_source) VALUES
('660e8400-e29b-41d4-a716-446655440008', 'segment', '=', 'PREMIUM', 'bank_sync_service.loan_campaign_data'),
('660e8400-e29b-41d4-a716-446655440008', 'premium_customer', '=', 'true', 'custom_fields'),
('660e8400-e29b-41d4-a716-446655440008', 'loan_status', '=', 'OPEN', 'bank_sync_service.loan_campaign_data');

-- =============================================
-- INSERT CONTACT SELECTION RULES
-- =============================================

-- Campaign 1: Critical DPD - Exclude family contacts for aggressive collection
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1);

-- Rule conditions: Apply to high DPD customers
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'max_dpd', '>', '60', 'bank_sync_service.loan_campaign_data');

-- Rule outputs: Exclude family relationship contacts
INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'reference', 'all', '["parent", "father", "mother", "spouse", "brother", "sister", "daughter", "son", "uncle", "cousin"]');

-- Campaign 2: High Risk Score - Only verified contacts
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 1);

-- Rule conditions: Apply to high risk score customers
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440002', 'risk_score', '>=', '8', 'custom_fields');

-- Rule outputs: Prioritize verified contacts only (this is more of a prioritization, but we can exclude unverified by contact source)
INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440002', 'reference', 'all', '["friend", "neighbor", "colleague"]');

-- Campaign 4: Early DPD - Exclude work contacts (gentler approach)
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 1);

-- Rule conditions: Apply to early DPD customers
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440004', 'max_dpd', '>=', '15', 'bank_sync_service.loan_campaign_data'),
('770e8400-e29b-41d4-a716-446655440004', 'max_dpd', '<=', '30', 'bank_sync_service.loan_campaign_data');

-- Rule outputs: Exclude work contact types for gentle approach
INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440004', 'customer', 'work', NULL),
('770e8400-e29b-41d4-a716-446655440004', 'reference', 'work', NULL);

-- Campaign 7: Premium Gentle Reminder - Only customer contacts, no references
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 1);

-- Rule conditions: Apply to premium customers
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440007', 'segment', '=', 'PREMIUM', 'bank_sync_service.loan_campaign_data');

-- Rule outputs: Exclude all reference contacts (only contact customer directly)
INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440007', 'reference', 'all', NULL);

-- Campaign 8: VIP Customer Campaign - Mobile contacts only for privacy
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 1);

-- Rule conditions: Apply to VIP customers
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440008', 'premium_customer', '=', 'true', 'custom_fields');

-- Rule outputs: Exclude home and work contacts (mobile only)
INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440008', 'customer', 'home', NULL),
('770e8400-e29b-41d4-a716-446655440008', 'customer', 'work', NULL),
('770e8400-e29b-41d4-a716-446655440008', 'reference', 'all', NULL);

-- =============================================
-- ADDITIONAL CONTACT SELECTION RULES FOR COMPLEX TESTING
-- =============================================

-- Campaign 3: Large Outstanding - Multiple rules for testing priority
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440003', 1),
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440003', 2);

-- Rule 1: For very large amounts, exclude casual relationships
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440009', 'client_outstanding', '>', '200000', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440009', 'reference', 'all', '["friend", "neighbor", "colleague"]');

-- Rule 2: For moderate large amounts, include business contacts
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440010', 'client_outstanding', '>', '100000', 'bank_sync_service.loan_campaign_data'),
('770e8400-e29b-41d4-a716-446655440010', 'client_outstanding', '<=', '200000', 'bank_sync_service.loan_campaign_data');

INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440010', 'reference', 'all', '["friend", "neighbor"]');

-- Campaign 5: Medium Risk - SME specific rules
INSERT INTO campaign_engine.contact_selection_rules (id, campaign_id, rule_priority) VALUES
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440005', 1);

-- Rule conditions: Apply to SME segment specifically
INSERT INTO campaign_engine.contact_rule_conditions (contact_selection_rule_id, field_name, operator, field_value, data_source) VALUES
('770e8400-e29b-41d4-a716-446655440011', 'segment', '=', 'SME', 'bank_sync_service.loan_campaign_data'),
('770e8400-e29b-41d4-a716-446655440011', 'risk_score', '>=', '5', 'custom_fields');

-- Rule outputs: Include business relationships but exclude personal family
INSERT INTO campaign_engine.contact_rule_outputs (contact_selection_rule_id, related_party_type, contact_type, relationship_patterns) VALUES
('770e8400-e29b-41d4-a716-446655440011', 'reference', 'all', '["spouse", "parent", "father", "mother", "daughter", "son"]');

-- =============================================
-- SUMMARY
-- =============================================

-- Test campaigns created:
-- 
-- HIGH RISK COLLECTIONS GROUP:
-- 1. Critical DPD Campaign (max_dpd > 60) - Excludes family contacts
-- 2. High Risk Score Campaign (risk_score >= 8) - Excludes casual relationships  
-- 3. Large Outstanding Campaign (client_outstanding > 100000) - Multi-tier rules
--
-- EARLY STAGE RECOVERY GROUP:
-- 4. Early DPD Campaign (15 <= max_dpd <= 30) - Excludes work contacts
-- 5. Medium Risk Campaign (5 <= risk_score <= 7) - SME-specific rules
-- 6. Retail Segment Campaign (segment = RETAIL, max_dpd > 0) - No contact rules
--
-- PREMIUM CUSTOMER CARE GROUP:
-- 7. Premium Gentle Reminder (segment = PREMIUM, low DPD) - Customer only
-- 8. VIP Customer Campaign (premium_customer = true) - Mobile only
--
-- Features tested:
-- ✓ Campaign priority within groups
-- ✓ Multiple base conditions with AND logic
-- ✓ Custom field conditions (JSONB queries)
-- ✓ Contact exclusion by relationship type
-- ✓ Contact exclusion by contact type
-- ✓ Multiple contact rules with priority
-- ✓ Segment-specific targeting
-- ✓ DPD range conditions
-- ✓ Outstanding amount thresholds

COMMIT;