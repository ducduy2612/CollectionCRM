import { apiClient } from '../client';
import { WorkflowApiResponse } from './types';

// Customer Status Types
export interface CustomerStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface CustomerStatusConfig {
  code: string;
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}

export interface CustomerStatusUsageItem {
  config_type: 'CUSTOMER_STATUS';
  config_code: string;
  config_name: string;
  is_active: boolean;
  usage_count: string;
  can_be_deactivated: boolean;
}

export type CustomerStatusUsageStats = CustomerStatusUsageItem[];

// Collateral Status Types
export interface CollateralStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface CollateralStatusConfig {
  code: string;
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}

export interface CollateralStatusUsageItem {
  config_type: 'COLLATERAL_STATUS';
  config_code: string;
  config_name: string;
  is_active: boolean;
  usage_count: string;
  can_be_deactivated: boolean;
}

export type CollateralStatusUsageStats = CollateralStatusUsageItem[];

// Lending Violation Status Types
export interface LendingViolationStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface LendingViolationStatusConfig {
  code: string;
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}

export interface LendingViolationStatusUsageItem {
  config_type: 'LENDING_VIOLATION_STATUS';
  config_code: string;
  config_name: string;
  is_active: boolean;
  usage_count: string;
  can_be_deactivated: boolean;
}

export type LendingViolationStatusUsageStats = LendingViolationStatusUsageItem[];

// Recovery Ability Status Types
export interface RecoveryAbilityStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface RecoveryAbilityStatusConfig {
  code: string;
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}

export interface RecoveryAbilityStatusUsageItem {
  config_type: 'RECOVERY_ABILITY_STATUS';
  config_code: string;
  config_name: string;
  is_active: boolean;
  usage_count: string;
  can_be_deactivated: boolean;
}

export type RecoveryAbilityStatusUsageStats = RecoveryAbilityStatusUsageItem[];

// Processing State Types
export interface ProcessingState {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ProcessingStateConfig {
  code: string;
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}

// Processing Substate Types
export interface ProcessingSubstate {
  id: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ProcessingSubstateConfig {
  code: string;
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}

// State-Substate Mapping Types
export interface StateSubstateMapping {
  id: string;
  stateCode: string;
  substateCode: string;
  created_at: string;
  created_by: string;
}

export const statusDictApi = {
  // Customer Status Management
  getCustomerStatuses: async (includeInactive: boolean = false): Promise<any[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<WorkflowApiResponse<CustomerStatus[]>>(
      `/workflow/status-dict/customer-status${params}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer statuses');
    }
    return response.data.data;
  },

  addCustomerStatus: async (config: CustomerStatusConfig): Promise<CustomerStatus> => {
    const response = await apiClient.post<WorkflowApiResponse<CustomerStatus>>(
      '/workflow/status-dict/customer-status',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add customer status');
    }
    return response.data.data;
  },

  updateCustomerStatus: async (code: string, config: Partial<CustomerStatusConfig>): Promise<CustomerStatus> => {
    const response = await apiClient.put<WorkflowApiResponse<CustomerStatus>>(
      `/workflow/status-dict/customer-status/${code}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update customer status');
    }
    return response.data.data;
  },

  deactivateCustomerStatus: async (code: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ code: string; deactivated: boolean }>>(
        `/workflow/status-dict/customer-status/${code}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate customer status');
      }
      return { success: response.data.data.deactivated };
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate customer status');
      }
    }
  },

  // Find specific customer status
  findCustomerStatusByCode: async (code: string): Promise<CustomerStatus | null> => {
    const response = await apiClient.get<WorkflowApiResponse<CustomerStatus>>(
      `/workflow/status-dict/find/customer/${code}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to find customer status');
    }
    return response.data.data;
  },

  // Usage Statistics
  getCustomerStatusUsageStats: async (): Promise<CustomerStatusUsageStats> => {
    const response = await apiClient.get<WorkflowApiResponse<CustomerStatusUsageStats>>(
      '/workflow/status-dict/usage-stats'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer status usage statistics');
    }
    // Filter for customer status items only
    return response.data.data.filter(item => item.config_type === 'CUSTOMER_STATUS');
  },

