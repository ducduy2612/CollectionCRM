import { apiClient } from '../client';
import {
  WorkflowApiResponse,
  AgentInfo,
  AssignmentsResponse,
  AssignmentHistoryResponse,
  BulkAssignmentResponse
} from './types';

export const agentsApi = {
  // Get agent by user ID
  getAgentByUserId: async (userId: string): Promise<AgentInfo> => {
    const response = await apiClient.get<WorkflowApiResponse<AgentInfo>>(
      `/workflow/agents/by-user/${userId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch agent by user ID');
    }
    
    return response.data.data;
  },

  // Get agent assignments
  getAgentAssignments: async (agentId: string, params?: {
    cif?: string;
    isCurrent?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AssignmentsResponse> => {
    const response = await apiClient.get<WorkflowApiResponse<AssignmentsResponse>>(
      `/workflow/assignments/agent/${agentId}`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch agent assignments');
    }
    
    return response.data.data;
  },

  // Get assignment history for a customer
  getAssignmentHistory: async (cif: string): Promise<AssignmentHistoryResponse> => {
    const response = await apiClient.get<WorkflowApiResponse<AssignmentHistoryResponse>>(
      `/workflow/assignments/history/${cif}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch assignment history');
    }
    
    return response.data.data;
  },

  // Create bulk assignments from CSV
  createBulkAssignments: async (file: File): Promise<BulkAssignmentResponse> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    const response = await apiClient.post<WorkflowApiResponse<BulkAssignmentResponse>>(
      '/workflow/assignments/bulk',
      formData,
      {
        headers: {
          'Content-Type': undefined, // Let browser set multipart/form-data with boundary
        },
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create bulk assignments');
    }
    
    return response.data.data;
  }
};