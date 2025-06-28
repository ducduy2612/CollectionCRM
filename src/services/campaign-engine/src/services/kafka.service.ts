import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { kafkaConfig, KAFKA_TOPICS } from '../config/kafka.config';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

export interface CampaignProcessResult {
  request_id: string;
  processed_count: number;
  success_count: number;
  error_count: number;
  started_at: string;
  completed_at: string;
  total_duration_ms: number;
  timestamp: string;
}

export class KafkaService {
  private static instance: KafkaService;
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  private constructor() {
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  public static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService();
    }
    return KafkaService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected');
    } catch (error) {
      logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka disconnected');
    } catch (error) {
      logger.error('Error disconnecting Kafka:', error);
    }
  }

  public async publishCampaignProcessResult(result: CampaignProcessResult): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.CAMPAIGN_PROCESS_RESULT,
        messages: [{
          key: result.request_id,
          value: JSON.stringify({
            id: uuidv4(),
            type: 'campaign.process.result',
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: result,
          }),
          headers: {
            'content-type': 'application/json',
            'service': env.SERVICE_NAME,
          },
        }],
      });

      logger.info(`Published campaign process result for request ${result.request_id}`);
    } catch (error) {
      logger.error('Failed to publish campaign process result:', error);
      throw error;
    }
  }


  public async publishCampaignEvent(eventType: string, campaignData: any): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Kafka producer not connected - skipping event publishing');
      return;
    }

    const topicMap: { [key: string]: string } = {
      'created': KAFKA_TOPICS.CAMPAIGN_CREATED,
      'updated': KAFKA_TOPICS.CAMPAIGN_UPDATED,
      'deleted': KAFKA_TOPICS.CAMPAIGN_DELETED,
    };

    const topic = topicMap[eventType];
    if (!topic) {
      throw new Error(`Unknown campaign event type: ${eventType}`);
    }

    try {
      await this.producer.send({
        topic,
        messages: [{
          key: campaignData.id,
          value: JSON.stringify({
            id: uuidv4(),
            type: `campaign.${eventType}`,
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: campaignData,
          }),
          headers: {
            'content-type': 'application/json',
            'service': env.SERVICE_NAME,
          },
        }],
      });

      logger.info(`Published campaign ${eventType} event for campaign ${campaignData.id}`);
    } catch (error) {
      logger.error(`Failed to publish campaign ${eventType} event:`, error);
      throw error;
    }
  }


  public isHealthy(): boolean {
    return this.isConnected;
  }
}