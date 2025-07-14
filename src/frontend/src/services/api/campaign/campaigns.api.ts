import { apiClient } from '../client';
import {
  CampaignApiResponse,
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  BaseCondition,
  ContactSelectionRule
} from './types';

export const campaignsApi = {
  // Get campaigns (optionally filtered by campaign group)
  getCampaigns: async (campaignGroupId?: string): Promise<Campaign[]> => {
    const params = campaignGroupId ? { campaign_group_id: campaignGroupId } : {};
    
    const response = await apiClient.get<CampaignApiResponse<Campaign[]>>(
      '/campaigns',
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaigns');
    }
    
    return response.data.data;
  },

  // Get campaign by ID
  getCampaignById: async (id: string): Promise<Campaign> => {
    const response = await apiClient.get<CampaignApiResponse<Campaign>>(
      `/campaigns/${id}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaign');
    }
    
    return response.data.data;
  },

  // Create new campaign
  createCampaign: async (data: CreateCampaignRequest): Promise<Campaign> => {
    const response = await apiClient.post<CampaignApiResponse<Campaign>>(
      '/campaigns',
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create campaign');
    }
    
    return response.data.data;
  },

  // Update campaign
  updateCampaign: async (id: string, data: UpdateCampaignRequest): Promise<Campaign> => {
    const response = await apiClient.put<CampaignApiResponse<Campaign>>(
      `/campaigns/${id}`,
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update campaign');
    }
    
    return response.data.data;
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<void> => {
    const response = await apiClient.delete<CampaignApiResponse<void>>(
      `/campaigns/${id}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete campaign');
    }
  },

  // Get campaign base conditions
  getCampaignConditions: async (campaignId: string): Promise<BaseCondition[]> => {
    const response = await apiClient.get<CampaignApiResponse<BaseCondition[]>>(
      `/campaigns/${campaignId}/conditions`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaign conditions');
    }
    
    return response.data.data;
  },

  // Get campaign contact selection rules
  getCampaignContactRules: async (campaignId: string): Promise<ContactSelectionRule[]> => {
    const response = await apiClient.get<CampaignApiResponse<ContactSelectionRule[]>>(
      `/campaigns/${campaignId}/contact-rules`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaign contact rules');
    }
    
    return response.data.data;
  },

  // Get queue statistics
  getQueueStatistics: async (): Promise<{
    activeQueues: number;
    totalCampaigns: number;
    campaignGroups: number;
  }> => {
    const response = await apiClient.get<CampaignApiResponse<{
      activeQueues: number;
      totalCampaigns: number;
      campaignGroups: number;
    }>>('/campaigns/stats/queue');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch queue statistics');
    }
    
    return response.data.data;
  }
};