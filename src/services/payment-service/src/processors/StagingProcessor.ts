import { Knex } from 'knex';
import pino from 'pino';
import { PaymentStagingModel } from '@/models/PaymentStaging';
import { StagingProcessLogModel } from '@/models/StagingProcessLog';
import { DeduplicationService } from '@/services/DeduplicationService';
import { PaymentStaging, Payment, BatchProcessResult } from '@/types/payment.types';
import { PaymentEventProducer } from '@/kafka/producer';
import { v4 as uuidv4 } from 'uuid';

export interface StagingProcessorConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  enableParallelProcessing: boolean;
  workerCount: number;
}

export class StagingProcessor {
  private knex: Knex;
  private logger: pino.Logger;
  private config: StagingProcessorConfig;
  
  private stagingModel: PaymentStagingModel;
  private processLogModel: StagingProcessLogModel;
  private deduplicationService: DeduplicationService;
  private eventProducer: PaymentEventProducer;
  
  private isProcessing: boolean = false;
  private lastProcessedId: bigint | null = null;

  constructor(
    knex: Knex,
    deduplicationService: DeduplicationService,
    eventProducer: PaymentEventProducer,
    logger: pino.Logger,
    config: StagingProcessorConfig
  ) {
    this.knex = knex;
    this.deduplicationService = deduplicationService;
    this.eventProducer = eventProducer;
    this.logger = logger;
    this.config = config;

    this.stagingModel = new PaymentStagingModel(knex);
    this.processLogModel = new StagingProcessLogModel(knex);
  }

  async processNext(): Promise<BatchProcessResult> {
    if (this.isProcessing) {
      this.logger.warn('Staging processor already running, skipping');
      return {
        total_processed: 0,
        successful_inserts: 0,
        duplicates_found: 0,
        errors: 0,
        processing_time_ms: 0,
      };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let processLogId: string | null = null;

    try {
      // Get the starting point for processing
      if (!this.lastProcessedId) {
        const lastBatch = await this.processLogModel.getLastProcessedBatch();
        this.lastProcessedId = lastBatch?.batch_end_id || BigInt(0);
      }

      // Get next batch of unprocessed records
      const stagingRecords = await this.stagingModel.getUnprocessedBatch(
        this.config.batchSize,
        this.lastProcessedId
      );

      if (stagingRecords.length === 0) {
        this.logger.debug('No unprocessed staging records found');
        return {
          total_processed: 0,
          successful_inserts: 0,
          duplicates_found: 0,
          errors: 0,
          processing_time_ms: Date.now() - startTime,
        };
      }

      const batchStartId = stagingRecords[0].id;
      const batchEndId = stagingRecords[stagingRecords.length - 1].id;

      this.logger.info({
        batch_size: stagingRecords.length,
        batch_start_id: batchStartId.toString(),
        batch_end_id: batchEndId.toString()
      }, 'Processing staging batch');

      // Create process log entry
      const processLog = await this.processLogModel.create({
        batch_start_id: batchStartId,
        batch_end_id: batchEndId,
        total_records: stagingRecords.length,
        processed_records: 0,
        duplicate_records: 0,
        error_records: 0,
        status: 'processing',
      });
      processLogId = processLog.id;

      // Process the batch
      const result = await this.processBatch(stagingRecords, processLogId);

      // Update process log with completion
      await this.processLogModel.update(processLogId, {
        processed_records: result.successful_inserts,
        duplicate_records: result.duplicates_found,
        error_records: result.errors,
        status: result.errors > 0 ? 'failed' : 'completed',
        completed_at: new Date(),
      });

      // Mark staging records as processed
      const processedIds = stagingRecords.map(record => record.id);
      await this.stagingModel.markAsProcessed(processedIds);

      // Update last processed ID
      this.lastProcessedId = batchEndId;

      this.logger.info({
        batch_id: processLogId,
        ...result
      }, 'Staging batch processing completed');

      // Publish batch processed event
      try {
        await this.eventProducer.publishBatchProcessed({
          ...result,
          batch_id: processLogId,
          batch_start_id: batchStartId,
          batch_end_id: batchEndId,
        });
      } catch (eventError) {
        this.logger.warn({
          error: eventError instanceof Error ? eventError.message : String(eventError),
          batch_id: processLogId,
        }, 'Failed to publish batch processed event');
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: errorMessage, batch_id: processLogId }, 'Error processing staging batch');

      // Update process log with error
      if (processLogId) {
        try {
          await this.processLogModel.update(processLogId, {
            status: 'failed',
            completed_at: new Date(),
            error_details: { error: errorMessage },
          });
        } catch (logError) {
          this.logger.error({ error: logError }, 'Failed to update process log with error');
        }
      }

      return {
        total_processed: 0,
        successful_inserts: 0,
        duplicates_found: 0,
        errors: 1,
        processing_time_ms: Date.now() - startTime,
      };

    } finally {
      this.isProcessing = false;
    }
  }

