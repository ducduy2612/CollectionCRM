import { v4 as uuidv4 } from 'uuid';
import { kafkaProducer } from '../producer';
import { KAFKA_TOPICS } from '../config';
import { ActionRecordCreatedEvent } from '../types/events';
import { logger } from '../../utils/logger';

/**
 * Publisher for action record events
 */
export class ActionRecordPublisher {
  /**
   * Publish action record created event for customer case f_update
   */
  async publishActionRecordCreated(payload: {
    actionIds: string[];
    cif: string;
    loanAccountNumbers: string[];
    agentId: string;
    agentName: string;
    fUpdate: Date;
    actionDate: Date;
  }): Promise<void> {
    try {
      const event: ActionRecordCreatedEvent = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0',
        actionIds: payload.actionIds,
        cif: payload.cif,
        loanAccountNumbers: payload.loanAccountNumbers,
        agentId: payload.agentId,
        agentName: payload.agentName,
        fUpdate: payload.fUpdate.toISOString(),
        actionDate: payload.actionDate.toISOString()
      };

      // Use CIF as partition key to ensure sequential processing per customer
      await kafkaProducer.send(
        KAFKA_TOPICS.ACTION_RECORD_CREATED,
        event,
        payload.cif
      );

      logger.info({
        eventId: event.id,
        actionIds: payload.actionIds,
        cif: payload.cif,
        loanCount: payload.loanAccountNumbers.length,
        topic: KAFKA_TOPICS.ACTION_RECORD_CREATED
      }, 'Published action record created event');

    } catch (error) {
      logger.error({
        error,
        payload,
        topic: KAFKA_TOPICS.ACTION_RECORD_CREATED
      }, 'Failed to publish action record created event');
      throw error;
    }
  }

  /**
   * Publish multiple action record created events in a batch
   */
  async publishBatchActionRecordCreated(payloads: Array<{
    actionIds: string[];
    cif: string;
    loanAccountNumbers: string[];
    agentId: string;
    agentName: string;
    fUpdate: Date;
    actionDate: Date;
  }>): Promise<void> {
    try {
      const messages = payloads.map(payload => {
        const event: ActionRecordCreatedEvent = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          version: '1.0',
          actionIds: payload.actionIds,
          cif: payload.cif,
          loanAccountNumbers: payload.loanAccountNumbers,
          agentId: payload.agentId,
          agentName: payload.agentName,
          fUpdate: payload.fUpdate.toISOString(),
          actionDate: payload.actionDate.toISOString()
        };

        return {
          topic: KAFKA_TOPICS.ACTION_RECORD_CREATED,
          message: event,
          key: payload.cif // Use CIF as partition key
        };
      });

      await kafkaProducer.sendBatch(messages);

      logger.info({
        count: payloads.length,
        totalLoans: payloads.reduce((sum, p) => sum + p.loanAccountNumbers.length, 0),
        topic: KAFKA_TOPICS.ACTION_RECORD_CREATED
      }, 'Published batch action record created events');

    } catch (error) {
      logger.error({
        error,
        count: payloads.length,
        topic: KAFKA_TOPICS.ACTION_RECORD_CREATED
      }, 'Failed to publish batch action record created events');
      throw error;
    }
  }
}

// Create a singleton instance
export const actionRecordPublisher = new ActionRecordPublisher();