import { apiClient } from './client';
import {
  CustomerAction,
  CustomerStatus,
  ActionType,
  ActionSubtype,
  ActionResult,
  StatusDictItem,
  ProcessingSubstateDictItem as ProcessingSubstate,
  WorkflowContactInfo,
  WorkflowPhone,
  WorkflowEmail,
  WorkflowAddress,
  PhoneFormData,
  EmailFormData,
  AddressFormData
} from '../../pages/customers/types';

export interface WorkflowApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

// =============================================
// STATUS HISTORY INTERFACES
// =============================================

export interface StatusHistoryItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  cif: string;
  agentId: string;
  actionDate: string;
  statusId: string;
  stateId?: string;
  substateId?: string;
  notes: string | null;
  agent: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
    employeeId: string;
    name: string;
    email: string;
    phone: string | null;
    type: string;
    team: string;
    isActive: boolean;
    userId: string;
  };
  status?: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    code: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    displayOrder: number;
  };
  state?: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    code: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    displayOrder: number;
  };
  substate?: {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
    code: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    displayOrder: number;
  }
}


export interface StatusHistoryResponse {
  items: StatusHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface RecordStatusRequest {
  cif: string;
  statusId: string;
  stateId?: string;
  substateId?: string;
  actionDate?: string;
  notes?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
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
    console.log('calling workflowApi - getActionSubtypes ' + typeCode);
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

  // Record multiple actions in bulk
  recordBulkActions: async (actions: Array<{
    cif: string;
    loanAccountNumber: string;
    actionTypeId: string;
    actionSubtypeId: string;
    actionResultId: string;
    actionDate?: string;
    promiseDate?: string;
    promiseAmount?: number;
    dueAmount?: number;
    dpd?: number;
    fUpdate?: string;
    notes?: string;
    visitLocation?: any;
  }>): Promise<{
    successful: Array<{
      index: number;
      actionId: string;
      cif: string;
      loanAccountNumber: string;
    }>;
    failed: Array<{
      index: number;
      error: string;
      actionData: any;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> => {
    console.log('calling workflowApi - recordBulkActions');
    const response = await apiClient.post<WorkflowApiResponse<{
      successful: Array<{
        index: number;
        actionId: string;
        cif: string;
        loanAccountNumber: string;
      }>;
      failed: Array<{
        index: number;
        error: string;
        actionData: any;
      }>;
      summary: {
        total: number;
        successful: number;
        failed: number;
      };
    }>>(
      '/workflow/actions/bulk',
      { actions }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record bulk actions');
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
  getAssignmentHistory: async (cif: string): Promise<{ history: any[] }> => {
    const response = await apiClient.get<WorkflowApiResponse<{ history: any[] }>>(
      `/workflow/assignments/history/${cif}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch assignment history');
    }
    
    return response.data.data;
  },

  // =============================================
  // STATUS DICTIONARY API FUNCTIONS
  // =============================================

  // Get customer status options
  getCustomerStatusDict: async (): Promise<StatusDictItem[]> => {
    console.log('calling workflowApi - getCustomerStatusDict');
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
    console.log('calling workflowApi - getCollateralStatusDict');
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
    console.log('calling workflowApi - getProcessingStateDict');
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
    console.log('calling workflowApi - getProcessingSubstateDict');
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
    console.log('calling workflowApi - getLendingViolationStatusDict');
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
    console.log('calling workflowApi - getRecoveryAbilityStatusDict');
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
    console.log('calling workflowApi - getCustomerStatusHistory');
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
    console.log('calling workflowApi - recordCustomerStatus');
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
    console.log('calling workflowApi - getCollateralStatusHistory');
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
    console.log('calling workflowApi - recordCollateralStatus');
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
    console.log('calling workflowApi - getProcessingStateStatusHistory');
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
    console.log('calling workflowApi - recordProcessingStateStatus');
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
    console.log('calling workflowApi - getLendingViolationStatusHistory');
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
    console.log('calling workflowApi - recordLendingViolationStatus');
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
    console.log('calling workflowApi - getRecoveryAbilityStatusHistory');
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
    console.log('calling workflowApi - recordRecoveryAbilityStatus');
    const response = await apiClient.post<WorkflowApiResponse<{ id: string; message: string }>>(
      '/workflow/cases/recovery-ability-status',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to record recovery ability status');
    }
    return response.data.data;
  },

  // =============================================
  // CONTACT INFORMATION API FUNCTIONS
  // =============================================

  // Get all contact information for a customer
  getAllContacts: async (cif: string): Promise<WorkflowContactInfo> => {
    console.log('calling workflowApi - getAllContacts');
    const response = await apiClient.get<WorkflowApiResponse<WorkflowContactInfo>>(
      `/workflow/customers/${cif}/contacts`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch contact information');
    }
    return response.data.data;
  },

  // Phone operations
  createPhone: async (cif: string, phoneData: PhoneFormData): Promise<WorkflowPhone> => {
    console.log('calling workflowApi - createPhone');
    const response = await apiClient.post<WorkflowApiResponse<WorkflowPhone>>(
      `/workflow/customers/${cif}/phones`,
      phoneData
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create phone');
    }
    return response.data.data;
  },

  updatePhone: async (cif: string, phoneId: string, phoneData: Partial<PhoneFormData>): Promise<WorkflowPhone> => {
    console.log('calling workflowApi - updatePhone');
    const response = await apiClient.put<WorkflowApiResponse<WorkflowPhone>>(
      `/workflow/customers/${cif}/phones/${phoneId}`,
      phoneData
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update phone');
    }
    return response.data.data;
  },

  deletePhone: async (cif: string, phoneId: string): Promise<{ deleted: boolean }> => {
    console.log('calling workflowApi - deletePhone');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/customers/${cif}/phones/${phoneId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete phone');
    }
    return response.data.data;
  },

  // Email operations
  createEmail: async (cif: string, emailData: EmailFormData): Promise<WorkflowEmail> => {
    console.log('calling workflowApi - createEmail');
    const response = await apiClient.post<WorkflowApiResponse<WorkflowEmail>>(
      `/workflow/customers/${cif}/emails`,
      emailData
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create email');
    }
    return response.data.data;
  },

  updateEmail: async (cif: string, emailId: string, emailData: Partial<EmailFormData>): Promise<WorkflowEmail> => {
    console.log('calling workflowApi - updateEmail');
    const response = await apiClient.put<WorkflowApiResponse<WorkflowEmail>>(
      `/workflow/customers/${cif}/emails/${emailId}`,
      emailData
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update email');
    }
    return response.data.data;
  },

  deleteEmail: async (cif: string, emailId: string): Promise<{ deleted: boolean }> => {
    console.log('calling workflowApi - deleteEmail');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/customers/${cif}/emails/${emailId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete email');
    }
    return response.data.data;
  },

  // Address operations
  createAddress: async (cif: string, addressData: AddressFormData): Promise<WorkflowAddress> => {
    console.log('calling workflowApi - createAddress');
    const response = await apiClient.post<WorkflowApiResponse<WorkflowAddress>>(
      `/workflow/customers/${cif}/addresses`,
      addressData
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create address');
    }
    return response.data.data;
  },

  updateAddress: async (cif: string, addressId: string, addressData: Partial<AddressFormData>): Promise<WorkflowAddress> => {
    console.log('calling workflowApi - updateAddress');
    const response = await apiClient.put<WorkflowApiResponse<WorkflowAddress>>(
      `/workflow/customers/${cif}/addresses/${addressId}`,
      addressData
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update address');
    }
    return response.data.data;
  },

  deleteAddress: async (cif: string, addressId: string): Promise<{ deleted: boolean }> => {
    console.log('calling workflowApi - deleteAddress');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/customers/${cif}/addresses/${addressId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete address');
    }
    return response.data.data;
  }
};