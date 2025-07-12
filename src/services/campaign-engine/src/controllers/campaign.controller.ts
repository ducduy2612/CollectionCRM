import { Request, Response } from 'express';
import { CampaignRepository } from '../repositories/campaign.repository';
import { KafkaService } from '../services/kafka.service';
import { BankSyncService } from '../services/bank-sync.service';
import { logger } from '../utils/logger';
import { DATA_SOURCE_FIELDS } from '../models/processing.models';

export class CampaignController {
  private campaignRepository: CampaignRepository;
  private kafkaService: KafkaService;
  private bankSyncService: BankSyncService;

  constructor() {
    this.campaignRepository = new CampaignRepository();
    this.kafkaService = KafkaService.getInstance();
    this.bankSyncService = new BankSyncService();
  }

  // Campaign Groups
  async getCampaignGroups(_req: Request, res: Response): Promise<void> {
    try {
      const groups = await this.campaignRepository.getCampaignGroups();
      res.json({
        success: true,
        data: groups,
        message: 'Campaign groups retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign groups:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign groups',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async getCampaignGroupById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const group = await this.campaignRepository.getCampaignGroupById(id);
      
      if (!group) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Campaign group not found',
          errors: [{ code: 'NOT_FOUND', message: 'Campaign group not found' }]
        });
        return;
      }

      res.json({
        success: true,
        data: group,
        message: 'Campaign group retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign group:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign group',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async createCampaignGroup(req: Request, res: Response): Promise<void> {
    try {
      const group = await this.campaignRepository.createCampaignGroup(req.body);
      
      // Publish event
      await this.kafkaService.publishCampaignEvent('created', {
        type: 'campaign_group',
        id: group.id,
        name: group.name
      }, {
        userId: req.user?.id || 'system',
        username: req.user?.username || 'system'
      });

      res.status(201).json({
        success: true,
        data: group,
        message: 'Campaign group created successfully'
      });
    } catch (error) {
      logger.error('Error creating campaign group:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to create campaign group',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async updateCampaignGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const group = await this.campaignRepository.updateCampaignGroup(id, req.body);
      
      if (!group) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Campaign group not found',
          errors: [{ code: 'NOT_FOUND', message: 'Campaign group not found' }]
        });
        return;
      }

      // Publish event
      await this.kafkaService.publishCampaignEvent('updated', {
        type: 'campaign_group',
        id: group.id,
        name: group.name
      }, {
        userId: req.user?.id || 'system',
        username: req.user?.username || 'system'
      });

      res.json({
        success: true,
        data: group,
        message: 'Campaign group updated successfully'
      });
    } catch (error) {
      logger.error('Error updating campaign group:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to update campaign group',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async deleteCampaignGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.campaignRepository.deleteCampaignGroup(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Campaign group not found',
          errors: [{ code: 'NOT_FOUND', message: 'Campaign group not found' }]
        });
        return;
      }

      // Publish event
      await this.kafkaService.publishCampaignEvent('deleted', {
        type: 'campaign_group',
        id
      }, {
        userId: req.user?.id || 'system',
        username: req.user?.username || 'system'
      });

      res.json({
        success: true,
        data: null,
        message: 'Campaign group deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting campaign group:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to delete campaign group',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Campaigns
  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { campaign_group_id } = req.query;
      const campaigns = await this.campaignRepository.getCampaigns(campaign_group_id as string);
      
      res.json({
        success: true,
        data: campaigns,
        message: 'Campaigns retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaigns',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async getCampaignById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await this.campaignRepository.getCampaignById(id);
      
      if (!campaign) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Campaign not found',
          errors: [{ code: 'NOT_FOUND', message: 'Campaign not found' }]
        });
        return;
      }

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const campaign = await this.campaignRepository.createCampaign(req.body);

      // Publish event
      await this.kafkaService.publishCampaignEvent('created', {
        type: 'campaign',
        id: campaign.id,
        name: campaign.name,
        campaign_group_id: campaign.campaign_group_id,
        campaign_details: req.body,
        priority: campaign.priority
      }, {
        userId: req.user?.id || 'system',
        username: req.user?.username || 'system'
      });

      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      logger.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to create campaign',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await this.campaignRepository.updateCampaign(id, req.body);
      
      if (!campaign) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Campaign not found',
          errors: [{ code: 'NOT_FOUND', message: 'Campaign not found' }]
        });
        return;
      }

