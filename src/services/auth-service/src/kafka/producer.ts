import { Producer } from 'kafkajs';
import { kafka, defaultProducerConfig } from './config';
import { v4 as uuidv4 } from 'uuid';

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
        console.log('Connected to Kafka producer');
      }
    } catch (error) {
      console.error('Failed to connect to Kafka producer', error);
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
        console.log('Disconnected from Kafka producer');
      }
    } catch (error) {
      console.error('Failed to disconnect from Kafka producer', error);
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

      const eventId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const eventMessage = {
        ...message,
        id: eventId,
        timestamp,
        version: '1.0'
      };

      const payload = {
        topic,
        messages: [
          {
            key: key || eventId,
            value: JSON.stringify(eventMessage),
            headers: {
              'content-type': 'application/json',
              'event-id': eventId,
              'timestamp': timestamp
            }
          }
        ]
      };

      await this.producer.send(payload);
      console.log(`Message sent to topic ${topic}`);
    } catch (error) {
      console.error(`Failed to send message to topic ${topic}`, error);
      throw error;
    }
  }
}

// Create a singleton instance
export const kafkaProducer = new KafkaProducer();