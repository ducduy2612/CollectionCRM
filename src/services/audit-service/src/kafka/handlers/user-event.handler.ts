import { EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { logger } from '../../utils/logger';
import { AUDIT_TOPICS } from '../config';
import { UserCreatedEvent, UserUpdatedEvent, UserDeactivatedEvent } from '../types/events';

/**
 * User event handler for audit logging
 */
export class UserEventHandler {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /**
   * Process a user event message
   * @param payload - Kafka message payload
   */
  async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    
    if (!message.value) {
      logger.warn({ message: 'Received empty message', topic });
      return;
    }

    try {
      const messageValue = JSON.parse(message.value.toString());
      
      switch (topic) {
        case AUDIT_TOPICS.USER_CREATED:
          await this.handleUserCreated(messageValue as UserCreatedEvent);
          break;
        case AUDIT_TOPICS.USER_UPDATED:
          await this.handleUserUpdated(messageValue as UserUpdatedEvent);
          break;
        case AUDIT_TOPICS.USER_DEACTIVATED:
          await this.handleUserDeactivated(messageValue as UserDeactivatedEvent);
          break;
        default:
          logger.warn({ message: `Unhandled topic: ${topic}` });
      }
    } catch (error) {
      logger.error({ message: `Error processing message from topic ${topic}`, error });
      throw error;
    }
  }

  /**
   * Handle user created event
   */
  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    logger.info({ message: 'Processing user created event for audit', userId: event.userId });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'user.created',
        serviceName: 'auth-service',
        userId: event.userId,
        entityType: 'user',
        entityId: event.userId,
        action: 'create',
        timestamp: new Date(event.timestamp),
        metadata: {
          username: event.username,
          email: event.email,
          role: event.role,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'User created event audited successfully', 
        userId: event.userId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing user created event', userId: event.userId, error });
      throw error;
    }
  }

  /**
   * Handle user updated event
   */
  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    logger.info({ message: 'Processing user updated event for audit', userId: event.userId });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'user.updated',
        serviceName: 'auth-service',
        userId: event.userId,
        entityType: 'user',
        entityId: event.userId,
        action: 'update',
        timestamp: new Date(event.timestamp),
        metadata: {
          username: event.username,
          email: event.email,
          role: event.role,
          isActive: event.isActive,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'User updated event audited successfully', 
        userId: event.userId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing user updated event', userId: event.userId, error });
      throw error;
    }
  }

  /**
   * Handle user deactivated event
   */
  private async handleUserDeactivated(event: UserDeactivatedEvent): Promise<void> {
    logger.info({ message: 'Processing user deactivated event for audit', userId: event.userId });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'user.deactivated',
        serviceName: 'auth-service',
        userId: event.userId,
        entityType: 'user',
        entityId: event.userId,
        action: 'deactivate',
        timestamp: new Date(event.timestamp),
        metadata: {
          reason: event.reason,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'User deactivated event audited successfully', 
        userId: event.userId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing user deactivated event', userId: event.userId, error });
      throw error;
    }
  }
}

// Create a singleton instance
export const userEventHandler = new UserEventHandler();