      // Publish event
      await this.kafkaService.publishCampaignEvent('updated', {
        type: 'campaign',
        id: campaign.id,
        name: campaign.name,
        campaign_group_id: campaign.campaign_group_id,
        campaign_details: req.body,
        priority: campaign.priority
      }, {
        userId: req.user?.id || 'system',
        username: req.user?.username || 'system'
      });

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign updated successfully'
      });
    } catch (error) {
      console.error('FULL ERROR DETAILS:', error);
      logger.error('Error updating campaign:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        campaignId: req.params.id,
        requestBody: req.body
      });
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to update campaign',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.campaignRepository.deleteCampaign(id);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          data: null,
          message: 'Campaign not found',
          errors: [{ code: 'NOT_FOUND', message: 'Campaign not found' }]
        });
        return;
      }

      // Publish event
      await this.kafkaService.publishCampaignEvent('deleted', {
        type: 'campaign',
        id
      }, {
        userId: req.user?.id || 'system',
        username: req.user?.username || 'system'
      });

      res.json({
        success: true,
        data: null,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to delete campaign',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Campaign Details
  async getCampaignConditions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info(`Getting conditions for campaign ${id}`);
      
      const conditions = await this.campaignRepository.getBaseConditions(id);
      
      logger.info(`Found ${conditions.length} conditions for campaign ${id}`);
      
      res.json({
        success: true,
        data: conditions,
        message: 'Campaign conditions retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign conditions:', error);
      logger.error('Stack trace:', (error as Error).stack);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign conditions',
        errors: [{ code: 'INTERNAL_ERROR', message: (error as Error).message || 'An unexpected error occurred' }]
      });
    }
  }

  async getCampaignContactRules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rules = await this.campaignRepository.getContactSelectionRules(id);
      
      res.json({
        success: true,
        data: rules,
        message: 'Campaign contact rules retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign contact rules:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign contact rules',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Custom Fields
  async getCustomFields(_req: Request, res: Response): Promise<void> {
    try {
      const fields = await this.campaignRepository.getCustomFields();
      
      res.json({
        success: true,
        data: fields,
        message: 'Custom fields retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting custom fields:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve custom fields',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async createCustomField(req: Request, res: Response): Promise<void> {
    try {
      const field = await this.campaignRepository.createCustomField(req.body);
      
      res.status(201).json({
        success: true,
        data: field,
        message: 'Custom field created successfully'
      });
    } catch (error) {
      logger.error('Error creating custom field:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to create custom field',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  // Configuration
  async getDataSources(_req: Request, res: Response): Promise<void> {
    try {
      const dataSources = [];
      
      // Add static data sources
      for (const [sourceName, staticFields] of Object.entries(DATA_SOURCE_FIELDS)) {
        if (sourceName === 'custom_fields') {
          // For custom_fields, get dynamic fields from database
          const customFields = await this.campaignRepository.getCustomFields();
          dataSources.push({
            name: sourceName,
            fields: customFields.map(field => field.field_name)
          });
        } else {
          // For other sources, use static fields
          dataSources.push({
            name: sourceName,
            fields: staticFields
          });
        }
      }

      res.json({
        success: true,
        data: dataSources,
        message: 'Data sources retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting data sources:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve data sources',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async getOperators(_req: Request, res: Response): Promise<void> {
    try {
      const operators = [
        { value: '=', label: 'Equals' },
        { value: '!=', label: 'Not Equals' },
        { value: '>', label: 'Greater Than' },
        { value: '>=', label: 'Greater Than or Equal' },
        { value: '<', label: 'Less Than' },
        { value: '<=', label: 'Less Than or Equal' },
        { value: 'LIKE', label: 'Contains' },
        { value: 'NOT_LIKE', label: 'Does Not Contain' },
        { value: 'IN', label: 'In List' },
        { value: 'NOT_IN', label: 'Not In List' },
        { value: 'IS_NULL', label: 'Is Empty' },
        { value: 'IS_NOT_NULL', label: 'Is Not Empty' }
      ];

      res.json({
        success: true,
        data: operators,
        message: 'Operators retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting operators:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve operators',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async getContactTypes(_req: Request, res: Response): Promise<void> {
    try {
      logger.info('Getting contact types from bank-sync-service');
      const contactTypes = await this.bankSyncService.getPhoneTypes();

      res.json({
        success: true,
        data: contactTypes,
        message: 'Contact types retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting contact types:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve contact types',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async getRelatedPartyTypes(_req: Request, res: Response): Promise<void> {
    try {
      const relatedPartyTypes = [
        { value: 'customer', label: 'Customer' },
        { value: 'reference', label: 'Reference (use relationship_patterns for filtering)' }
      ];

      res.json({
        success: true,
        data: relatedPartyTypes,
        message: 'Related party types retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting related party types:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve related party types',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }

  async getCampaignConfiguration(_req: Request, res: Response): Promise<void> {
    try {
      const config = await this.campaignRepository.getCampaignConfiguration();
      
      res.json({
        success: true,
        data: config,
        message: 'Campaign configuration retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting campaign configuration:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve campaign configuration',
        errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
      });
    }
  }
}