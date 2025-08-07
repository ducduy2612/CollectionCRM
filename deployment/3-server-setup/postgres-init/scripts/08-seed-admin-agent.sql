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
)
SELECT 
    u.id as user_id,
    'EMP001' as employee_id,
    CONCAT(u.first_name, ' ', u.last_name) as name,
    u.email,
    '+84000000000' as phone,
    'ADMIN' as type,
    'ADMINISTRATION' as team,
    true as is_active,
    'system' as created_by,
    'system' as updated_by
FROM auth_service.users u
WHERE u.role = 'ADMIN' 
AND u.username = 'admin'
ORDER BY u.created_at ASC
LIMIT 1
ON CONFLICT (employee_id) DO NOTHING;