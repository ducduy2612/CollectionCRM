import { Kafka, KafkaConfig, ProducerConfig } from 'kafkajs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Kafka topic names
 */
export const KAFKA_TOPICS = {
  // Auth service events
  USER_CREATED: 'auth-service.user.created',
  USER_UPDATED: 'auth-service.user.updated',
  USER_DEACTIVATED: 'auth-service.user.deactivated',
  USER_LOGIN: 'auth-service.user.login',
  USER_LOGOUT: 'auth-service.user.logout',
};

/**
 * Kafka client configuration
 */
const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'auth-service',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
  connectionTimeout: 10000, // 10 seconds
  requestTimeout: 30000, // 30 seconds
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_RETRY_INITIAL_TIME || '100', 10),
    retries: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '8', 10),
    maxRetryTime: 30000, // 30 seconds max retry time
    multiplier: 2,
    restartOnFailure: async (e: Error) => {
      console.error('Kafka connection failed, restarting...', e);
      return true;
    }
  },
};

/**
 * Create Kafka client instance
 */
export const kafka = new Kafka(kafkaConfig);

/**
 * Default producer configuration
 */
export const defaultProducerConfig: ProducerConfig = {
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
};