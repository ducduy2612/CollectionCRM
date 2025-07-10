-- =============================================
-- CollectionCRM Database Initialization
-- 07-seed-admin-user.sql: Initial admin user seed data
-- =============================================

-- Insert ADMIN role
INSERT INTO auth_service.roles (
    name,
    description
) VALUES (
    'ADMIN',
    'Administrator role with full system access'
) ON CONFLICT (name) DO NOTHING;

-- Insert user management permissions for ADMIN role
INSERT INTO auth_service.permissions (
    role_id,
    resource,
    action
) SELECT 
    r.id,
    'user_management',
    'user'
FROM auth_service.roles r 
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO auth_service.permissions (
    role_id,
    resource,
    action
) SELECT 
    r.id,
    'user_management',
    'role'
FROM auth_service.roles r 
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Insert default admin user
-- Username: admin
-- Password: Admin@123!
-- Note: Change this password immediately after first login
INSERT INTO auth_service.users (
    username,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active
) VALUES (
    'admin',
    'admin@collectioncrm.local',
    '$2b$10$DpHLW1oQLJ/oXSEMN2gQqOR0pE.QeKhKCeMnDfI5hsGvXWjd0L6zW', -- bcrypt hash of 'Admin@123!'
    'System',
    'Administrator',
    'ADMIN',
    true
) ON CONFLICT (username) DO NOTHING;