  // Collateral Status Management
  getCollateralStatuses: async (includeInactive: boolean = false): Promise<any[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<WorkflowApiResponse<CollateralStatus[]>>(
      `/workflow/status-dict/collateral-status${params}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch collateral statuses');
    }
    return response.data.data;
  },

  addCollateralStatus: async (config: CollateralStatusConfig): Promise<CollateralStatus> => {
    const response = await apiClient.post<WorkflowApiResponse<CollateralStatus>>(
      '/workflow/status-dict/collateral-status',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add collateral status');
    }
    return response.data.data;
  },

  updateCollateralStatus: async (code: string, config: Partial<CollateralStatusConfig>): Promise<CollateralStatus> => {
    const response = await apiClient.put<WorkflowApiResponse<CollateralStatus>>(
      `/workflow/status-dict/collateral-status/${code}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update collateral status');
    }
    return response.data.data;
  },

  deactivateCollateralStatus: async (code: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ code: string; deactivated: boolean }>>(
        `/workflow/status-dict/collateral-status/${code}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate collateral status');
      }
      return { success: response.data.data.deactivated };
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate collateral status');
      }
    }
  },

  // Find specific collateral status
  findCollateralStatusByCode: async (code: string): Promise<CollateralStatus | null> => {
    const response = await apiClient.get<WorkflowApiResponse<CollateralStatus>>(
      `/workflow/status-dict/find/collateral/${code}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to find collateral status');
    }
    return response.data.data;
  },

  // Collateral Usage Statistics
  getCollateralStatusUsageStats: async (): Promise<CollateralStatusUsageStats> => {
    const response = await apiClient.get<WorkflowApiResponse<CollateralStatusUsageStats>>(
      '/workflow/status-dict/usage-stats'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch collateral status usage statistics');
    }
    // Filter for collateral status items only
    return response.data.data.filter(item => item.config_type === 'COLLATERAL_STATUS');
  },

  // Lending Violation Status Management
  getLendingViolationStatuses: async (includeInactive: boolean = false): Promise<any[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<WorkflowApiResponse<LendingViolationStatus[]>>(
      `/workflow/status-dict/lending-violation-status${params}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch lending violation statuses');
    }
    return response.data.data;
  },

  addLendingViolationStatus: async (config: LendingViolationStatusConfig): Promise<LendingViolationStatus> => {
    const response = await apiClient.post<WorkflowApiResponse<LendingViolationStatus>>(
      '/workflow/status-dict/lending-violation-status',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add lending violation status');
    }
    return response.data.data;
  },

  updateLendingViolationStatus: async (code: string, config: Partial<LendingViolationStatusConfig>): Promise<LendingViolationStatus> => {
    const response = await apiClient.put<WorkflowApiResponse<LendingViolationStatus>>(
      `/workflow/status-dict/lending-violation-status/${code}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update lending violation status');
    }
    return response.data.data;
  },

