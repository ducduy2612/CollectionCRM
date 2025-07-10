import knex from 'knex';
import { env } from './env.config';

const dbConfig = {
  client: 'pg',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_DATABASE,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: { 
    min: parseInt(process.env.DB_POOL_MIN || '10', 10), 
    max: parseInt(process.env.DB_POOL_MAX || '50', 10),
    acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
    createTimeoutMillis: parseInt(process.env.DB_POOL_CREATE_TIMEOUT || '30000', 10),
    destroyTimeoutMillis: parseInt(process.env.DB_POOL_DESTROY_TIMEOUT || '5000', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    reapIntervalMillis: parseInt(process.env.DB_POOL_REAP_INTERVAL || '1000', 10),
    createRetryIntervalMillis: parseInt(process.env.DB_POOL_CREATE_RETRY_INTERVAL || '100', 10),
  },
  searchPath: [env.DB_SCHEMA, 'public'],
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
    schemaName: env.DB_SCHEMA
  }
};

const db = knex(dbConfig);

export default db;