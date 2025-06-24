import { apiClient } from '../client';
import {
  CampaignApiResponse,
  CampaignGroup,
  CreateCampaignGroupRequest,
  UpdateCampaignGroupRequest
} from './types';

export const campaignGroupsApi = {
  // Get all campaign groups
  getCampaignGroups: async (): Promise<CampaignGroup[]> => {
    const response = await apiClient.get<CampaignApiResponse<CampaignGroup[]>>(
      '/campaigns/groups'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaign groups');
    }
    
    return response.data.data;
  },

  // Get campaign group by ID
  getCampaignGroupById: async (id: string): Promise<CampaignGroup> => {
    const response = await apiClient.get<CampaignApiResponse<CampaignGroup>>(
      `/campaigns/groups/${id}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaign group');
    }
    
    return response.data.data;
  },

  // Create new campaign group
  createCampaignGroup: async (data: CreateCampaignGroupRequest): Promise<CampaignGroup> => {
    const response = await apiClient.post<CampaignApiResponse<CampaignGroup>>(
      '/campaigns/groups',
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create campaign group');
    }
    
    return response.data.data;
  },

  // Update campaign group
  updateCampaignGroup: async (id: string, data: UpdateCampaignGroupRequest): Promise<CampaignGroup> => {
    const response = await apiClient.put<CampaignApiResponse<CampaignGroup>>(
      `/campaigns/groups/${id}`,
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update campaign group');
    }
    
    return response.data.data;
  },

  // Delete campaign group
  deleteCampaignGroup: async (id: string): Promise<void> => {
    const response = await apiClient.delete<CampaignApiResponse<void>>(
      `/campaigns/groups/${id}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete campaign group');
    }
  }
};