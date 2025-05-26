import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment configuration
 */
export const env = {
  // Server configuration
  PORT: process.env.PORT || '3003',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_DATABASE: process.env.DB_DATABASE || 'collectioncrm',
  
  // API configuration
  API_PREFIX: process.env.API_PREFIX || '/api/v1/collection',
  
  // Auth configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  
  // Kafka configuration
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || 'kafka:9092',
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'workflow-service',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'workflow-service-group',
  KAFKA_RETRY_ATTEMPTS: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '8'),
  KAFKA_RETRY_INITIAL_TIME: parseInt(process.env.KAFKA_RETRY_INITIAL_TIME || '100'),
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Helper methods
  isDevelopment: () => (process.env.NODE_ENV || 'development') === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
};