  deactivateLendingViolationStatus: async (code: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ code: string; deactivated: boolean }>>(
        `/workflow/status-dict/lending-violation-status/${code}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate lending violation status');
      }
      return { success: response.data.data.deactivated };
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate lending violation status');
      }
    }
  },

  // Find specific lending violation status
  findLendingViolationStatusByCode: async (code: string): Promise<LendingViolationStatus | null> => {
    const response = await apiClient.get<WorkflowApiResponse<LendingViolationStatus>>(
      `/workflow/status-dict/find/lending_violation/${code}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to find lending violation status');
    }
    return response.data.data;
  },

  // Lending Violation Usage Statistics
  getLendingViolationStatusUsageStats: async (): Promise<LendingViolationStatusUsageStats> => {
    const response = await apiClient.get<WorkflowApiResponse<LendingViolationStatusUsageStats>>(
      '/workflow/status-dict/usage-stats'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch lending violation status usage statistics');
    }
    // Filter for lending violation status items only
    return response.data.data.filter(item => item.config_type === 'LENDING_VIOLATION_STATUS');
  },

  // Recovery Ability Status Management
  getRecoveryAbilityStatuses: async (includeInactive: boolean = false): Promise<any[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<WorkflowApiResponse<RecoveryAbilityStatus[]>>(
      `/workflow/status-dict/recovery-ability-status${params}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recovery ability statuses');
    }
    return response.data.data;
  },

  addRecoveryAbilityStatus: async (config: RecoveryAbilityStatusConfig): Promise<RecoveryAbilityStatus> => {
    const response = await apiClient.post<WorkflowApiResponse<RecoveryAbilityStatus>>(
      '/workflow/status-dict/recovery-ability-status',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add recovery ability status');
    }
    return response.data.data;
  },

  updateRecoveryAbilityStatus: async (code: string, config: Partial<RecoveryAbilityStatusConfig>): Promise<RecoveryAbilityStatus> => {
    const response = await apiClient.put<WorkflowApiResponse<RecoveryAbilityStatus>>(
      `/workflow/status-dict/recovery-ability-status/${code}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update recovery ability status');
    }
    return response.data.data;
  },

  deactivateRecoveryAbilityStatus: async (code: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ code: string; deactivated: boolean }>>(
        `/workflow/status-dict/recovery-ability-status/${code}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate recovery ability status');
      }
      return { success: response.data.data.deactivated };
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate recovery ability status');
      }
    }
  },

  // Find specific recovery ability status
  findRecoveryAbilityStatusByCode: async (code: string): Promise<RecoveryAbilityStatus | null> => {
    const response = await apiClient.get<WorkflowApiResponse<RecoveryAbilityStatus>>(
      `/workflow/status-dict/find/recovery_ability/${code}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to find recovery ability status');
    }
    return response.data.data;
  },

  // Recovery Ability Usage Statistics
  getRecoveryAbilityStatusUsageStats: async (): Promise<RecoveryAbilityStatusUsageStats> => {
    const response = await apiClient.get<WorkflowApiResponse<RecoveryAbilityStatusUsageStats>>(
      '/workflow/status-dict/usage-stats'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch recovery ability status usage statistics');
    }
    // Filter for recovery ability status items only
    return response.data.data.filter(item => item.config_type === 'RECOVERY_ABILITY_STATUS');
  },

  // Processing State Management
  getProcessingStates: async (includeInactive: boolean = false): Promise<any[]> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<WorkflowApiResponse<any[]>>(
      `/workflow/status-dict/processing-state${params}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch processing states');
    }
    return response.data.data;
  },

  // Processing State Management
  addProcessingState: async (config: ProcessingStateConfig): Promise<ProcessingState> => {
    const response = await apiClient.post<WorkflowApiResponse<ProcessingState>>(
      '/workflow/status-dict/processing-state',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add processing state');
    }
    return response.data.data;
  },

  updateProcessingState: async (code: string, config: Partial<ProcessingStateConfig>): Promise<ProcessingState> => {
    const response = await apiClient.put<WorkflowApiResponse<ProcessingState>>(
      `/workflow/status-dict/processing-state/${code}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update processing state');
    }
    return response.data.data;
  },

  deactivateProcessingState: async (code: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ code: string; deactivated: boolean }>>( 
        `/workflow/status-dict/processing-state/${code}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate processing state');
      }
      return { success: response.data.data.deactivated };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate processing state');
      }
    }
  },

  // Processing Substate Management
  addProcessingSubstate: async (config: ProcessingSubstateConfig): Promise<ProcessingSubstate> => {
    const response = await apiClient.post<WorkflowApiResponse<ProcessingSubstate>>(
      '/workflow/status-dict/processing-substate',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add processing substate');
    }
    return response.data.data;
  },

  updateProcessingSubstate: async (code: string, config: Partial<ProcessingSubstateConfig>): Promise<ProcessingSubstate> => {
    const response = await apiClient.put<WorkflowApiResponse<ProcessingSubstate>>(
      `/workflow/status-dict/processing-substate/${code}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update processing substate');
    }
    return response.data.data;
  },

  deactivateProcessingSubstate: async (code: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ code: string; deactivated: boolean }>>(
        `/workflow/status-dict/processing-substate/${code}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate processing substate');
      }
      return { success: response.data.data.deactivated };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate processing substate');
      }
    }
  },

  // State-Substate Mapping Management
  mapStateToSubstate: async (stateCode: string, substateCode: string): Promise<StateSubstateMapping> => {
    const response = await apiClient.post<WorkflowApiResponse<StateSubstateMapping>>(
      '/workflow/status-dict/processing-state-mapping',
      { stateCode, substateCode }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create state-substate mapping');
    }
    return response.data.data;
  },

  removeStateSubstateMapping: async (stateCode: string, substateCode: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ stateCode: string; substateCode: string; removed: boolean }>>(
        '/workflow/status-dict/processing-state-mapping',
        { data: { stateCode, substateCode } }
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove state-substate mapping');
      }
      return { success: response.data.data.removed };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to remove state-substate mapping');
      }
    }
  },

  getProcessingSubstates: async (includeInactive: boolean = false, stateCode?: string): Promise<any[]> => {
    const endpoint = stateCode
      ? `/workflow/status-dict/processing-state/${stateCode}/substates`
      : '/workflow/status-dict/processing-substate';
    const params = includeInactive && !stateCode ? '?includeInactive=true' : '';
    
    const response = await apiClient.get<WorkflowApiResponse<any[]>>(`${endpoint}${params}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch processing substates');
    }
    return response.data.data;
  }
};