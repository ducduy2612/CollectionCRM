import { apiClient } from '../client';
import type { 
  ProcessingRequest, 
  ProcessingRun, 
  ProcessingRunsResponse,
  CampaignResult,
  ProcessingStatistics,
  ProcessingError,
  CustomerAssignment,
  SearchAssignmentsRequest
} from './types';

export const processingApi = {
  // Trigger campaign processing
  triggerProcessing: async (request: ProcessingRequest) => {
    console.log('Triggering campaign processing with request:', request);
    const response = await apiClient.post('/campaigns/processing/trigger', request);
    return response.data;
  },

  // Get all processing runs
  getProcessingRuns: async (params?: {
    status?: 'running' | 'completed' | 'failed';
    limit?: number;
    offset?: number;
  }): Promise<ProcessingRunsResponse> => {
    const response = await apiClient.get('/campaigns/processing/runs', { params });
    return response.data;
  },

  // Get specific processing run status
  getProcessingRunStatus: async (id: string): Promise<{ success: boolean; data: ProcessingRun; message: string }> => {
    const response = await apiClient.get(`/campaigns/processing/runs/${id}`);
    return response.data;
  },

  // Get campaign results for a processing run
  getCampaignResults: async (id: string): Promise<{ success: boolean; data: CampaignResult[]; message: string }> => {
    const response = await apiClient.get(`/campaigns/processing/runs/${id}/results`);
    return response.data;
  },

  // Get processing statistics (now returns array of all statistics records)
  getProcessingStatistics: async (id: string): Promise<{ success: boolean; data: ProcessingStatistics[]; message: string }> => {
    const response = await apiClient.get(`/campaigns/processing/runs/${id}/statistics`);
    return response.data;
  },

  // Get processing errors
  getProcessingErrors: async (id: string): Promise<{ success: boolean; data: ProcessingError[]; message: string }> => {
    const response = await apiClient.get(`/campaigns/processing/runs/${id}/errors`);
    return response.data;
  },

  // Get customer assignments for a campaign result
  getCustomerAssignments: async (
    campaignResultId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<{ success: boolean; data: CustomerAssignment[]; message: string }> => {
    const response = await apiClient.get(`/campaigns/processing/results/${campaignResultId}/assignments`, { params });
    return response.data;
  },

  // Search customer assignments
  searchCustomerAssignments: async (
    searchParams: SearchAssignmentsRequest
  ): Promise<{ success: boolean; data: CustomerAssignment[]; message: string }> => {
    const response = await apiClient.get('/campaigns/processing/assignments/search', { params: searchParams });
    return response.data;
  },

  // Get processing summary
  getProcessingSummary: async (id: string): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await apiClient.get(`/campaigns/processing/runs/${id}/summary`);
    return response.data;
  }
};