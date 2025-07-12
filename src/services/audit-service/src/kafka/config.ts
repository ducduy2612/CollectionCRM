import { Kafka, KafkaConfig, ConsumerConfig } from 'kafkajs';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

/**
 * Kafka topics to subscribe to for audit logging
 */
export const AUDIT_TOPICS = {
  // Auth service events
  USER_CREATED: 'auth-service.user.created',
  USER_UPDATED: 'auth-service.user.updated',
  USER_DEACTIVATED: 'auth-service.user.deactivated',
  USER_LOGIN: 'auth-service.user.login',
  USER_LOGOUT: 'auth-service.user.logout',
  
  // Workflow service events
  ACTION_CONFIG_UPDATED: 'workflow-service.action-config.updated',
  CUSTOMER_ASSIGNED: 'workflow-service.assignment.created',
  
  // Campaign engine events
  CAMPAIGN_CREATED: 'campaign-engine.campaign.created',
  CAMPAIGN_UPDATED: 'campaign-engine.campaign.updated',
  CAMPAIGN_DELETED: 'campaign-engine.campaign.deleted',
  CAMPAIGN_PROCESS_RESULT: 'campaign-engine.process.result'
};

/**
 * Kafka consumer groups for audit service
 */
export const CONSUMER_GROUPS = {
  USER_EVENTS: 'audit-service-user-events',
  WORKFLOW_EVENTS: 'audit-service-workflow-events',
  CAMPAIGN_EVENTS: 'audit-service-campaign-events',
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
      const logMethod = level === 1 ? 'error' : level === 2 ? 'warn' : 'info';
      const { message, ...logRest } = log;
      logger[logMethod]({
        message: `[${label}] ${message}`,
        namespace,
        ...logRest
      });
    };
  }
};

/**
 * Create Kafka client instance
 */
export const kafka = new Kafka(kafkaConfig);

/**
 * Default consumer configuration for user events
 */
export const userEventsConsumerConfig: ConsumerConfig = {
  groupId: CONSUMER_GROUPS.USER_EVENTS,
  allowAutoTopicCreation: false,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576, // 1MB
  maxBytes: 5242880, // 5MB
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
};

/**
 * Default consumer configuration for workflow events
 */
export const workflowEventsConsumerConfig: ConsumerConfig = {
  groupId: CONSUMER_GROUPS.WORKFLOW_EVENTS,
  allowAutoTopicCreation: false,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576, // 1MB
  maxBytes: 5242880, // 5MB
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
};

/**
 * Default consumer configuration for campaign events
 */
export const campaignEventsConsumerConfig: ConsumerConfig = {
  groupId: CONSUMER_GROUPS.CAMPAIGN_EVENTS,
  allowAutoTopicCreation: false,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576, // 1MB
  maxBytes: 5242880, // 5MB
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
};