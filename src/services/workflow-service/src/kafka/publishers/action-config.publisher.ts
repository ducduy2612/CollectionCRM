import { v4 as uuidv4 } from 'uuid';
import { kafkaProducer } from '../producer';
import { KAFKA_TOPICS } from '../config';
import { ActionConfigUpdatedEvent } from '../types/events';
import { logger } from '../../utils/logger';

/**
 * Publisher for action configuration events
 */
export class ActionConfigPublisher {
  /**
   * Publish action config updated event
   */
  async publishActionConfigUpdated(payload: {
    operation: 'add' | 'update' | 'deactivate' | 'map' | 'unmap';
    entityType: 'action_type' | 'action_subtype' | 'action_result' | 'type_subtype_mapping' | 'subtype_result_mapping';
    entityCode?: string;
    entityId?: string;
    changes?: Record<string, any>;
    updatedBy: string;
    userId: string;
  }): Promise<void> {
    try {
      const event: ActionConfigUpdatedEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        operation: payload.operation,
        entityType: payload.entityType,
        entityCode: payload.entityCode,
        entityId: payload.entityId,
        changes: payload.changes,
        updatedBy: payload.updatedBy,
        userId: payload.userId
      };

      // Use entity type and code as partition key for ordering
      const partitionKey = `${payload.entityType}-${payload.entityCode || payload.entityId || 'unknown'}`;
      
      await kafkaProducer.send(
        KAFKA_TOPICS.ACTION_CONFIG_UPDATED,
        event,
        partitionKey
      );

      logger.info({
        eventId: event.id,
        operation: payload.operation,
        entityType: payload.entityType,
        entityCode: payload.entityCode,
        updatedBy: payload.updatedBy,
        topic: KAFKA_TOPICS.ACTION_CONFIG_UPDATED
      }, 'Published action config updated event');

    } catch (error) {
      logger.error({
        error,
        payload,
        topic: KAFKA_TOPICS.ACTION_CONFIG_UPDATED
      }, 'Failed to publish action config updated event');
      throw error;
    }
  }
}

// Create a singleton instance
export const actionConfigPublisher = new ActionConfigPublisher();