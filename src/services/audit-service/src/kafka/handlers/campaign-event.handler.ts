import { EachMessagePayload } from 'kafkajs';
import { AuditLogRepository } from '../../repositories/audit-log.repository';
import { logger } from '../../utils/logger';
import { AUDIT_TOPICS } from '../config';
import { CampaignEvent, CampaignProcessingEvent } from '../types/events';

/**
 * Campaign event handler for audit logging
 */
export class CampaignEventHandler {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /**
   * Process a campaign event message
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
        case AUDIT_TOPICS.CAMPAIGN_CREATED:
          await this.handleCampaignEvent(messageValue as CampaignEvent, 'create');
          break;
        case AUDIT_TOPICS.CAMPAIGN_UPDATED:
          await this.handleCampaignEvent(messageValue as CampaignEvent, 'update');
          break;
        case AUDIT_TOPICS.CAMPAIGN_DELETED:
          await this.handleCampaignEvent(messageValue as CampaignEvent, 'delete');
          break;
        case AUDIT_TOPICS.CAMPAIGN_PROCESS_RESULT:
          await this.handleCampaignProcessingEvent(messageValue as CampaignProcessingEvent);
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
   * Handle campaign event (created, updated, deleted)
   */
  private async handleCampaignEvent(event: CampaignEvent, operation: string): Promise<void> {
    logger.info({ 
      message: `Processing campaign ${operation} event for audit`, 
      campaignId: event.data.id,
      campaignType: event.data.type,
      campaignName: event.data.name
    });

    try {
      // Extract user information from campaign data
      const username = this.extractUsername(event.data, operation);
      const userId = this.extractUserId(event.data, operation);
      
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: `campaign.${operation}`,
        serviceName: 'campaign-engine',
        userId: userId,
        entityType: event.data.type, // 'campaign' or 'campaign_group'
        entityId: event.data.id,
        action: operation,
        userAgent: username,
        timestamp: new Date(event.timestamp),
        metadata: event
      });

      logger.info({ 
        message: `Campaign ${operation} event audited successfully`, 
        campaignId: event.data.id,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ 
        message: `Error auditing campaign ${operation} event`, 
        campaignId: event.data.id, 
        error 
      });
      throw error;
    }
  }

  /**
   * Extract username from campaign data
   */
  private extractUsername(campaignData: any, operation: string): string {
    // Extract username based on operation type
    if (operation === 'create' && campaignData.created_by) {
      return campaignData.created_by;
    }
    if (operation === 'update' && campaignData.updated_by) {
      return campaignData.updated_by;
    }
    if (operation === 'delete' && campaignData.deleted_by) {
      return campaignData.deleted_by;
    }
    
    // Default to system if no user information found
    return 'system';
  }

  /**
   * Extract user ID from campaign data
   */
  private extractUserId(campaignData: any, operation: string): string {
    // Extract user ID based on operation type
    if (operation === 'create' && campaignData.created_by_id) {
      return campaignData.created_by_id;
    }
    if (operation === 'update' && campaignData.updated_by_id) {
      return campaignData.updated_by_id;
    }
    if (operation === 'delete' && campaignData.deleted_by_id) {
      return campaignData.deleted_by_id;
    }
    
    // Default to system if no user ID found
    return 'system';
  }

  /**
   * Handle campaign processing event
   */
  private async handleCampaignProcessingEvent(event: CampaignProcessingEvent): Promise<void> {
    logger.info({ 
      message: 'Processing campaign processing event for audit', 
      requestId: event.data.request_id,
      processedCount: event.data.processed_count,
      successCount: event.data.success_count,
      errorCount: event.data.error_count,
      requestedBy: event.data.requested_by
    });

    try {
      const username = event.data.requested_by || 'system';
      const userId = event.data.requested_by_id || 'system';
      
      await this.auditLogRepository.create({
        eventId: event.id,
        eventType: 'campaign.processing',
        serviceName: 'campaign-engine',
        userId: userId,
        entityType: 'processing_run',
        entityId: event.data.request_id,
        action: 'process',
        userAgent: username,
        timestamp: new Date(event.timestamp),
        metadata: event
      });

      logger.info({ 
        message: 'Campaign processing event audited successfully', 
        requestId: event.data.request_id,
        eventId: event.id
      });
    } catch (error) {
      logger.error({ 
        message: 'Error auditing campaign processing event', 
        requestId: event.data.request_id, 
        error 
      });
      throw error;
    }
  }
}

// Create a singleton instance
export const campaignEventHandler = new CampaignEventHandler();