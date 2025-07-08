import knex from 'knex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_DATABASE || 'collectioncrm',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '10', 10),
    max: parseInt(process.env.DB_POOL_MAX || '50', 10),
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT || '30000', 10),
    destroyTimeoutMillis: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT || '5000', 10),
    reapIntervalMillis: parseInt(process.env.DB_POOL_REAP_INTERVAL || '1000', 10),
    createRetryIntervalMillis: parseInt(process.env.DB_POOL_CREATE_RETRY_INTERVAL || '100', 10),
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../migrations',
  },
  searchPath: ['auth_service', 'public'],
};

// Create database connection
const db = knex(dbConfig);

export default db;