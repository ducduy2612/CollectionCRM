import { CustomerAgentStaging } from '../entities/customer-agent-staging.entity';
import { CustomerAgent } from '../entities/customer-agent.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { AgentRepository } from './agent.repository';
import { v4 as uuidv4 } from 'uuid';

/**
 * Staging data interface for bulk uploads
 */
export interface StagingData {
  cif: string;
  assignedCallAgentName?: string;
  assignedFieldAgentName?: string;
  lineNumber: number;
}

/**
 * Batch processing result interface
 */
export interface BatchProcessingResult {
  batchId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  failedRows: number;
  skippedRows: number;
  errors: string[];
}

/**
 * Repository for CustomerAgentStaging entity
 */
export const CustomerAgentStagingRepository = AppDataSource.getRepository(CustomerAgentStaging).extend({
  /**
   * Create a new staging batch from CSV data
   * @param stagingData Array of staging data from CSV
   * @param createdBy User who created the batch
   * @returns Batch ID
   */
  async createStagingBatch(stagingData: StagingData[], createdBy: string): Promise<string> {
    try {
      const batchId = uuidv4();
      
      // Prepare staging records
      const stagingRecords = stagingData.map(data => ({
        batchId,
        lineNumber: data.lineNumber,
        cif: data.cif,
        assignedCallAgentName: data.assignedCallAgentName || null,
        assignedFieldAgentName: data.assignedFieldAgentName || null,
        createdBy,
        updatedBy: createdBy
      }));

      // Use batch processing for large datasets
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      
      let transactionStarted = false;
      
      try {
        await queryRunner.startTransaction();
        transactionStarted = true;
        
        // Process records in batches of 1000 to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < stagingRecords.length; i += batchSize) {
          const batch = stagingRecords.slice(i, i + batchSize);
          
          // Use parameterized query to prevent SQL injection (PostgreSQL style)
          const values = batch.map((_, index) => {
            const baseIndex = index * 7;
            return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`;
          }).join(', ');
          
          const params = batch.flatMap(record => [
            record.batchId,
            record.lineNumber,
            record.cif,
            record.assignedCallAgentName,
            record.assignedFieldAgentName,
            record.createdBy,
            record.updatedBy
          ]);

          await queryRunner.query(`
            INSERT INTO workflow_service.customer_agent_staging 
            (batch_id, line_number, cif, assigned_call_agent_name, assigned_field_agent_name, created_by, updated_by)
            VALUES ${values}
          `, params);
        }

        await queryRunner.commitTransaction();
        transactionStarted = false;
        
        return batchId;
      } catch (error) {
        if (transactionStarted) {
          try {
            await queryRunner.rollbackTransaction();
          } catch (rollbackError) {
            // Log rollback error but don't throw it
            console.error('Error during rollback:', rollbackError);
          }
        }
        throw error;
      } finally {
        if (queryRunner.isReleased === false) {
          await queryRunner.release();
        }
      }
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { stagingDataCount: stagingData.length, operation: 'createStagingBatch' }
      );
    }
  },

  /**
   * Validate staging batch - resolve agent names and validate CIFs using stored procedure
   * @param batchId Batch ID to validate
   * @returns Validation results
   */
  async validateStagingBatch(batchId: string): Promise<{ validCount: number; invalidCount: number }> {
    try {
      const result = await this.query(`
        SELECT * FROM workflow_service.bulk_validate_staging_batch($1)
      `, [batchId]);

      return {
        validCount: result[0].valid_count,
        invalidCount: result[0].invalid_count
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { batchId, operation: 'validateStagingBatch' }
      );
    }
  },

  /**
   * Process staging batch - create customer agent assignments using stored procedure
   * @param batchId Batch ID to process
   * @param processedBy User who processed the batch
   * @returns Processing results
   */
  async processStagingBatch(batchId: string, processedBy: string): Promise<BatchProcessingResult> {
    try {
      // Use the stored procedure for processing
      const result = await this.query(`
        SELECT * FROM workflow_service.bulk_process_staging_batch($1, $2)
      `, [batchId, processedBy]);

      // Get error details
      const errorResult = await this.query(`
        SELECT line_number, validation_errors, processing_errors 
        FROM workflow_service.customer_agent_staging 
        WHERE batch_id = $1 AND (validation_status = 'invalid' OR processing_status = 'failed')
        ORDER BY line_number
      `, [batchId]);

      return {
        batchId,
        totalRows: result[0].total_rows,
        validRows: result[0].valid_rows,
        invalidRows: result[0].invalid_rows,
        processedRows: result[0].processed_rows,
        failedRows: result[0].failed_rows,
        skippedRows: result[0].skipped_rows,
        errors: errorResult.map((row: any) => 
          `Line ${row.line_number}: ${row.validation_errors || row.processing_errors}`)
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { batchId, operation: 'processStagingBatch' }
      );
    }
  },

  /**
   * Get batch processing status using stored procedure
   * @param batchId Batch ID
   * @returns Batch status information
   */
  async getBatchStatus(batchId: string): Promise<BatchProcessingResult | null> {
    try {
      const result = await this.query(`
        SELECT * FROM workflow_service.get_batch_status($1)
      `, [batchId]);

      if (result.length === 0 || result[0].total_rows === 0) {
        return null;
      }

      return {
        batchId,
        totalRows: result[0].total_rows,
        validRows: result[0].valid_rows,
        invalidRows: result[0].invalid_rows,
        processedRows: result[0].processed_rows,
        failedRows: result[0].failed_rows,
        skippedRows: result[0].skipped_rows,
        errors: result[0].error_details || []
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { batchId, operation: 'getBatchStatus' }
      );
    }
  },

  /**
   * Clear all staging table data
   * @returns Number of deleted records
   */
  async clearStagingTable(): Promise<number> {
    try {
      const result = await this.query(`
        SELECT workflow_service.clear_staging_table()
      `);

      return result[0].clear_staging_table || 0;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'clearStagingTable' }
      );
    }
  }
});