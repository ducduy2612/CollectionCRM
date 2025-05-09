import knex from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Test database configuration - using existing database server
export const testDbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'collectioncrm',
    user: process.env.DB_USER || 'auth_user',
    password: process.env.DB_PASSWORD || 'auth_password',
    schema: 'auth_service'
  },
  pool: { min: 0, max: 7 },
  searchPath: ['auth_service', 'public']
};

// Create a knex instance for the test database
export const testDb = knex(testDbConfig);

// Test data for seeding
export const testRoles = [
  { name: 'admin', description: 'Administrator with full access' },
  { name: 'manager', description: 'Manager with limited administrative access' },
  { name: 'agent', description: 'Collection agent with basic access' }
];

export const testUsers = [
  {
    username: 'test_admin',
    email: 'test_admin@example.com',
    password: 'Admin123!',
    first_name: 'Test',
    last_name: 'Admin',
    role: 'admin'
  },
  {
    username: 'test_manager',
    email: 'test_manager@example.com',
    password: 'Manager123!',
    first_name: 'Test',
    last_name: 'Manager',
    role: 'manager'
  },
  {
    username: 'test_agent',
    email: 'test_agent@example.com',
    password: 'Agent123!',
    first_name: 'Test',
    last_name: 'Agent',
    role: 'agent'
  }
];

export const testPermissions = {
  admin: [
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' }
  ],
  manager: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'roles', action: 'read' }
  ],
  agent: [
    { resource: 'users', action: 'read:self' }
  ]
};