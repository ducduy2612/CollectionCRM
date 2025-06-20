-- =============================================
-- CollectionCRM Database Initialization
-- 08-seed-admin-agent.sql: Initial admin agent seed data for workflow service
-- =============================================

-- Insert admin agent linked to the admin user
-- This creates an agent record for the admin user in the workflow service
INSERT INTO workflow_service.agents (
    user_id,
    employee_id,
    name,
    email,
    phone,
    type,
    team,
    is_active,
    created_by,
    updated_by
) VALUES (
    'bebdec9e-960d-477c-80b1-16bb05666fd5', -- admin user ID from auth_service.users
    'EMP001',
    'System Administrator',
    'admin@collectioncrm.local',
    '+84000000000',
    'ADMIN',
    'ADMINISTRATION',
    true,
    'system',
    'system'
) ON CONFLICT (employee_id) DO NOTHING;