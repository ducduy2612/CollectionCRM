import { 
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
    
    processingLogger.info('Starting parallel campaign processing by campaign groups');

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

      processingLogger.info(`Processing ${groupsToProcess.length} campaign groups in parallel`);

      // Process campaign groups in parallel - one process per group
      const groupResults = await this.processCampaignGroupsInParallel(
        processingRunId,
        groupsToProcess,
        processingLogger
      );

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successfulGroups = groupResults.filter(r => r.success).length;
      const failedGroups = groupResults.filter(r => !r.success).length;

      processingLogger.info(`Parallel processing completed in ${totalDuration}ms`);
      processingLogger.info(`Groups processed: ${successfulGroups} successful, ${failedGroups} failed`);

      // Get processing summary to update run status correctly
      const summary = await this.resultsRepository.getProcessingSummary(processingRunId);

      // Update processing run status with actual processed counts
      await this.resultsRepository.updateProcessingRun(request.request_id, {
        status: 'completed',
        completedAt: new Date(endTime),
        processedCount: summary.total_customers || 0,
        successCount: summary.total_customers || 0,
        errorCount: summary.total_errors || 0,
        totalDurationMs: totalDuration
      });

      // Create simplified result for response
      const result: BatchProcessingResult = {
        request_id: request.request_id,
        processed_count: summary.total_customers || 0,
        success_count: summary.total_customers || 0,
        error_count: summary.total_errors || 0,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString(),
        total_duration_ms: totalDuration
      };

      // Publish result to Kafka with user context
      await this.publishResultToKafka(result, request.requested_by, request.requested_by_id);

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

  private async processCampaignGroupsInParallel(
    processingRunId: string,
    groups: ProcessingCampaignGroup[],
    logger: any
  ): Promise<any[]> {
    logger.info(`Processing ${groups.length} campaign groups in parallel`);
    
    // Process each group in parallel using Promise.all
    const groupPromises = groups.map(async (group, index) => {
      const groupLogger = createLogger({ 
        requestId: processingRunId, 
        groupId: group.id,
        groupName: group.name 
      });
      
      const groupStartTime = Date.now();
      groupLogger.info(`Starting parallel processing for group: ${group.name} (${index + 1}/${groups.length})`);
      
      try {
        // Process single group using stored procedure
        const result = await this.processSingleCampaignGroup(
          processingRunId,
          group,
          groupLogger
        );
        
        const groupDuration = Date.now() - groupStartTime;
        groupLogger.info(`Completed group ${group.name} in ${groupDuration}ms`);
        
        return {
          group_id: group.id,
          group_name: group.name,
          success: true,
          duration_ms: groupDuration,
          result: result
        };
      } catch (error) {
        const groupDuration = Date.now() - groupStartTime;
        groupLogger.error(`Failed to process group ${group.name} after ${groupDuration}ms:`, error);
        
        return {
          group_id: group.id,
          group_name: group.name,
          success: false,
          duration_ms: groupDuration,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        };
      }
    });
    
    // Wait for all groups to complete
    const results = await Promise.all(groupPromises);
    
    const successfulGroups = results.filter(r => r.success).length;
    const failedGroups = results.filter(r => !r.success).length;
    
    logger.info(`Parallel processing summary: ${successfulGroups} successful, ${failedGroups} failed`);
    
    return results;
  }

  private async processSingleCampaignGroup(
    processingRunId: string,
    group: ProcessingCampaignGroup,
    logger: any
  ): Promise<any> {
    logger.info(`Processing campaign group: ${group.name} with ${group.campaigns.length} campaigns`);
    
    // Convert single group to JSONB for stored procedure
    const groupJsonb = JSON.stringify(group);
    
    // Execute batch processing stored procedure for single group
    const result = await db.raw(
      `SELECT * FROM campaign_engine.process_campaigns_batch(?::uuid, ?::jsonb)`,
      [processingRunId, groupJsonb]
    );
    
    return result.rows[0];
  }



  // Removed - all processing now handled in SQL stored procedures

  // Removed - all summary generation now handled in SQL stored procedures

  // Removed - all result storage now handled in SQL stored procedures

  private async publishResultToKafka(result: BatchProcessingResult, requestedBy: string, requestedById: string): Promise<void> {
    try {
      // Publish all available result data to Kafka with user context
      await this.kafkaService.publishCampaignProcessResult({
        ...result,
        requested_by: requestedBy,
        requested_by_id: requestedById,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to publish result to Kafka:', error);
      // Don't throw here - the processing was successful even if Kafka fails
    }
  }
}