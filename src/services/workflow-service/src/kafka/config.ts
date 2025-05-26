import { Kafka, KafkaConfig, ProducerConfig, ConsumerConfig } from 'kafkajs';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

/**
 * Kafka topic names
 */
export const KAFKA_TOPICS = {
  // Auth service events
  USER_CREATED: 'auth-service.user.created',
  USER_UPDATED: 'auth-service.user.updated',
  USER_DEACTIVATED: 'auth-service.user.deactivated',
  
  // Workflow service events
  AGENT_CREATED: 'workflow-service.agent.created',
  AGENT_UPDATED: 'workflow-service.agent.updated',
  ACTION_RECORDED: 'workflow-service.action.recorded',
  CUSTOMER_ASSIGNED: 'workflow-service.assignment.created'
};

/**
 * Kafka consumer groups
 */
export const CONSUMER_GROUPS = {
  USER_EVENTS: 'workflow-service-user-events'
};

/**
 * Kafka client configuration
 */
const kafkaConfig: KafkaConfig = {
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS.split(','),
  retry: {
    initialRetryTime: env.KAFKA_RETRY_INITIAL_TIME,
    retries: env.KAFKA_RETRY_ATTEMPTS
  },
  logCreator: () => {
    return ({ namespace, level, label, log }) => {
      const logMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
      logger[logMethod]({
        message: `[${label}] ${log.message}`,
        namespace,
        ...log
      });
    };
  }
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

/**
 * Default consumer configuration
 */
export const defaultConsumerConfig: ConsumerConfig = {
  allowAutoTopicCreation: true,
  sessionTimeout: 30000,
  heartbeatInterval: 3000
};