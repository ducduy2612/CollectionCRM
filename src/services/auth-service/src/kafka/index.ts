import { KAFKA_TOPICS } from './config';
import { kafkaProducer } from './producer';
import { UserCreatedEvent, UserUpdatedEvent, UserDeactivatedEvent } from './types/events';

/**
 * Initialize Kafka producer with retry logic
 */
export async function initializeKafka(): Promise<void> {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to initialize Kafka (attempt ${attempt}/${maxRetries})`);
      
      // Connect to Kafka producer
      await kafkaProducer.connect();
      console.log('Kafka initialized successfully');
      return;
    } catch (error) {
      console.error(`Failed to initialize Kafka (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        console.error('Max retries reached. Kafka initialization failed.');
        throw error;
      }
      
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Shutdown Kafka connections
 */
export async function shutdownKafka(): Promise<void> {
  try {
    await kafkaProducer.disconnect();
    console.log('Kafka connections closed');
  } catch (error) {
    console.error('Error shutting down Kafka connections', error);
    throw error;
  }
}

/**
 * Publish user created event
 * @param userId - User ID
 * @param username - Username
 * @param email - Email
 * @param role - Role
 */
export async function publishUserCreatedEvent(
  userId: string,
  username: string,
  email: string,
  role: string
): Promise<void> {
  const event: Omit<UserCreatedEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    username,
    email,
    role
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_CREATED, event, userId);
}

/**
 * Publish user updated event
 * @param userId - User ID
 * @param data - Updated user data
 */
export async function publishUserUpdatedEvent(
  userId: string,
  data: {
    username?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  }
): Promise<void> {
  const event: Omit<UserUpdatedEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    ...data
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_UPDATED, event, userId);
}

/**
 * Publish user deactivated event
 * @param userId - User ID
 * @param reason - Reason for deactivation (optional)
 */
export async function publishUserDeactivatedEvent(
  userId: string,
  reason?: string
): Promise<void> {
  const event: Omit<UserDeactivatedEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    reason
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_DEACTIVATED, event, userId);
}

export {
  KAFKA_TOPICS,
  kafkaProducer,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeactivatedEvent
};