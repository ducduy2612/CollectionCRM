import { KAFKA_TOPICS, CONSUMER_GROUPS } from './config';
import { kafkaProducer } from './producer';
import { userEventsConsumer } from './consumer';
import { userEventHandler } from './handlers/user-event.handler';
import { logger } from '../utils/logger';

/**
 * Initialize Kafka consumers and subscribe to topics
 */
export async function initializeKafka(): Promise<void> {
  try {
    // Connect to Kafka producer
    await kafkaProducer.connect();
    
    // Subscribe to user events
    await userEventsConsumer.subscribe(
      KAFKA_TOPICS.USER_CREATED,
      userEventHandler.processMessage.bind(userEventHandler)
    );
    
    await userEventsConsumer.subscribe(
      KAFKA_TOPICS.USER_UPDATED,
      userEventHandler.processMessage.bind(userEventHandler)
    );
    
    await userEventsConsumer.subscribe(
      KAFKA_TOPICS.USER_DEACTIVATED,
      userEventHandler.processMessage.bind(userEventHandler)
    );
  } catch (error) {
    logger.error({ message: 'Failed to initialize Kafka', error });
    throw error;
  }
}

/**
 * Shutdown Kafka connections
 */
export async function shutdownKafka(): Promise<void> {
  try {
    await kafkaProducer.disconnect();
    await userEventsConsumer.disconnect();
  } catch (error) {
    logger.error({ message: 'Error shutting down Kafka connections', error });
    throw error;
  }
}

export {
  KAFKA_TOPICS,
  CONSUMER_GROUPS,
  kafkaProducer,
  userEventsConsumer,
  userEventHandler
};