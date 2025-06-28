import { Producer } from 'kafkajs';
import { kafka, defaultProducerConfig } from './config';
import { logger } from '../utils/logger';

/**
 * Kafka producer wrapper class
 */
export class KafkaProducer {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.producer = kafka.producer(defaultProducerConfig);
  }

  /**
   * Connect to Kafka broker
   */
  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.producer.connect();
        this.isConnected = true;
        logger.info('Connected to Kafka producer');
      }
    } catch (error) {
      logger.error({ message: 'Failed to connect to Kafka producer', error });
      throw error;
    }
  }

  /**
   * Disconnect from Kafka broker
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from Kafka producer');
      }
    } catch (error) {
      logger.error({ message: 'Failed to disconnect from Kafka producer', error });
      throw error;
    }
  }

  /**
   * Send a message to a Kafka topic
   * @param topic - The Kafka topic to send the message to
   * @param message - The message to send
   * @param key - Optional message key for partitioning
   */
  async send<T>(topic: string, message: T, key?: string): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const payload = {
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(message),
            headers: {
              'content-type': 'application/json',
              timestamp: Date.now().toString()
            }
          }
        ]
      };

      await this.producer.send(payload);
      logger.debug({ message: `Message sent to topic ${topic}`, payload });
    } catch (error) {
      logger.error({ message: `Failed to send message to topic ${topic}`, error });
      throw error;
    }
  }

  /**
   * Send messages in batch (without transactions to match campaign-engine pattern)
   * @param messages - Array of messages with topic, message, and optional key
   */
  async sendBatch<T>(messages: Array<{ topic: string; message: T; key?: string }>): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Send all messages individually to avoid transaction issues
      for (const { topic, message, key } of messages) {
        await this.producer.send({
          topic,
          messages: [
            {
              key: key || undefined,
              value: JSON.stringify(message),
              headers: {
                'content-type': 'application/json',
                timestamp: Date.now().toString()
              }
            }
          ]
        });
      }

      logger.debug({ message: 'Batch messages sent successfully', count: messages.length });
    } catch (error) {
      logger.error({ message: 'Failed to send batch messages', error });
      throw error;
    }
  }
}

// Create a singleton instance
export const kafkaProducer = new KafkaProducer();