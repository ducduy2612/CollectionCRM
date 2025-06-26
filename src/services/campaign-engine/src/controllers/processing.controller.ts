import { Request, Response } from 'express';
import { ProcessingService } from '../services/processing.service';
import { ProcessingResultsRepository } from '../repositories/processing-results.repository';
import { BatchProcessingRequest } from '../models/processing.models';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ProcessingController {
  private processingService: ProcessingService;
  private resultsRepository: ProcessingResultsRepository;

  constructor() {
    this.processingService = new ProcessingService();
    this.resultsRepository = new ProcessingResultsRepository();
  }

  // Trigger campaign processing
  async triggerProcessing(req: Request, res: Response): Promise<void> {
    try {
      const { campaign_group_ids, processing_options } = req.body;
      
      // Generate unique request ID
      const requestId = uuidv4();
      
      // Create processing request
      const processingRequest: BatchProcessingRequest = {
        request_id: requestId,
        campaign_group_ids: campaign_group_ids || null,
        requested_by: 'system', // TODO: Extract from auth context
        processing_options: processing_options || {
          parallel_processing: false,
          max_contacts_per_customer: 3
        }
      };

      // Start processing asynchronously
      res.status(202).json({
        success: true,
        data: {
          request_id: requestId,
          status: 'processing',
          message: 'Campaign processing started'
        },
        message: 'Processing request accepted'
      });

      // Process in background
      this.processingService.processBatchRequest(processingRequest)
        .then(_result => {
          logger.info(`Processing completed for request ${requestId}`);
        })
        .catch(error => {
          logger.error(`Processing failed for request ${requestId}:`, error);
        });

    } catch (error) {
      logger.error('Error triggering campaign processing:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to trigger campaign processing',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get processing run status
  async getProcessingRunStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const run = await this.resultsRepository.getProcessingRun(id);
      
      if (!run) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Processing run not found',
          errors: [{ code: 'NOT_FOUND', message: 'Processing run not found' }]
        });
        return;
      }

      res.json({
        success: true,
        data: run,
        message: 'Processing run retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting processing run:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve processing run',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get all processing runs
  async getProcessingRuns(req: Request, res: Response): Promise<void> {
    try {
      const { status, limit = 20, offset = 0 } = req.query;
      
      const runs = await this.resultsRepository.getProcessingRuns({
        status: status as string,
        limit: Number(limit),
        offset: Number(offset)
      });

      res.json({
        success: true,
        data: runs,
        message: 'Processing runs retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting processing runs:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve processing runs',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get campaign results for a processing run
  async getCampaignResults(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const results = await this.resultsRepository.getCampaignResults(id);

      res.json({
        success: true,
        data: results,
        message: 'Campaign results retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign results:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign results',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get customer assignments for a campaign result
  async getCustomerAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { campaignResultId } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      
      const assignments = await this.resultsRepository.getCustomerAssignments(
        campaignResultId,
        Number(limit),
        Number(offset)
      );

      res.json({
        success: true,
        data: assignments,
        message: 'Customer assignments retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting customer assignments:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve customer assignments',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get processing statistics
  async getProcessingStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const statistics = await this.resultsRepository.getProcessingStatistics(id);
      
      if (!statistics) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Processing statistics not found',
          errors: [{ code: 'NOT_FOUND', message: 'Processing statistics not found' }]
        });
        return;
      }

      res.json({
        success: true,
        data: statistics,
        message: 'Processing statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting processing statistics:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve processing statistics',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get processing errors
  async getProcessingErrors(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const errors = await this.resultsRepository.getProcessingErrors(id);

      res.json({
        success: true,
        data: errors,
        message: 'Processing errors retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting processing errors:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve processing errors',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Search customer assignments
  async searchCustomerAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { cif, processing_run_id } = req.query;
      
      if (!cif) {
        res.status(400).json({
          success: false,
          data: null,
          message: 'CIF is required',
          errors: [{ code: 'VALIDATION_ERROR', message: 'CIF is required' }]
        });
        return;
      }

      const assignments = await this.resultsRepository.searchCustomerAssignments({
        cif: cif as string,
        processingRunId: processing_run_id as string
      });

      res.json({
        success: true,
        data: assignments,
        message: 'Customer assignments retrieved successfully'
      });
    } catch (error) {
      logger.error('Error searching customer assignments:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to search customer assignments',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }
}