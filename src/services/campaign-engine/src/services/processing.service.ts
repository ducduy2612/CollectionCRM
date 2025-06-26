import { 
  ProcessingCampaign,
  BatchProcessingRequest,
  BatchProcessingResult,
  CampaignConfiguration,
  ProcessingCampaignGroup
} from '../models/processing.models';
import { CampaignRepository } from '../repositories/campaign.repository';
import { ProcessingResultsRepository } from '../repositories/processing-results.repository';
import { KafkaService } from './kafka.service';
import { logger, createLogger } from '../utils/logger';
import db from '../config/database';

// Removed QueryResult interface - no longer needed with batch processing

export class ProcessingService {
  private campaignRepository: CampaignRepository;
  private resultsRepository: ProcessingResultsRepository;
  private kafkaService: KafkaService;

  constructor() {
    this.campaignRepository = new CampaignRepository();
    this.resultsRepository = new ProcessingResultsRepository();
    this.kafkaService = KafkaService.getInstance();
  }

  async processBatchRequest(request: BatchProcessingRequest): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const processingLogger = createLogger({ requestId: request.request_id });
    
    processingLogger.info('Starting campaign processing using batch stored procedures');

    // Create processing run in database
    const processingRunId = await this.resultsRepository.createProcessingRun({
      requestId: request.request_id,
      campaignGroupIds: request.campaign_group_ids || null,
      processingOptions: request.processing_options,
      startedAt: new Date(startTime)
    });

