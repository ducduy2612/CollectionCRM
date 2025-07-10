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
  schema: 'audit_service', // Specify the audit service schema name
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  synchronize: false, // Use migrations in production
  logging: false,
  // Connection pool configuration
  extra: {
    // Pool size configuration
    max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum number of connections in pool
    min: parseInt(process.env.DB_POOL_MIN || '5', 10), // Minimum number of connections in pool
    
    // Timeout configuration
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10), // How long a connection can be idle before being removed
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10), // Maximum time to wait for a connection
    
    // Application name for monitoring
    application_name: 'audit-service'
  }
});