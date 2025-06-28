import { EachMessagePayload } from 'kafkajs';
import { KafkaConsumer } from '../consumer';
import { CONSUMER_GROUPS } from '../config';
import { ActionRecordCreatedEvent } from '../types/events';
import { customerCaseUpdateService } from '../../services/customer-case-update.service';
import { logger } from '../../utils/logger';

/**
 * Consumer for customer case update events
 */
export class CustomerCaseUpdateConsumer {
  private consumer: KafkaConsumer;
  private batchProcessingEnabled: boolean = true;
  private batchSize: number = 50;
  private batchTimeoutMs: number = 5000;
  private eventBatch: ActionRecordCreatedEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.consumer = new KafkaConsumer(CONSUMER_GROUPS.CUSTOMER_CASE_UPDATES);
  }

  /**
   * Start consuming customer case update events
   */
  async start(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info('Customer case update consumer connected');
    } catch (error) {
      logger.error({ error }, 'Failed to start customer case update consumer');
      throw error;
    }
  }

  /**
   * Stop consuming events
   */
  async stop(): Promise<void> {
    try {
      // Process any remaining events in batch
      if (this.eventBatch.length > 0) {
        await this.processBatch();
      }

      // Clear any pending batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      await this.consumer.disconnect();
      logger.info('Customer case update consumer stopped');
    } catch (error) {
      logger.error({ error }, 'Error stopping customer case update consumer');
      throw error;
    }
  }

  /**
   * Subscribe to action record created events
   */
  async subscribeToActionRecordCreated(): Promise<void> {
    await this.consumer.subscribe(
      'workflow-service.action-record.created',
      this.handleActionRecordCreated.bind(this)
    );
  }

  /**
   * Start consuming all subscribed topics
   */
  async startConsuming(): Promise<void> {
    await this.consumer.startConsumingAll();
  }

  /**
   * Handle action record created event
   */
  private async handleActionRecordCreated(payload: EachMessagePayload): Promise<void> {
    try {
      const { message } = payload;
      
      if (!message.value) {
        logger.warn('Received message with no value');
        return;
      }

      const event: ActionRecordCreatedEvent = JSON.parse(message.value.toString());
      
      logger.debug({
        eventId: event.id,
        actionId: event.actionId,
        cif: event.cif,
        offset: message.offset
      }, 'Received action record created event');

      if (this.batchProcessingEnabled) {
        await this.addToBatch(event);
      } else {
        // Process immediately
        await customerCaseUpdateService.processActionRecordCreated(event);
      }

    } catch (error) {
      logger.error({
        error,
        offset: payload.message.offset,
        partition: payload.partition
      }, 'Error handling action record created event');
      
      // Don't throw error to avoid stopping the consumer
      // In production, consider implementing dead letter queue
    }
  }

  /**
   * Add event to batch for processing
   */
  private async addToBatch(event: ActionRecordCreatedEvent): Promise<void> {
    this.eventBatch.push(event);

    // Process batch if it reaches the size limit
    if (this.eventBatch.length >= this.batchSize) {
      await this.processBatch();
    } else if (this.eventBatch.length === 1) {
      // Set timer for the first event in a new batch
      this.batchTimer = setTimeout(() => {
        this.processBatch().catch(error => {
          logger.error({ error }, 'Error in batch timer processing');
        });
      }, this.batchTimeoutMs);
    }
  }

  /**
   * Process the current batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.eventBatch.length === 0) {
      return;
    }

    // Clear the timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const currentBatch = [...this.eventBatch];
    this.eventBatch = [];

    try {
      await customerCaseUpdateService.processBatchActionRecordCreated(currentBatch);
      
      logger.debug({
        batchSize: currentBatch.length
      }, 'Successfully processed event batch');

    } catch (error) {
      logger.error({
        error,
        batchSize: currentBatch.length
      }, 'Error processing event batch');

      // Could implement retry logic or dead letter queue here
      // For now, we log the error and continue
    }
  }

  /**
   * Enable/disable batch processing
   */
  setBatchProcessing(enabled: boolean, batchSize?: number, timeoutMs?: number): void {
    this.batchProcessingEnabled = enabled;
    
    if (batchSize !== undefined) {
      this.batchSize = batchSize;
    }
    
    if (timeoutMs !== undefined) {
      this.batchTimeoutMs = timeoutMs;
    }

    logger.info({
      batchProcessingEnabled: this.batchProcessingEnabled,
      batchSize: this.batchSize,
      batchTimeoutMs: this.batchTimeoutMs
    }, 'Updated batch processing settings');
  }
}

// Create a singleton instance
export const customerCaseUpdateConsumer = new CustomerCaseUpdateConsumer();