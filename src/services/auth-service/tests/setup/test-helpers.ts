import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { testDb } from './test-db-config';
import { cleanupTestRedisData } from './test-redis-config';

// JWT configuration for tests
const JWT_SECRET = 'test_jwt_secret';
const JWT_EXPIRATION = '1h';

/**
 * Create a test user in the database
 * @param userData - User data
 */
export async function createTestUser(userData: {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active?: boolean;
}) {
  const { password, ...userDataWithoutPassword } = userData;
  const password_hash = await bcrypt.hash(password, 10);
  
  const [userId] = await testDb('auth_service.users').insert({
    ...userDataWithoutPassword,
    password_hash,
    is_active: userData.is_active !== undefined ? userData.is_active : true
  }).returning('id');
  
  return userId;
}

/**
 * Create a test role in the database
 * @param roleData - Role data
 */
export async function createTestRole(roleData: {
  name: string;
  description?: string;
}) {
  const [roleId] = await testDb('auth_service.roles').insert(roleData).returning('id');
  return roleId;
}

/**
 * Create a test permission in the database
 * @param permissionData - Permission data
 */
export async function createTestPermission(permissionData: {
  role_id: string;
  resource: string;
  action: string;
}) {
  const [permissionId] = await testDb('auth_service.permissions').insert(permissionData).returning('id');
  return permissionId;
}

/**
 * Generate a test JWT token
 * @param userId - User ID
 * @param username - Username
 * @param roles - User roles
 * @param sessionId - Session ID
 */
export function generateTestToken(
  userId: string,
  username: string,
  roles: string[] = ['user'],
  sessionId: string = uuidv4()
): string {
  const payload = {
    sub: userId,
    username,
    roles,
    sessionId
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

/**
 * Clean up test data from the database
 */
export async function cleanupTestData() {
  // Delete test data from database
  await testDb('auth_service.permissions').where('resource', 'like', 'test%').delete();
  await testDb('auth_service.users').where('username', 'like', 'test%').delete();
  await testDb('auth_service.roles').where('name', 'like', 'test%').delete();
  
  // Clean up Redis test data
  await cleanupTestRedisData();
}

/**
 * Set up test data in the database
 * @param options - Setup options
 */
export async function setupTestData(options: {
  createUsers?: boolean;
  createRoles?: boolean;
  createPermissions?: boolean;
} = {}) {
  const { createUsers = true, createRoles = true, createPermissions = true } = options;
  
  // Create test roles
  if (createRoles) {
    await testDb('auth_service.roles').insert([
      { name: 'test_admin', description: 'Test Administrator' },
      { name: 'test_manager', description: 'Test Manager' },
      { name: 'test_agent', description: 'Test Agent' }
    ]).onConflict('name').ignore();
  }
  
  // Create test users
  if (createUsers) {
    const adminPassword = await bcrypt.hash('TestAdmin123!', 10);
    const managerPassword = await bcrypt.hash('TestManager123!', 10);
    const agentPassword = await bcrypt.hash('TestAgent123!', 10);
    
    await testDb('auth_service.users').insert([
      {
        username: 'test_admin_user',
        email: 'test_admin@example.com',
        password_hash: adminPassword,
        first_name: 'Test',
        last_name: 'Admin',
        role: 'test_admin',
        is_active: true
      },
      {
        username: 'test_manager_user',
        email: 'test_manager@example.com',
        password_hash: managerPassword,
        first_name: 'Test',
        last_name: 'Manager',
        role: 'test_manager',
        is_active: true
      },
      {
        username: 'test_agent_user',
        email: 'test_agent@example.com',
        password_hash: agentPassword,
        first_name: 'Test',
        last_name: 'Agent',
        role: 'test_agent',
        is_active: true
      }
    ]).onConflict('username').ignore();
  }
  
  // Create test permissions
  if (createPermissions) {
    // Get role IDs
    const roles = await testDb('auth_service.roles')
      .whereIn('name', ['test_admin', 'test_manager', 'test_agent'])
      .select('id', 'name');
    
    const roleMap = new Map(roles.map(role => [role.name, role.id]));
    
    // Admin permissions
    if (roleMap.has('test_admin')) {
      const adminRoleId = roleMap.get('test_admin');
      await testDb('auth_service.permissions').insert([
        { role_id: adminRoleId, resource: 'test_users', action: 'create' },
        { role_id: adminRoleId, resource: 'test_users', action: 'read' },
        { role_id: adminRoleId, resource: 'test_users', action: 'update' },
        { role_id: adminRoleId, resource: 'test_users', action: 'delete' }
      ]).onConflict(['role_id', 'resource', 'action']).ignore();
    }
    
    // Manager permissions
    if (roleMap.has('test_manager')) {
      const managerRoleId = roleMap.get('test_manager');
      await testDb('auth_service.permissions').insert([
        { role_id: managerRoleId, resource: 'test_users', action: 'read' },
        { role_id: managerRoleId, resource: 'test_users', action: 'update' }
      ]).onConflict(['role_id', 'resource', 'action']).ignore();
    }
    
    // Agent permissions
    if (roleMap.has('test_agent')) {
      const agentRoleId = roleMap.get('test_agent');
      await testDb('auth_service.permissions').insert([
        { role_id: agentRoleId, resource: 'test_users', action: 'read:self' }
      ]).onConflict(['role_id', 'resource', 'action']).ignore();
    }
  }
}