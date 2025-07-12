import { KafkaConfig } from 'kafkajs';
import { env } from './env.config';

export const kafkaConfig: KafkaConfig = {
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    factor: 2,
  },
  connectionTimeout: 3000,
  requestTimeout: 30000,
};

export const KAFKA_TOPICS = {
  CAMPAIGN_PROCESS_RESULT: 'campaign-engine.process.result',
  CAMPAIGN_CREATED: 'campaign-engine.campaign.created',
  CAMPAIGN_UPDATED: 'campaign-engine.campaign.updated',
  CAMPAIGN_DELETED: 'campaign-engine.campaign.deleted'
};

export const CONSUMER_GROUP_IDS = {
  CAMPAIGN_PROCESSOR: env.KAFKA_GROUP_ID,
  CAMPAIGN_EVENTS: `${env.KAFKA_GROUP_ID}-events`,
};