import { v4 as uuidv4 } from 'uuid';
import { kafkaProducer } from '../producer';
import { KAFKA_TOPICS } from '../config';
import { BulkAssignmentUploadedEvent } from '../types/events';
import { logger } from '../../utils/logger';

/**
 * Publisher for assignment events
 */
export class AssignmentPublisher {
  /**
   * Publish bulk assignment uploaded event
   */
  async publishBulkAssignmentUploaded(payload: {
    batchId: string;
    uploadedBy: string;
    userId: string;
    agentId: string;
    totalRows: number;
    processedRows: number;
    failedRows: number;
    status: 'processing' | 'completed' | 'failed';
  }): Promise<void> {
    try {
      const event: BulkAssignmentUploadedEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        batchId: payload.batchId,
        uploadedBy: payload.uploadedBy,
        userId: payload.userId,
        agentId: payload.agentId,
        totalRows: payload.totalRows,
        processedRows: payload.processedRows,
        failedRows: payload.failedRows,
        status: payload.status
      };

      // Use batchId as partition key
      await kafkaProducer.send(
        KAFKA_TOPICS.CUSTOMER_ASSIGNED,
        event,
        payload.batchId
      );

      logger.info({
        eventId: event.id,
        batchId: payload.batchId,
        uploadedBy: payload.uploadedBy,
        totalRows: payload.totalRows,
        status: payload.status,
        topic: KAFKA_TOPICS.CUSTOMER_ASSIGNED
      }, 'Published bulk assignment uploaded event');

    } catch (error) {
      logger.error({
        error,
        payload,
        topic: KAFKA_TOPICS.CUSTOMER_ASSIGNED
      }, 'Failed to publish bulk assignment uploaded event');
      throw error;
    }
  }
}

// Create a singleton instance
export const assignmentPublisher = new AssignmentPublisher();