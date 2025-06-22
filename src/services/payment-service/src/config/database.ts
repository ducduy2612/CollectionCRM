import { Knex } from 'knex';
import path from 'path';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema: string;
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    idleTimeoutMillis: number;
  };
  ssl?: boolean | object;
  debug?: boolean;
}

export function createDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_DATABASE || 'collectioncrm',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin_password',
    schema: process.env.DB_SCHEMA || 'payment_service',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '10', 10),
      max: parseInt(process.env.DB_POOL_MAX || '50', 10),
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    },
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    debug: process.env.DB_DEBUG === 'true',
  };
}

export function createKnexConfig(dbConfig: DatabaseConfig): Knex.Config {
  return {
    client: 'postgresql',
    connection: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
    },
    pool: {
      min: dbConfig.pool.min,
      max: dbConfig.pool.max,
      acquireTimeoutMillis: dbConfig.pool.acquireTimeoutMillis,
      idleTimeoutMillis: dbConfig.pool.idleTimeoutMillis,
    },
    searchPath: [dbConfig.schema, 'public'],
    debug: dbConfig.debug,
    asyncStackTraces: process.env.NODE_ENV === 'development',
    migrations: {
      directory: path.join(__dirname, '../migrations'),
      tableName: 'knex_migrations',
      schemaName: dbConfig.schema,
    },
    seeds: {
      directory: path.join(__dirname, '../seeds'),
    },
  };
}

export async function createDatabaseConnection(dbConfig: DatabaseConfig): Promise<Knex> {
  const knexConfig = createKnexConfig(dbConfig);
  const knex = require('knex')(knexConfig);

  try {
    // Test the connection
    await knex.raw('SELECT 1');
    console.log('Database connection established successfully');
    return knex;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(knex: Knex): Promise<void> {
  try {
    await knex.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}