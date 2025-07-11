import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '3004',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SERVICE_NAME: process.env.SERVICE_NAME || 'campaign-engine',
  
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_DATABASE: process.env.DB_DATABASE || 'collectioncrm',
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_SCHEMA: process.env.DB_SCHEMA || 'campaign_engine',
  
  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  
  // Kafka Configuration
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'campaign-engine',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'campaign-engine-group',

  
  // External Services
  BANK_SYNC_SERVICE_URL: process.env.BANK_SYNC_SERVICE_URL || 'http://bank-sync-service:3002',
  BANK_SYNC_API_PREFIX: process.env.BANK_SYNC_API_PREFIX || '/api/v1/bank-sync',
  
  // Cache Configuration
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  CACHE_CHECK_PERIOD: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),
  
  // Monitoring
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '9091', 10),
  
  // Helper methods
  isDevelopment: () => (process.env.NODE_ENV || 'development') === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
};