  private async processBatch(
    stagingRecords: PaymentStaging[],
    processLogId: string
  ): Promise<BatchProcessResult> {
    const startTime = Date.now();
    let successful_inserts = 0;
    let duplicates_found = 0;

    try {
      // Extract reference numbers for bulk duplicate check
      const referenceNumbers = stagingRecords.map(record => record.reference_number);
      
      // Bulk check for duplicates including intra-batch duplicates
      const { duplicateRefs, intraBatchDuplicates } = await this.deduplicationService.bulkCheckDuplicatesWithIntraBatch(referenceNumbers);
      const duplicateRefSet = new Set(duplicateRefs);
      
      // Count duplicate records more accurately
      // For existing duplicates: count all occurrences
      // For intra-batch duplicates: count all occurrences except the first one
      let totalDuplicateRecords = 0;
      const existingDuplicateRefs = new Set(duplicateRefs.filter(ref => !intraBatchDuplicates.has(ref)));
      
      stagingRecords.forEach((record, index) => {
        if (existingDuplicateRefs.has(record.reference_number)) {
          // Existing duplicate - count all occurrences
          totalDuplicateRecords++;
        } else if (intraBatchDuplicates.has(record.reference_number)) {
          // Intra-batch duplicate - count all except the first occurrence
          const indices = intraBatchDuplicates.get(record.reference_number)!;
          if (index !== indices[0]) {
            totalDuplicateRecords++;
          }
        }
      });
      duplicates_found = totalDuplicateRecords;
      
      this.logger.debug({
        total_records: stagingRecords.length,
        duplicates_found,
        unique_references: stagingRecords.length - duplicateRefs.length,
        intra_batch_duplicates: intraBatchDuplicates.size
      }, 'Bulk duplicate check with intra-batch detection completed');

      // For intra-batch duplicates, we only want to process the first occurrence
      const processedIntraBatchRefs = new Set<string>();
      const uniqueRecords = stagingRecords.filter(record => {
        // Skip if it's a known duplicate from existing data
        if (duplicateRefSet.has(record.reference_number)) {
          // But if it's an intra-batch duplicate, allow the first occurrence
          if (intraBatchDuplicates.has(record.reference_number)) {
            if (!processedIntraBatchRefs.has(record.reference_number)) {
              processedIntraBatchRefs.add(record.reference_number);
              return true; // Process the first occurrence
            }
          }
          return false; // Skip all other duplicates
        }
        return true; // Not a duplicate
      });

      if (uniqueRecords.length === 0) {
        this.logger.info({ batch_id: processLogId }, 'All records were duplicates, skipping insert');
        return {
          total_processed: stagingRecords.length,
          successful_inserts: 0,
          duplicates_found,
          errors: 0,
          processing_time_ms: Date.now() - startTime,
        };
      }

      // Convert staging records to payment records
      const payments: Omit<Payment, 'id' | 'created_at'>[] = uniqueRecords.map(record => ({
        reference_number: record.reference_number,
        loan_account_number: record.loan_account_number,
        cif: record.cif,
        amount: record.amount,
        payment_date: record.payment_date,
        ...(record.payment_channel && { payment_channel: record.payment_channel }),
        source: 'staging' as const,
        ...(record.metadata && { metadata: record.metadata }),
      }));

      // Use transaction for consistency
      await this.knex.transaction(async (trx) => {
        // Bulk insert payments
        await trx('payment_service.payments').insert(
          payments.map(payment => {
            let metadataString = null;
            if (payment.metadata) {
              try {
                // Ensure metadata is properly stringified
                metadataString = typeof payment.metadata === 'string' 
                  ? payment.metadata 
                  : JSON.stringify(payment.metadata);
              } catch (error) {
                this.logger.warn({
                  reference_number: payment.reference_number,
                  error: error instanceof Error ? error.message : String(error)
                }, 'Failed to stringify metadata, setting to null');
                metadataString = null;
              }
            }

            return {
              reference_number: payment.reference_number,
              loan_account_number: payment.loan_account_number,
              cif: payment.cif,
              amount: payment.amount,
              payment_date: payment.payment_date,
              payment_channel: payment.payment_channel,
              source: payment.source,
              metadata: metadataString,
            };
          })
        );

        // Get the inserted payment IDs by querying back
        const insertedPayments = await trx('payment_service.payments')
          .whereIn('reference_number', uniqueRecords.map(r => r.reference_number))
          .select('id', 'reference_number', 'payment_date');

        // Prepare references for deduplication cache
        const references = insertedPayments.map(payment => ({
          reference_number: payment.reference_number,
          payment_id: payment.id,
          payment_date: new Date(payment.payment_date),
        }));

        // Add references to deduplication cache (within transaction)
        await trx('payment_service.payment_references').insert(
          references.map(ref => ({
            reference_number: ref.reference_number,
            payment_id: ref.payment_id,
            payment_date: ref.payment_date,
          }))
        ).onConflict('reference_number').ignore();
      });

      successful_inserts = uniqueRecords.length;

      // Cache references in Redis and memory (outside transaction)
      try {
        const referencePromises = uniqueRecords.map(async (record) => {
          const paymentId = uuidv4(); // This would be the actual ID from the insert
          await this.deduplicationService.addReference(
            record.reference_number,
            paymentId,
            record.payment_date
          );
        });
        
        await Promise.all(referencePromises);
      } catch (cacheError) {
        // Log cache error but don't fail the batch
        this.logger.warn({ 
          error: cacheError instanceof Error ? cacheError.message : String(cacheError) 
        }, 'Failed to update cache after successful insert');
      }

      this.logger.info({
        batch_id: processLogId,
        successful_inserts,
        duplicates_found,
        processing_time_ms: Date.now() - startTime
      }, 'Batch processing completed successfully');

      return {
        total_processed: stagingRecords.length,
        successful_inserts,
        duplicates_found,
        errors: 0,
        processing_time_ms: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ 
        error: errorMessage, 
        batch_id: processLogId,
        records_count: stagingRecords.length 
      }, 'Error during batch processing');

      return {
        total_processed: stagingRecords.length,
        successful_inserts,
        duplicates_found,
        errors: stagingRecords.length - successful_inserts - duplicates_found,
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  async getProcessingStats(): Promise<{
    is_processing: boolean;
    last_processed_id: string | null;
    pending_count: number;
    processing_rate_per_hour: number;
  }> {
    const stats = await this.stagingModel.getProcessingStats();
    
    return {
      is_processing: this.isProcessing,
      last_processed_id: this.lastProcessedId?.toString() || null,
      pending_count: stats.unprocessed_records,
      processing_rate_per_hour: stats.processing_rate_per_hour,
    };
  }

  async warmUp(): Promise<void> {
    try {
      // Initialize last processed ID
      const lastBatch = await this.processLogModel.getLastProcessedBatch();
      this.lastProcessedId = lastBatch?.batch_end_id || BigInt(0);

      this.logger.info({ 
        last_processed_id: this.lastProcessedId?.toString() 
      }, 'Staging processor warmed up');

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error during staging processor warm up');
    }
  }

  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  getLastProcessedId(): bigint | null {
    return this.lastProcessedId;
  }
}