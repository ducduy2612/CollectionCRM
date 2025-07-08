import { DataSource } from 'typeorm';
import { env } from './env.config';

// Create and export the DataSource instance
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  schema: 'bank_sync_service', // Specify the schema name
  entities: [__dirname + '/../models/**/*.entity{.ts,.js}'],
  synchronize: false, // Temporarily disabled to prevent schema sync issues
  logging: env.isDevelopment(),
  // Connection pool configuration
  extra: {
    // Pool size configuration
    max: parseInt(process.env.DB_POOL_MAX || '50', 10), // Maximum number of connections in pool
    min: parseInt(process.env.DB_POOL_MIN || '10', 10), // Minimum number of connections in pool
    
    // Timeout configuration
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // How long a connection can be idle before being removed
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10), // Maximum time to wait for a connection
    
    // Statement timeout to prevent long-running queries
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '120000', 10), // 2 minutes default
    
    // Application name for monitoring
    application_name: 'bank-sync-service'
  }
});