    try {
      // Load campaign configuration
      const campaignConfig: CampaignConfiguration = await this.campaignRepository.getCampaignConfiguration();
      processingLogger.info(`Loaded ${campaignConfig.campaign_groups.length} campaign groups`);

      // Filter groups if specified
      const groupsToProcess = request.campaign_group_ids 
        ? campaignConfig.campaign_groups.filter((g: ProcessingCampaignGroup) => request.campaign_group_ids!.includes(g.id))
        : campaignConfig.campaign_groups;

      // Process all campaigns using single batch stored procedure
      const batchResult = await this.processCampaignsBatch(
        processingRunId,
        groupsToProcess,
        processingLogger
      );

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      processingLogger.info(`Processing completed in ${totalDuration}ms`);
      processingLogger.info(`Processed ${batchResult.total_customers_processed} customers across ${batchResult.total_campaigns_processed} campaigns`);
      processingLogger.info(`Encountered ${batchResult.total_errors} errors`);

      // Get detailed results for response
      const result = await this.buildBatchProcessingResult(
        request.request_id,
        processingRunId,
        batchResult,
        new Date(startTime),
        new Date(endTime),
        totalDuration
      );

      // Update processing run status
      await this.resultsRepository.updateProcessingRun(request.request_id, {
        status: 'completed',
        completedAt: new Date(endTime),
        processedCount: result.processed_count,
        successCount: result.success_count,
        errorCount: result.error_count,
        totalDurationMs: totalDuration
      });

      // Publish result to Kafka
      await this.publishResultToKafka(request.request_id, result);

      return result;

    } catch (error) {
      processingLogger.error('Processing failed:', error);
      
      // Update processing run status to failed
      await this.resultsRepository.updateProcessingRun(request.request_id, {
        status: 'failed',
        completedAt: new Date()
      });
      
      throw error;
    }
  }

  private async processCampaignsBatch(
    processingRunId: string,
    groups: ProcessingCampaignGroup[],
    logger: any
  ): Promise<any> {
    logger.info(`Processing ${groups.length} campaign groups using batch stored procedure`);
    
    // Convert groups to JSONB for stored procedure
    const groupsJsonb = JSON.stringify(groups);
    
    // Execute single batch processing stored procedure
    const result = await db.raw(
      `SELECT * FROM campaign_engine.process_campaigns_batch(?::uuid, ?::jsonb)`,
      [processingRunId, groupsJsonb]
    );
    
    return result.rows[0];
  }

  private async buildBatchProcessingResult(
    requestId: string,
    processingRunId: string,
    batchResult: any,
    startTime: Date,
    endTime: Date,
    totalDuration: number
  ): Promise<BatchProcessingResult> {
    // Get processing run summary from database
    const summaryResult = await db.raw(
      `SELECT * FROM campaign_engine.get_processing_run_summary(?::uuid)`,
      [processingRunId]
    );
    
    const summary = summaryResult.rows[0];
    
    // Get campaign results from database
    const campaignResults = await this.resultsRepository.getCampaignResults(processingRunId);
    
    // Get processing errors
    const errors = await this.resultsRepository.getProcessingErrors(processingRunId);
    
    // Get processing statistics
    const statistics = await this.resultsRepository.getProcessingStatistics(processingRunId);
    
    return {
      request_id: requestId,
      processed_count: summary.total_customers || 0,
      success_count: summary.total_customers || 0,
      error_count: summary.total_errors || 0,
      campaign_results: campaignResults.map(cr => ({
        campaign_id: cr.campaign_id,
        campaign_name: cr.campaign_name,
        campaign_group_id: cr.campaign_group_id,
        campaign_group_name: cr.campaign_group_name,
        priority: cr.priority,
        customers_assigned: cr.customers_assigned,
        customers_with_contacts: cr.customers_with_contacts,
        total_contacts_selected: cr.total_contacts_selected,
        processing_duration_ms: cr.processing_duration_ms,
        customer_assignments: [] // Will be loaded on demand
      })),
      errors: errors.map(e => ({
        campaign_id: e.campaign_id,
        error_code: e.error_code,
        error_message: e.error_message
      })),
      processing_summary: statistics || {
        total_customers: summary.total_customers || 0,
        total_campaigns_processed: summary.total_campaigns || 0,
        total_groups_processed: summary.total_groups || 0,
        customers_with_assignments: summary.total_customers || 0,
        customers_without_assignments: 0,
        campaign_assignments_by_group: {},
        most_assigned_campaign: { campaign_id: '', campaign_name: '', assignment_count: 0 },
        total_contacts_selected: summary.total_contacts || 0,
        total_processing_duration_ms: totalDuration,
        total_errors: summary.total_errors || 0,
        error_summary: {
          campaign_errors: summary.total_errors || 0,
          processing_errors: 0,
          most_common_error: 'None'
        },
        performance_metrics: {
          total_database_queries: 1,
          average_query_duration_ms: totalDuration,
          cache_hit_rate: 0,
          customers_per_second: totalDuration > 0 ? (summary.total_customers || 0) / totalDuration * 1000 : 0
        }
      },
      started_at: startTime.toISOString(),
      completed_at: endTime.toISOString(),
      total_duration_ms: totalDuration
    };
  }

  // Removed - all processing now handled in SQL stored procedures

  // Removed - all summary generation now handled in SQL stored procedures

  // Removed - all result storage now handled in SQL stored procedures

  private async publishResultToKafka(requestId: string, result: BatchProcessingResult): Promise<void> {
    try {
      // Simplified Kafka publishing with summary data
      await this.kafkaService.publishCampaignProcessResult({
        requestId: requestId,
        processedCount: result.processed_count,
        results: [], // Detailed results available via API
        errors: result.errors.map(e => ({
          error: e.error_message,
          code: e.error_code
        })),
        timestamp: new Date().toISOString(),
        processingDuration: result.total_duration_ms
      });
    } catch (error) {
      logger.error('Failed to publish result to Kafka:', error);
      // Don't throw here - the processing was successful even if Kafka fails
    }
  }

  // Helper method to preview generated SQL for testing/debugging
  public async previewCampaignSQL(campaign: ProcessingCampaign, assignedCifs: string[] = []): Promise<string> {
    const baseConditions = JSON.stringify(campaign.base_conditions || []);
    const contactRules = JSON.stringify(campaign.contact_selection_rules || []);
    
    const previewQuery = `
      -- Campaign: ${campaign.name}
      -- Priority: ${campaign.priority}
      -- Base Conditions: ${campaign.base_conditions.length}
      -- Contact Rules: ${campaign.contact_selection_rules.length}
      
      SELECT * FROM campaign_engine.process_campaign(
        '${campaign.id}'::uuid,
        '${campaign.id}'::uuid,
        '${baseConditions}'::jsonb,
        '${contactRules}'::jsonb,
        ARRAY[${assignedCifs.map(cif => `'${cif}'`).join(',')}]::text[],
        3
      );
    `;
    
    logger.info('='.repeat(80));
    logger.info('CAMPAIGN SQL PREVIEW');
    logger.info('='.repeat(80));
    logger.info(previewQuery);
    logger.info('='.repeat(80));
    
    return previewQuery;
  }
}