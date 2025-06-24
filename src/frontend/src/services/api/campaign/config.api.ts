import { apiClient } from '../client';
import {
  CampaignApiResponse,
  DataSource,
  DataSourcesResponse,
  Operator,
  OperatorsResponse,
  ContactType,
  ContactTypesResponse,
  RelatedPartyType,
  RelatedPartyTypesResponse,
  CampaignConfiguration,
  CampaignConfigurationResponse
} from './types';

export const configApi = {
  // Get available data sources
  getDataSources: async (): Promise<DataSource[]> => {
    const response = await apiClient.get<CampaignApiResponse<any[]>>(
      '/campaigns/config/data-sources'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch data sources');
    }
    
    // Transform backend format to frontend format
    return response.data.data.map((source: any) => ({
      value: source.name,
      label: source.name,
      fields: source.fields
    }));
  },

  // Get available operators
  getOperators: async (): Promise<Operator[]> => {
    const response = await apiClient.get<CampaignApiResponse<Operator[]>>(
      '/campaigns/config/operators'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch operators');
    }
    
    return response.data.data;
  },

  // Get available contact types
  getContactTypes: async (): Promise<ContactType[]> => {
    const response = await apiClient.get<CampaignApiResponse<ContactType[]>>(
      '/campaigns/config/contact-types'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch contact types');
    }
    
    return response.data.data;
  },

  // Get available related party types
  getRelatedPartyTypes: async (): Promise<RelatedPartyType[]> => {
    const response = await apiClient.get<CampaignApiResponse<RelatedPartyType[]>>(
      '/campaigns/config/related-party-types'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch related party types');
    }
    
    return response.data.data;
  },

  // Get complete campaign configuration for processing
  getCampaignConfiguration: async (): Promise<CampaignConfiguration> => {
    const response = await apiClient.get<CampaignApiResponse<CampaignConfigurationResponse>>(
      '/campaigns/config/processing'
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch campaign configuration');
    }
    
    return response.data.data.configuration;
  }
};