-- Insert test data into workflow_service.customer_cases
-- One record for each customer in bank_sync_service.customers
INSERT INTO workflow_service.customer_cases 
(cif, customer_status, collateral_status, processing_state_status, lending_violation_status, recovery_ability_status, created_by, updated_by)
SELECT 
  cif,
  (ARRAY['ACTIVE', 'INACTIVE', 'COOPERATIVE', 'UNCOOPERATIVE', 'DISPUTED'])[floor(random() * 5 + 1)]::customer_status,
  (ARRAY['SECURED', 'UNSECURED', 'PARTIAL', 'UNDER_REVIEW'])[floor(random() * 4 + 1)]::collateral_status,
  (ARRAY['IN_PROCESS', 'COMPLETED', 'PENDING', 'ESCALATED', 'ON_HOLD'])[floor(random() * 5 + 1)]::processing_state_status,
  (ARRAY['NONE', 'MINOR', 'MAJOR', 'CRITICAL'])[floor(random() * 4 + 1)]::lending_violation_status,
  (ARRAY['HIGH', 'MEDIUM', 'LOW', 'NONE', 'UNKNOWN'])[floor(random() * 5 + 1)]::recovery_ability_status,
  'system',
  'system'
FROM bank_sync_service.customers;

-- Verify the count matches
SELECT * FROM workflow_service.customer_cases;