import { Consumer } from 'kafkajs';
import { logger } from '../utils/logger';
import { 
  kafka, 
  AUDIT_TOPICS, 
  userEventsConsumerConfig,
  workflowEventsConsumerConfig,
  campaignEventsConsumerConfig 
} from './config';
import { userEventHandler } from './handlers/user-event.handler';
import { workflowEventHandler } from './handlers/workflow-event.handler';
import { campaignEventHandler } from './handlers/campaign-event.handler';

/**
 * Main Kafka service for audit logging
 */
export class AuditKafkaService {
  private userEventsConsumer: Consumer;
  private workflowEventsConsumer: Consumer;
  private campaignEventsConsumer: Consumer;
  private isRunning = false;

  constructor() {
    this.userEventsConsumer = kafka.consumer(userEventsConsumerConfig);
    this.workflowEventsConsumer = kafka.consumer(workflowEventsConsumerConfig);
    this.campaignEventsConsumer = kafka.consumer(campaignEventsConsumerConfig);
  }

  /**
   * Initialize the Kafka service
   */
  async initialize(): Promise<void> {
    try {
      await this.setupUserEventsConsumer();
      await this.setupWorkflowEventsConsumer();
      await this.setupCampaignEventsConsumer();
      
      await this.startConsumers();
      this.isRunning = true;
      
      logger.info('Audit Kafka service initialized successfully');
    } catch (error) {
      logger.error({ message: 'Failed to initialize Audit Kafka service', error });
      throw error;
    }
  }

  /**
   * Setup user events consumer
   */
  private async setupUserEventsConsumer(): Promise<void> {
    try {
      // Subscribe to user events topics
      await this.userEventsConsumer.subscribe({
        topics: [
          AUDIT_TOPICS.USER_CREATED,
          AUDIT_TOPICS.USER_UPDATED,
          AUDIT_TOPICS.USER_DEACTIVATED,
          AUDIT_TOPICS.USER_LOGIN,
          AUDIT_TOPICS.USER_LOGOUT
        ],
        fromBeginning: false
      });

      // Set up message handler
      await this.userEventsConsumer.run({
        eachMessage: async (payload) => {
          const { topic, partition, message } = payload;
          
          logger.info({
            message: 'Processing user event message',
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            timestamp: message.timestamp
          });

          try {
            await userEventHandler.processMessage(payload);
          } catch (error) {
            logger.error({
              message: 'Error processing user event message',
              topic,
              partition,
              offset: message.offset,
              error
            });
            // In production, you might want to send to dead letter queue
            throw error;
          }
        },
        eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
          const { topic, partition } = batch;
          
          logger.info({
            message: 'Processing user events batch',
            topic,
            partition,
            messageCount: batch.messages.length,
            firstOffset: batch.firstOffset(),
            lastOffset: batch.lastOffset()
          });

          for (const message of batch.messages) {
            try {
              await userEventHandler.processMessage({
                topic,
                partition,
                message,
                heartbeat,
                pause: () => () => {}
              });
              resolveOffset(message.offset);
              await heartbeat();
            } catch (error) {
              logger.error({
                message: 'Error processing message in batch',
                topic,
                partition,
                offset: message.offset,
                error
              });
              throw error;
            }
          }
        }
      });

      logger.info('User events consumer setup completed');
    } catch (error) {
      logger.error({ message: 'Failed to setup user events consumer', error });
      throw error;
    }
  }

  /**
   * Setup workflow events consumer
   */ 
  private async setupWorkflowEventsConsumer(): Promise<void> {
    try {
      // Subscribe to workflow events topics
      await this.workflowEventsConsumer.subscribe({
        topics: [
          AUDIT_TOPICS.ACTION_CONFIG_UPDATED,
          AUDIT_TOPICS.CUSTOMER_ASSIGNED
        ],
        fromBeginning: false
      });

      // Set up message handler
      await this.workflowEventsConsumer.run({
        eachMessage: async (payload) => {
          const { topic, partition, message } = payload;
          
          logger.info({
            message: 'Processing workflow event message',
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            timestamp: message.timestamp
          });

          try {
            await workflowEventHandler.processMessage(payload);
          } catch (error) {
            logger.error({
              message: 'Error processing workflow event message',
              topic,
              partition,
              offset: message.offset,
              error
            });
            throw error;
          }
        },
        eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
          const { topic, partition } = batch;
          
          logger.info({
            message: 'Processing workflow events batch',
            topic,
            partition,
            messageCount: batch.messages.length,
            firstOffset: batch.firstOffset(),
            lastOffset: batch.lastOffset()
          });

          for (const message of batch.messages) {
            try {
              await workflowEventHandler.processMessage({
                topic,
                partition,
                message,
                heartbeat,
                pause: () => () => {}
              });
              resolveOffset(message.offset);
              await heartbeat();
            } catch (error) {
              logger.error({
                message: 'Error processing message in batch',
                topic,
                partition,
                offset: message.offset,
                error
              });
              throw error;
            }
          }
        }
      });

      logger.info('Workflow events consumer setup completed');
    } catch (error) {
      logger.error({ message: 'Failed to setup workflow events consumer', error });
      throw error;
    }
  }

  /**
   * Setup campaign events consumer
   */
  private async setupCampaignEventsConsumer(): Promise<void> {
    try {
      // Subscribe to campaign events topics
      await this.campaignEventsConsumer.subscribe({
        topics: [
          AUDIT_TOPICS.CAMPAIGN_CREATED,
          AUDIT_TOPICS.CAMPAIGN_UPDATED,
          AUDIT_TOPICS.CAMPAIGN_DELETED,
          AUDIT_TOPICS.CAMPAIGN_PROCESS_RESULT
        ],
        fromBeginning: false
      });

      // Set up message handler
      await this.campaignEventsConsumer.run({
        eachMessage: async (payload) => {
          const { topic, partition, message } = payload;
          
          logger.info({
            message: 'Received campaign event',
            topic,
            partition,
            offset: message.offset,
            timestamp: message.timestamp
          });

          // Process the message
          try {
            await campaignEventHandler.processMessage(payload);
          } catch (error) {
            logger.error({
              message: 'Error processing campaign event',
              topic,
              partition,
              offset: message.offset,
              error
            });
            throw error;
          }
        }
      });

      logger.info('Campaign events consumer setup completed');
    } catch (error) {
      logger.error({ message: 'Failed to setup campaign events consumer', error });
      throw error;
    }
  }

  /**
   * Start all consumers
   */
  private async startConsumers(): Promise<void> {
    try {
      // Note: Consumer.run() automatically starts the consumer
      // The consumers are already running from the setup methods
      logger.info('All Kafka consumers started');
    } catch (error) {
      logger.error({ message: 'Failed to start Kafka consumers', error });
      throw error;
    }
  }

  /**
   * Stop all consumers and disconnect
   */
  async disconnect(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.userEventsConsumer.stop();
      await this.workflowEventsConsumer.stop();
      await this.campaignEventsConsumer.stop();
      
      await this.userEventsConsumer.disconnect();
      await this.workflowEventsConsumer.disconnect();
      await this.campaignEventsConsumer.disconnect();
      
      this.isRunning = false;
      logger.info('Audit Kafka service disconnected');
    } catch (error) {
      logger.error({ message: 'Error disconnecting Audit Kafka service', error });
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus(): { isRunning: boolean, consumers: string[] } {
    return {
      isRunning: this.isRunning,
      consumers: ['user-events', 'workflow-events']
    };
  }
}