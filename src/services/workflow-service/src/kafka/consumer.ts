import { Consumer, EachMessagePayload } from 'kafkajs';
import { kafka, defaultConsumerConfig, CONSUMER_GROUPS } from './config';
import { logger } from '../utils/logger';

/**
 * Message handler function type
 */
export type MessageHandler = (payload: EachMessagePayload) => Promise<void>;

/**
 * Kafka consumer wrapper class
 */
export class KafkaConsumer {
  private consumer: Consumer;
  private isConnected: boolean = false;
  private handlers: Map<string, MessageHandler> = new Map();

  /**
   * Create a new Kafka consumer
   * @param groupId - Consumer group ID
   */
  constructor(private groupId: string) {
    this.consumer = kafka.consumer({
      ...defaultConsumerConfig,
      groupId
    });
  }

  /**
   * Connect to Kafka broker
   */
  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.consumer.connect();
        this.isConnected = true;
        logger.info(`Connected to Kafka consumer group ${this.groupId}`);
      }
    } catch (error) {
      logger.error({ message: `Failed to connect to Kafka consumer group ${this.groupId}`, error });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka broker
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.consumer.disconnect();
        this.isConnected = false;
        logger.info(`Disconnected from Kafka consumer group ${this.groupId}`);
      }
    } catch (error) {
      logger.error({ message: `Failed to disconnect from Kafka consumer group ${this.groupId}`, error });
      throw error;
    }
  }

  /**
   * Subscribe to a Kafka topic
   * @param topic - The Kafka topic to subscribe to
   * @param handler - The message handler function
   */
  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Store the handler
      this.handlers.set(topic, handler);

      // Subscribe to the topic
      await this.consumer.subscribe({ topic, fromBeginning: false });
      logger.info(`Subscribed to Kafka topic ${topic} in group ${this.groupId}`);

      // Start consuming if this is the first subscription
      if (this.handlers.size === 1) {
        await this.startConsuming();
      }
    } catch (error) {
      logger.error({ message: `Failed to subscribe to Kafka topic ${topic}`, error });
      throw error;
    }
  }

  /**
   * Start consuming messages
   */
  private async startConsuming(): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;
          const handler = this.handlers.get(topic);

          if (handler) {
            try {
              logger.debug({
                message: `Processing message from topic ${topic}, partition ${partition}`,
                offset: message.offset
              });

              await handler(payload);
            } catch (error) {
              logger.error({
                message: `Error processing message from topic ${topic}, partition ${partition}`,
                offset: message.offset,
                error
              });
              // In a production system, you might want to implement a dead letter queue here
            }
          } else {
            logger.warn({
              message: `No handler registered for topic ${topic}`,
              partition,
              offset: message.offset
            });
          }
        }
      });

      logger.info(`Started consuming messages for group ${this.groupId}`);
    } catch (error) {
      logger.error({ message: `Failed to start consuming messages for group ${this.groupId}`, error });
      throw error;
    }
  }
}

/**
 * Create a consumer for user events
 */
export const userEventsConsumer = new KafkaConsumer(CONSUMER_GROUPS.USER_EVENTS);