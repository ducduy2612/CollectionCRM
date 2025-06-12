import { apiClient } from '../client';
import {
  ActionType,
  ActionSubtype,
  ActionResult
} from '../../../pages/customers/types';
import {
  WorkflowApiResponse,
  ActionsResponse,
  BulkActionRequest,
  BulkActionResponse
} from './types';

export const actionsApi = {
  // Get customer actions
  getCustomerActions: async (cif: string, params?: {
    loanAccountNumber?: string;
    agentName?: string;
    actionType?: string;
    actionSubtype?: string;
    actionResult?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ActionsResponse> => {
    console.log('calling actionsApi - getCustomerActions');
    const response = await apiClient.get<WorkflowApiResponse<ActionsResponse>>(
      `/workflow/actions/customer/${cif}`,
      { params }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer actions');
    }
    
    return response.data.data;
  },

  // Get agent actions
  getAgentActions: async (agentId: string, params?: {
    cif?: string;
    loanAccountNumber?: string;
    actionType?: string;
    actionSubtype?: string;
    actionResult?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ActionsResponse> => {
    console.log('calling actionsApi - getAgentActions');
    const response = await apiClient.get<WorkflowApiResponse<ActionsResponse>>(
      `/workflow/actions/agent/${agentId}`,
      { params }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch agent actions');
    }
    
    return response.data.data;
  },

  // Get action types
  getActionTypes: async (): Promise<ActionType[]> => {
    console.log('calling actionsApi - getActionTypes');
    const response = await apiClient.get<WorkflowApiResponse<ActionType[]>>(
      '/workflow/actions/action-config/action-types'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action types');
    }
    return response.data.data;
  },

  // Get action subtypes for a type
  getActionSubtypes: async (typeCode: string): Promise<ActionSubtype[]> => {
    console.log('calling actionsApi - getActionSubtypes ' + typeCode);
    const response = await apiClient.get<WorkflowApiResponse<ActionSubtype[]>>(
      `/workflow/actions/action-config/types/${typeCode}/subtypes`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action subtypes');
    }
    return response.data.data;
  },

  // Get action results for a subtype
  getActionResults: async (subtypeCode: string): Promise<ActionResult[]> => {
    console.log('calling actionsApi - getActionResults');
    const response = await apiClient.get<WorkflowApiResponse<ActionResult[]>>(
      `/workflow/actions/action-config/subtypes/${subtypeCode}/results`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action results');
    }
    return response.data.data;
  },

  // Record multiple actions in bulk
  recordBulkActions: async (actions: BulkActionRequest[]): Promise<BulkActionResponse> => {
    console.log('calling actionsApi - recordBulkActions');
    const response = await apiClient.post<WorkflowApiResponse<BulkActionResponse>>(
      '/workflow/actions/bulk',
      { actions }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record bulk actions');
    }
    
    return response.data.data;
  }
};