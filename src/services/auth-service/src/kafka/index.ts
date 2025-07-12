import { KAFKA_TOPICS } from './config';
import { kafkaProducer } from './producer';
import { UserCreatedEvent, UserUpdatedEvent, UserDeactivatedEvent, UserLoginEvent, UserLogoutEvent } from './types/events';

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
 * @param createdBy - Current user performing the action
 */
export async function publishUserCreatedEvent(
  userId: string,
  username: string,
  email: string,
  role: string,
  createdBy: { userId: string; username: string }
): Promise<void> {
  const event: Omit<UserCreatedEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    username,
    email,
    role,
    createdBy
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_CREATED, event, userId);
}

/**
 * Publish user updated event
 * @param userId - User ID
 * @param data - Updated user data
 * @param updatedBy - Current user performing the action
 */
export async function publishUserUpdatedEvent(
  userId: string,
  data: {
    username?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  },
  updatedBy: { userId: string; username: string }
): Promise<void> {
  const event: Omit<UserUpdatedEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    ...data,
    updatedBy
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_UPDATED, event, userId);
}

/**
 * Publish user deactivated event
 * @param userId - User ID
 * @param reason - Reason for deactivation (optional)
 * @param deactivatedBy - Current user performing the action
 */
export async function publishUserDeactivatedEvent(
  userId: string,
  reason: string | undefined,
  deactivatedBy: { userId: string; username: string }
): Promise<void> {
  const event: Omit<UserDeactivatedEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    reason,
    deactivatedBy
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_DEACTIVATED, event, userId);
}

/**
 * Publish user login event
 * @param userId - User ID
 * @param username - Username
 * @param sessionId - Session ID
 * @param deviceInfo - Device information
 */
export async function publishUserLoginEvent(
  userId: string,
  username: string,
  sessionId: string,
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
  }
): Promise<void> {
  const event: Omit<UserLoginEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    username,
    sessionId,
    deviceInfo
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_LOGIN, event, userId);
}

/**
 * Publish user logout event
 * @param userId - User ID
 * @param username - Username  
 * @param sessionId - Session ID
 * @param reason - Logout reason (optional)
 */
export async function publishUserLogoutEvent(
  userId: string,
  username: string,
  sessionId: string,
  reason?: string
): Promise<void> {
  const event: Omit<UserLogoutEvent, 'id' | 'timestamp' | 'version'> = {
    userId,
    username,
    sessionId,
    reason
  };

  await kafkaProducer.send(KAFKA_TOPICS.USER_LOGOUT, event, userId);
}

export {
  KAFKA_TOPICS,
  kafkaProducer,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeactivatedEvent,
  UserLoginEvent,
  UserLogoutEvent
};