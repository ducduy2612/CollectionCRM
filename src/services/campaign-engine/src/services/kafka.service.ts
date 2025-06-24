import { Kafka, Producer, Consumer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { kafkaConfig, KAFKA_TOPICS, CONSUMER_GROUP_IDS } from '../config/kafka.config';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

export interface CampaignProcessRequest {
  requestId: string;
  customerIds: string[];
  campaignGroupIds?: string[];
  requestedBy: string;
  timestamp: string;
}

export interface CampaignProcessResult {
  requestId: string;
  processedCount: number;
  results: CustomerCampaignResult[];
  errors: ProcessingError[];
  timestamp: string;
  processingDuration: number;
}

export interface CustomerCampaignResult {
  customerId: string;
  accountNumber: string;
  assignedCampaign?: {
    campaignId: string;
    campaignName: string;
    campaignGroupId: string;
    campaignGroupName: string;
  };
  selectedContacts: ContactInfo[];
}

export interface ContactInfo {
  type: string;
  value: string;
  relatedPartyType: string;
}

export interface ProcessingError {
  customerId?: string;
  error: string;
  code: string;
}

export class KafkaService {
  private static instance: KafkaService;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer | null = null;
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
      if (this.consumer) {
        await this.consumer.disconnect();
      }
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
          key: result.requestId,
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

      logger.info(`Published campaign process result for request ${result.requestId}`);
    } catch (error) {
      logger.error('Failed to publish campaign process result:', error);
      throw error;
    }
  }

  public async publishProcessingError(requestId: string, error: ProcessingError): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.CAMPAIGN_PROCESS_DLQ,
        messages: [{
          key: requestId,
          value: JSON.stringify({
            id: uuidv4(),
            type: 'campaign.process.error',
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
              requestId,
              error,
            },
          }),
          headers: {
            'content-type': 'application/json',
            'service': env.SERVICE_NAME,
          },
        }],
      });

      logger.warn(`Published processing error to DLQ for request ${requestId}`);
    } catch (kafkaError) {
      logger.error('Failed to publish processing error to DLQ:', kafkaError);
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

  public async startProcessingConsumer(
    messageHandler: (message: CampaignProcessRequest) => Promise<void>
  ): Promise<void> {
    if (this.consumer) {
      throw new Error('Consumer already started');
    }

    this.consumer = this.kafka.consumer({
      groupId: CONSUMER_GROUP_IDS.CAMPAIGN_PROCESSOR,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: KAFKA_TOPICS.CAMPAIGN_PROCESS_REQUEST,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          if (!message.value) {
            logger.warn('Received empty message');
            return;
          }

          const messageData = JSON.parse(message.value.toString());
          const request: CampaignProcessRequest = messageData.data;

          logger.info(`Processing campaign request ${request.requestId} for ${request.customerIds.length} customers`);
          
          await messageHandler(request);
          
        } catch (error) {
          logger.error('Error processing campaign request message:', error);
          
          // Send to DLQ if possible
          if (message.key) {
            await this.publishProcessingError(message.key.toString(), {
              error: error instanceof Error ? error.message : 'Unknown processing error',
              code: 'MESSAGE_PROCESSING_ERROR',
            });
          }
        }
      },
    });

    logger.info('Campaign processing consumer started');
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }
}