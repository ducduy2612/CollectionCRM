import { apiClient } from '../client';
import {
  StatusDictItem,
  ProcessingSubstateDictItem as ProcessingSubstate
} from '../../../pages/customers/types';
import {
  WorkflowApiResponse,
  StatusHistoryResponse,
  RecordStatusRequest,
  PaginationParams
} from './types';

export const statusApi = {
  // =============================================
  // STATUS DICTIONARY API FUNCTIONS
  // =============================================

  // Get customer status options
  getCustomerStatusDict: async (): Promise<StatusDictItem[]> => {
    console.log('calling statusApi - getCustomerStatusDict');
    const response = await apiClient.get<WorkflowApiResponse<StatusDictItem[]>>(
      '/workflow/status-dict/customer-status'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer statuses');
    }
    return response.data.data;
  },

  // Get collateral status options
  getCollateralStatusDict: async (): Promise<StatusDictItem[]> => {
    console.log('calling statusApi - getCollateralStatusDict');
    const response = await apiClient.get<WorkflowApiResponse<StatusDictItem[]>>(
      '/workflow/status-dict/collateral-status'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch collateral statuses');
    }
    return response.data.data;
  },

  // Get processing state options
  getProcessingStateDict: async (): Promise<StatusDictItem[]> => {
    console.log('calling statusApi - getProcessingStateDict');
    const response = await apiClient.get<WorkflowApiResponse<StatusDictItem[]>>(
      '/workflow/status-dict/processing-state'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch processing states');
    }
    return response.data.data;
  },

  // Get processing substates for a specific state
  getProcessingSubstateDict: async (stateCode?: string): Promise<ProcessingSubstate[]> => {
    console.log('calling statusApi - getProcessingSubstateDict');
    const endpoint = stateCode
      ? `/workflow/status-dict/processing-state/${stateCode}/substates`
      : '/workflow/status-dict/processing-substate';
    
    const response = await apiClient.get<WorkflowApiResponse<ProcessingSubstate[]>>(endpoint);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch processing substates');
    }
    return response.data.data;
  },

  // Get lending violation status options
  getLendingViolationStatusDict: async (): Promise<StatusDictItem[]> => {
    console.log('calling statusApi - getLendingViolationStatusDict');
    const response = await apiClient.get<WorkflowApiResponse<StatusDictItem[]>>(
      '/workflow/status-dict/lending-violation-status'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch lending violation statuses');
    }
    return response.data.data;
  },

  // Get recovery ability status options
  getRecoveryAbilityStatusDict: async (): Promise<StatusDictItem[]> => {
    console.log('calling statusApi - getRecoveryAbilityStatusDict');
    const response = await apiClient.get<WorkflowApiResponse<StatusDictItem[]>>(
      '/workflow/status-dict/recovery-ability-status'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recovery ability statuses');
    }
    return response.data.data;
  },

  // =============================================
  // STATUS HISTORY API FUNCTIONS
  // =============================================

  // Get customer status history
  getCustomerStatusHistory: async (cif: string, pagination?: PaginationParams): Promise<StatusHistoryResponse> => {
    console.log('calling statusApi - getCustomerStatusHistory');
    const response = await apiClient.get<WorkflowApiResponse<StatusHistoryResponse>>(
      `/workflow/cases/customer-status/${cif}`,
      { params: pagination }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer status history');
    }
    return response.data.data;
  },

  // Record new customer status
  recordCustomerStatus: async (data: RecordStatusRequest): Promise<{ id: string; message: string }> => {
    console.log('calling statusApi - recordCustomerStatus');
    const response = await apiClient.post<WorkflowApiResponse<{ id: string; message: string }>>(
      '/workflow/cases/customer-status',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record customer status');
    }
    return response.data.data;
  },

  // Get collateral status history
  getCollateralStatusHistory: async (cif: string, pagination?: PaginationParams): Promise<StatusHistoryResponse> => {
    console.log('calling statusApi - getCollateralStatusHistory');
    const response = await apiClient.get<WorkflowApiResponse<StatusHistoryResponse>>(
      `/workflow/cases/collateral-status/${cif}`,
      { params: pagination }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch collateral status history');
    }
    return response.data.data;
  },

  // Record new collateral status
  recordCollateralStatus: async (data: RecordStatusRequest): Promise<{ id: string; message: string }> => {
    console.log('calling statusApi - recordCollateralStatus');
    const response = await apiClient.post<WorkflowApiResponse<{ id: string; message: string }>>(
      '/workflow/cases/collateral-status',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record collateral status');
    }
    return response.data.data;
  },

  // Get processing state status history
  getProcessingStateStatusHistory: async (cif: string, pagination?: PaginationParams): Promise<StatusHistoryResponse> => {
    console.log('calling statusApi - getProcessingStateStatusHistory');
    const response = await apiClient.get<WorkflowApiResponse<StatusHistoryResponse>>(
      `/workflow/cases/processing-state-status/${cif}`,
      { params: pagination }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch processing state status history');
    }
    return response.data.data;
  },

  // Record new processing state status
  recordProcessingStateStatus: async (data: RecordStatusRequest): Promise<{ id: string; message: string }> => {
    console.log('calling statusApi - recordProcessingStateStatus');
    const response = await apiClient.post<WorkflowApiResponse<{ id: string; message: string }>>(
      '/workflow/cases/processing-state-status',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record processing state status');
    }
    return response.data.data;
  },

  // Get lending violation status history
  getLendingViolationStatusHistory: async (cif: string, pagination?: PaginationParams): Promise<StatusHistoryResponse> => {
    console.log('calling statusApi - getLendingViolationStatusHistory');
    const response = await apiClient.get<WorkflowApiResponse<StatusHistoryResponse>>(
      `/workflow/cases/lending-violation-status/${cif}`,
      { params: pagination }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch lending violation status history');
    }
    return response.data.data;
  },

  // Record new lending violation status
  recordLendingViolationStatus: async (data: RecordStatusRequest): Promise<{ id: string; message: string }> => {
    console.log('calling statusApi - recordLendingViolationStatus');
    const response = await apiClient.post<WorkflowApiResponse<{ id: string; message: string }>>(
      '/workflow/cases/lending-violation-status',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record lending violation status');
    }
    return response.data.data;
  },

  // Get recovery ability status history
  getRecoveryAbilityStatusHistory: async (cif: string, pagination?: PaginationParams): Promise<StatusHistoryResponse> => {
    console.log('calling statusApi - getRecoveryAbilityStatusHistory');
    const response = await apiClient.get<WorkflowApiResponse<StatusHistoryResponse>>(
      `/workflow/cases/recovery-ability-status/${cif}`,
      { params: pagination }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recovery ability status history');
    }
    return response.data.data;
  },

  // Record new recovery ability status
  recordRecoveryAbilityStatus: async (data: RecordStatusRequest): Promise<{ id: string; message: string }> => {
    console.log('calling statusApi - recordRecoveryAbilityStatus');
    const response = await apiClient.post<WorkflowApiResponse<{ id: string; message: string }>>(
      '/workflow/cases/recovery-ability-status',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record recovery ability status');
    }
    return response.data.data;
  }
};