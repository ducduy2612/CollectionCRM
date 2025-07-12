import { EachMessagePayload } from 'kafkajs';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { logger } from '../../utils/logger';
import { AUDIT_TOPICS } from '../config';
import { 
  ActionConfigUpdatedEvent, 
  CustomerAssignedEvent 
} from '../types/events';

/**
 * Workflow event handler for audit logging
 */
export class WorkflowEventHandler {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /**
   * Process a workflow event message
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
        case AUDIT_TOPICS.ACTION_CONFIG_UPDATED:
          await this.handleActionConfigUpdated(messageValue as ActionConfigUpdatedEvent);
          break;
        case AUDIT_TOPICS.CUSTOMER_ASSIGNED:
          await this.handleCustomerAssigned(messageValue as CustomerAssignedEvent);
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
   * Handle action config updated event
   */
  private async handleActionConfigUpdated(event: ActionConfigUpdatedEvent): Promise<void> {
    logger.info({ 
      message: 'Processing action config updated event for audit', 
      operation: event.operation,
      entityType: event.entityType,
      entityCode: event.entityCode,
      updatedBy: event.updatedBy
    });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: `action-config.${event.operation}`,
        serviceName: 'workflow-service',
        agentId: event.updatedBy,
        entityType: event.entityType,
        entityId: event.entityId || event.entityCode || '',
        action: event.operation,
        userAgent: event.updatedBy,
        timestamp: new Date(event.timestamp),
        metadata: event
      });

      logger.info({ 
        message: 'Action config updated event audited successfully', 
        operation: event.operation,
        entityType: event.entityType,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing action config updated event', entityType: event.entityType, error });
      throw error;
    }
  }

  /**
   * Handle customer assigned event
   */
  private async handleCustomerAssigned(event: CustomerAssignedEvent): Promise<void> {
    logger.info({ 
      message: 'Processing customer assigned event for audit', 
      agentId: event.agentId
    });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'customer.assigned',
        serviceName: 'workflow-service',
        agentId: event.agentId,
        entityType: 'assignment',
        entityId: event.batchId,
        userAgent: event.uploadedBy,
        action: 'create',
        timestamp: new Date(event.timestamp),
        metadata: event
      });

      logger.info({ 
        message: 'Customer assigned event audited successfully', 
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing customer assigned event', batchId: event.batchId, error });
      throw error;
    }
  }
}

// Create a singleton instance
export const workflowEventHandler = new WorkflowEventHandler();