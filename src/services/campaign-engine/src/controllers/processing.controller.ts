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
        requested_by: req.user?.username || 'system',
        requested_by_id: req.user?.id || 'system',
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

  // Get processing summary
  async getProcessingSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const summary = await this.resultsRepository.getProcessingSummary(id);
      
      if (!summary || !summary.request_id) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Processing summary not found',
          errors: [{ code: 'NOT_FOUND', message: 'Processing summary not found' }]
        });
        return;
      }

      res.json({
        success: true,
        data: summary,
        message: 'Processing summary retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting processing summary:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve processing summary',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Get selected contacts for a processing run
  async getSelectedContacts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const acceptHeader = req.headers.accept || '';
      
      const contacts = await this.resultsRepository.getSelectedContactsByRun(id);

      // Check if CSV format is requested
      if (acceptHeader.includes('text/csv')) {
        // Generate CSV
        const csvHeaders = [
          'campaign_group_name',
          'campaign_name',
          'campaign_priority',
          'cif',
          'contact_type',
          'contact_value',
          'related_party_type',
          'related_party_cif',
          'related_party_name',
          'relationship_type',
          'is_primary',
          'is_verified',
          'contact_source'
        ];

        // Create CSV content
        let csvContent = csvHeaders.join(',') + '\n';
        
        for (const contact of contacts) {
          const row = [
            contact.campaign_group_name || '',
            contact.campaign_name || '',
            contact.campaign_priority || '',
            contact.cif || '',
            contact.contact_type || '',
            contact.contact_value || '',
            contact.related_party_type || '',
            contact.related_party_cif || '',
            contact.related_party_name || '',
            contact.relationship_type || '',
            contact.is_primary ? 'Yes' : 'No',
            contact.is_verified ? 'Yes' : 'No',
            contact.contact_source || ''
          ];
          
          // Escape values that contain commas or quotes
          const escapedRow = row.map(value => {
            const strValue = String(value);
            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          });
          
          csvContent += escapedRow.join(',') + '\n';
        }

        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="campaign_contacts_${id}_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: contacts,
          message: 'Selected contacts retrieved successfully'
        });
      }
    } catch (error) {
      logger.error('Error getting selected contacts:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve selected contacts',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }
}