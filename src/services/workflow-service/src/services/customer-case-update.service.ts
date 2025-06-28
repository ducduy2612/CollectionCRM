import { CustomerCaseRepository } from '../repositories/customer-case.repository';
import { ActionRecordCreatedEvent } from '../kafka/types/events';
import { logger } from '../utils/logger';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';

/**
 * Service for handling customer case updates from Kafka events
 */
export class CustomerCaseUpdateService {
  /**
   * Process a single action record created event
   */
  async processActionRecordCreated(event: ActionRecordCreatedEvent): Promise<void> {
    try {
      logger.debug({
        eventId: event.id,
        actionIds: event.actionIds,
        cif: event.cif,
        loanCount: event.loanAccountNumbers.length
      }, 'Processing action record created event');

      const fUpdate = new Date(event.fUpdate);
      const updatedBy = event.agentName; // Use agent name directly

      await CustomerCaseRepository.updateFUpdate(
        event.cif,
        fUpdate,
        updatedBy
      );

      logger.info({
        eventId: event.id,
        actionIds: event.actionIds,
        cif: event.cif,
        loanCount: event.loanAccountNumbers.length,
        fUpdate: event.fUpdate
      }, 'Successfully updated customer case f_update');

    } catch (error) {
      logger.error({
        error,
        eventId: event.id,
        actionIds: event.actionIds,
        cif: event.cif
      }, 'Failed to process action record created event');

      throw Errors.wrap(
        error as Error,
        OperationType.EVENT_PROCESSING,
        SourceSystemType.WORKFLOW_SERVICE,
        { event, operation: 'processActionRecordCreated' }
      );
    }
  }

  /**
   * Process multiple action record created events in batch
   */
  async processBatchActionRecordCreated(events: ActionRecordCreatedEvent[]): Promise<void> {
    try {
      logger.debug({
        count: events.length
      }, 'Processing batch action record created events');

      // Group events by CIF and take the latest f_update for each customer
      const customerUpdates = new Map<string, { fUpdate: Date; agentName: string; eventId: string }>();
      
      events.forEach(event => {
        const fUpdate = new Date(event.fUpdate);
        const existing = customerUpdates.get(event.cif);
        
        // Keep the latest f_update for each customer
        if (!existing || fUpdate > existing.fUpdate) {
          customerUpdates.set(event.cif, {
            fUpdate,
            agentName: event.agentName,
            eventId: event.id
          });
        }
      });

      // Prepare bulk update data
      const updates = Array.from(customerUpdates.entries()).map(([cif, data]) => ({
        cif,
        fUpdate: data.fUpdate,
        updatedBy: data.agentName // Use agent name directly
      }));

      if (updates.length > 0) {
        await CustomerCaseRepository.bulkUpdateFUpdate(updates);

        logger.info({
          processedEvents: events.length,
          uniqueCustomers: updates.length
        }, 'Successfully processed batch action record created events');
      }

    } catch (error) {
      logger.error({
        error,
        eventCount: events.length
      }, 'Failed to process batch action record created events');

      throw Errors.wrap(
        error as Error,
        OperationType.EVENT_PROCESSING,
        SourceSystemType.WORKFLOW_SERVICE,
        { eventCount: events.length, operation: 'processBatchActionRecordCreated' }
      );
    }
  }

  /**
   * Validate action record created event
   */
  private validateEvent(event: ActionRecordCreatedEvent): void {
    if (!event.id || !event.actionIds || !Array.isArray(event.actionIds) || event.actionIds.length === 0 || 
        !event.cif || !event.agentId || !event.agentName || !event.fUpdate || 
        !event.loanAccountNumbers || !Array.isArray(event.loanAccountNumbers) || event.loanAccountNumbers.length === 0) {
      throw Errors.create(
        Errors.Validation.REQUIRED_FIELD_MISSING,
        'Missing required fields in action record created event',
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    // Validate date format
    const fUpdate = new Date(event.fUpdate);
    if (isNaN(fUpdate.getTime())) {
      throw Errors.create(
        Errors.Validation.INVALID_FORMAT,
        'Invalid fUpdate date format in action record created event',
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }
  }
}

// Create a singleton instance
export const customerCaseUpdateService = new CustomerCaseUpdateService();