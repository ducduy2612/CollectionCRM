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
};

/**
 * Kafka client configuration
 */
const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'auth-service',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
  retry: {
    initialRetryTime: parseInt(process.env.KAFKA_RETRY_INITIAL_TIME || '100', 10),
    retries: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '8', 10)
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