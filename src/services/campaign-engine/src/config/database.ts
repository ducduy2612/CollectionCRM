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
    ssl: env.isProduction() ? { rejectUnauthorized: false } : false,
  },
  pool: { 
    min: 2, 
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
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