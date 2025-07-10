import { EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { logger } from '../../utils/logger';
import { AUDIT_TOPICS } from '../config';
import { 
  AgentCreatedEvent, 
  AgentUpdatedEvent, 
  ActionRecordedEvent, 
  ActionRecordCreatedEvent, 
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
        case AUDIT_TOPICS.AGENT_CREATED:
          await this.handleAgentCreated(messageValue as AgentCreatedEvent);
          break;
        case AUDIT_TOPICS.AGENT_UPDATED:
          await this.handleAgentUpdated(messageValue as AgentUpdatedEvent);
          break;
        case AUDIT_TOPICS.ACTION_RECORDED:
          await this.handleActionRecorded(messageValue as ActionRecordedEvent);
          break;
        case AUDIT_TOPICS.ACTION_RECORD_CREATED:
          await this.handleActionRecordCreated(messageValue as ActionRecordCreatedEvent);
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
   * Handle agent created event
   */
  private async handleAgentCreated(event: AgentCreatedEvent): Promise<void> {
    logger.info({ message: 'Processing agent created event for audit', agentId: event.agentId });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'agent.created',
        serviceName: 'workflow-service',
        userId: event.userId,
        agentId: event.agentId,
        entityType: 'agent',
        entityId: event.agentId,
        action: 'create',
        timestamp: new Date(event.timestamp),
        metadata: {
          name: event.name,
          email: event.email,
          department: event.department,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'Agent created event audited successfully', 
        agentId: event.agentId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing agent created event', agentId: event.agentId, error });
      throw error;
    }
  }

  /**
   * Handle agent updated event
   */
  private async handleAgentUpdated(event: AgentUpdatedEvent): Promise<void> {
    logger.info({ message: 'Processing agent updated event for audit', agentId: event.agentId });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'agent.updated',
        serviceName: 'workflow-service',
        userId: event.userId,
        agentId: event.agentId,
        entityType: 'agent',
        entityId: event.agentId,
        action: 'update',
        timestamp: new Date(event.timestamp),
        metadata: {
          name: event.name,
          email: event.email,
          department: event.department,
          isActive: event.isActive,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'Agent updated event audited successfully', 
        agentId: event.agentId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing agent updated event', agentId: event.agentId, error });
      throw error;
    }
  }

  /**
   * Handle action recorded event
   */
  private async handleActionRecorded(event: ActionRecordedEvent): Promise<void> {
    logger.info({ 
      message: 'Processing action recorded event for audit', 
      actionId: event.actionId,
      agentId: event.agentId,
      customerId: event.customerId
    });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'action.recorded',
        serviceName: 'workflow-service',
        agentId: event.agentId,
        entityType: 'action',
        entityId: event.actionId,
        action: 'create',
        timestamp: new Date(event.timestamp),
        metadata: {
          actionId: event.actionId,
          customerId: event.customerId,
          actionType: event.actionType,
          actionSubtype: event.actionSubtype,
          notes: event.notes,
          result: event.result,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'Action recorded event audited successfully', 
        actionId: event.actionId,
        agentId: event.agentId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing action recorded event', actionId: event.actionId, error });
      throw error;
    }
  }

  /**
   * Handle action record created event
   */
  private async handleActionRecordCreated(event: ActionRecordCreatedEvent): Promise<void> {
    logger.info({ 
      message: 'Processing action record created event for audit', 
      agentId: event.agentId,
      cif: event.cif,
      actionCount: event.actionIds.length
    });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'action-record.created',
        serviceName: 'workflow-service',
        agentId: event.agentId,
        entityType: 'customer',
        entityId: event.cif,
        action: 'update',
        timestamp: new Date(event.timestamp),
        metadata: {
          actionIds: event.actionIds,
          cif: event.cif,
          loanAccountNumbers: event.loanAccountNumbers,
          agentName: event.agentName,
          fUpdate: event.fUpdate,
          actionDate: event.actionDate,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'Action record created event audited successfully', 
        agentId: event.agentId,
        cif: event.cif,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing action record created event', agentId: event.agentId, error });
      throw error;
    }
  }

  /**
   * Handle customer assigned event
   */
  private async handleCustomerAssigned(event: CustomerAssignedEvent): Promise<void> {
    logger.info({ 
      message: 'Processing customer assigned event for audit', 
      assignmentId: event.assignmentId,
      customerId: event.customerId,
      agentId: event.agentId
    });

    try {
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'customer.assigned',
        serviceName: 'workflow-service',
        agentId: event.agentId,
        entityType: 'assignment',
        entityId: event.assignmentId,
        action: 'create',
        timestamp: new Date(event.timestamp),
        metadata: {
          assignmentId: event.assignmentId,
          customerId: event.customerId,
          startDate: event.startDate,
          endDate: event.endDate,
          reason: event.reason,
          originalEvent: event
        }
      });

      logger.info({ 
        message: 'Customer assigned event audited successfully', 
        assignmentId: event.assignmentId,
        customerId: event.customerId,
        agentId: event.agentId,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ message: 'Error auditing customer assigned event', assignmentId: event.assignmentId, error });
      throw error;
    }
  }
}

// Create a singleton instance
export const workflowEventHandler = new WorkflowEventHandler();