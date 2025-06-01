import { apiClient } from './client';
import { CustomerAction, CustomerStatus } from '../../pages/customers/types';
import { ActionType, ActionSubtype, ActionResult } from '../../types/action-config';

export interface WorkflowApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

export interface ActionsResponse {
  actions: CustomerAction[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface CaseStatusResponse {
  caseStatus: string;
  activeCases: number;
  lastActivity: string;
}

export interface CasesResponse {
  cases: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface AssignmentsResponse {
  assignments: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export const workflowApi = {
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
    console.log('calling workflowApi - getCustomerActions');
    const response = await apiClient.get<WorkflowApiResponse<ActionsResponse>>(
      `/workflow/actions/customer/${cif}`,
      { params }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer actions');
    }
    
    return response.data.data;
  },

  // Get action types
  getActionTypes: async (): Promise<ActionType[]> => {
    console.log('calling workflowApi - getActionTypes');
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
    console.log('calling workflowApi - getActionSubtypes');
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
    console.log('calling workflowApi - getActionResults');
    const response = await apiClient.get<WorkflowApiResponse<ActionResult[]>>(
      `/workflow/actions/action-config/subtypes/${subtypeCode}/results`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action results');
    }
    return response.data.data;
  },

  // Get customer case status
  getCustomerCaseStatus: async (cif: string): Promise<CaseStatusResponse> => {
    const response = await apiClient.get<WorkflowApiResponse<CaseStatusResponse>>(
      `/workflow/cases/status/${cif}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer case status');
    }
    
    return response.data.data;
  },

  // Get customer case history
  getCustomerCaseHistory: async (cif: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<CasesResponse> => {
    const response = await apiClient.get<WorkflowApiResponse<CasesResponse>>(
      `/workflow/cases/customer/${cif}`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer case history');
    }
    
    return response.data.data;
  },

  // Record a case action
  recordCaseAction: async (data: {
    cif: string;
    type: 'CALL' | 'SMS' | 'EMAIL' | 'VISIT' | 'PAYMENT' | 'NOTE';
    subtype?: string;
    actionResult: string;
    actionDate?: string;
    notes?: string;
    customerStatus?: string;
    collateralStatus?: string;
    processingStateStatus?: string;
    lendingViolationStatus?: string;
    recoveryAbilityStatus?: string;
  }): Promise<CustomerAction> => {
    const response = await apiClient.post<WorkflowApiResponse<CustomerAction>>(
      '/workflow/actions',
      data
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record case action');
    }
    
    return response.data.data;
  },

  // Update customer status
  updateCustomerStatus: async (cif: string, status: CustomerStatus): Promise<void> => {
    const response = await apiClient.post<WorkflowApiResponse<any>>(
      '/workflow/cases',
      {
        cif,
        customerStatus: status.customerStatus,
        collateralStatus: status.collateralStatus,
        processingStateStatus: status.processingState,
        lendingViolationStatus: status.lendingViolation,
        recoveryAbilityStatus: status.recoveryAbility
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update customer status');
    }
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
  getAssignmentHistory: async (cif: string): Promise<{ history: any[] }> => {
    const response = await apiClient.get<WorkflowApiResponse<{ history: any[] }>>(
      `/workflow/assignments/history/${cif}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch assignment history');
    }
    
    return response.data.data;
  }
};