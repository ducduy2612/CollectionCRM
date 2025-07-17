import { apiClient } from '../client';
import {
  CampaignApiResponse,
  CustomField,
  CreateCustomFieldRequest
} from './types';

export const customFieldsApi = {
  // Get all custom fields
  getCustomFields: async (): Promise<CustomField[]> => {
    const response = await apiClient.get<CampaignApiResponse<CustomField[]>>(
      '/campaigns/config/custom-fields'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch custom fields');
    }
    
    return response.data.data;
  },

  // Create new custom field
  createCustomField: async (data: CreateCustomFieldRequest): Promise<CustomField> => {
    const response = await apiClient.post<CampaignApiResponse<CustomField>>(
      '/campaigns/config/custom-fields',
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create custom field');
    }
    
    return response.data.data;
  },

  // Delete custom field
  deleteCustomField: async (id: string): Promise<void> => {
    const response = await apiClient.delete<CampaignApiResponse<null>>(
      `/campaigns/config/custom-fields/${id}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete custom field');
    }
  }
};