import { apiClient } from '../client';
import { ActionType, ActionSubtype, ActionResult } from '../../../pages/customers/types';
import { WorkflowApiResponse } from './types';

// Action Configuration Types
export interface ActionTypeConfig {
  code: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface ActionSubtypeConfig {
  code: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface ActionResultConfig {
  code: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface TypeSubtypeMapping {
  id?: string;
  type_code: string;
  subtype_code: string;
  created_at?: string;
  created_by?: string;
}

export interface SubtypeResultMapping {
  id?: string;
  subtype_code: string;
  result_code: string;
  created_at?: string;
  created_by?: string;
}

export interface ConfigurationUsageItem {
  config_type: 'TYPE' | 'SUBTYPE' | 'RESULT';
  config_code: string;
  config_name: string;
  is_active: boolean;
  usage_count: string;
  can_be_deactivated: boolean;
}

export type ConfigurationUsageStats = ConfigurationUsageItem[];

export const actionConfigApi = {
  // Action Types Management
  addActionType: async (config: ActionTypeConfig): Promise<ActionType> => {
    const response = await apiClient.post<WorkflowApiResponse<ActionType>>(
      '/workflow/actions/action-config/action-types',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add action type');
    }
    return response.data.data;
  },

  getAllActionTypes: async (): Promise<ActionType[]> => {
    const response = await apiClient.get<WorkflowApiResponse<ActionType[]>>(
      '/workflow/actions/action-config/action-types'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action types');
    }
    return response.data.data;
  },

  deactivateActionType: async (typeCode: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ success: boolean }>>(
        `/workflow/actions/action-config/action-types/${typeCode}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate action type');
      }
      return response.data.data;
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate action type');
      }
    }
  },

  // Action Subtypes Management
  addActionSubtype: async (config: ActionSubtypeConfig): Promise<ActionSubtype> => {
    const response = await apiClient.post<WorkflowApiResponse<ActionSubtype>>(
      '/workflow/actions/action-config/action-subtypes',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add action subtype');
    }
    return response.data.data;
  },

  getAllActionSubtypes: async (): Promise<ActionSubtype[]> => {
    const response = await apiClient.get<WorkflowApiResponse<ActionSubtype[]>>(
      '/workflow/actions/action-config/action-subtypes'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action subtypes');
    }
    return response.data.data;
  },

  getSubtypesForType: async (typeCode: string): Promise<ActionSubtype[]> => {
    const response = await apiClient.get<WorkflowApiResponse<ActionSubtype[]>>(
      `/workflow/actions/action-config/types/${typeCode}/subtypes`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch subtypes for type');
    }
    return response.data.data;
  },

  deactivateActionSubtype: async (subtypeCode: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ success: boolean }>>(
        `/workflow/actions/action-config/action-subtypes/${subtypeCode}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate action subtype');
      }
      return response.data.data;
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate action subtype');
      }
    }
  },

  // Action Results Management
  addActionResult: async (config: ActionResultConfig): Promise<ActionResult> => {
    const response = await apiClient.post<WorkflowApiResponse<ActionResult>>(
      '/workflow/actions/action-config/action-results',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add action result');
    }
    return response.data.data;
  },

  getAllActionResults: async (): Promise<ActionResult[]> => {
    const response = await apiClient.get<WorkflowApiResponse<ActionResult[]>>(
      '/workflow/actions/action-config/action-results'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch action results');
    }
    return response.data.data;
  },

  getResultsForSubtype: async (subtypeCode: string): Promise<ActionResult[]> => {
    const response = await apiClient.get<WorkflowApiResponse<ActionResult[]>>(
      `/workflow/actions/action-config/subtypes/${subtypeCode}/results`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch results for subtype');
    }
    return response.data.data;
  },

  deactivateActionResult: async (resultCode: string): Promise<{ success: boolean }> => {
    try {
      const response = await apiClient.delete<WorkflowApiResponse<{ success: boolean }>>(
        `/workflow/actions/action-config/action-results/${resultCode}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to deactivate action result');
      }
      return response.data.data;
    } catch (error: any) {
      // Extract detailed error message from server response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors?.[0]?.message) {
        throw new Error(error.response.data.errors[0].message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to deactivate action result');
      }
    }
  },

  // Mappings Management
  mapTypeToSubtype: async (type_code: string, subtype_code: string): Promise<TypeSubtypeMapping> => {
    const response = await apiClient.post<WorkflowApiResponse<TypeSubtypeMapping>>(
      '/workflow/actions/action-config/mappings/type-subtype',
      { type_code, subtype_code }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create type-subtype mapping');
    }
    return response.data.data;
  },

  mapSubtypeToResult: async (subtype_code: string, result_code: string): Promise<SubtypeResultMapping> => {
    const response = await apiClient.post<WorkflowApiResponse<SubtypeResultMapping>>(
      '/workflow/actions/action-config/mappings/subtype-result',
      { subtype_code, result_code }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create subtype-result mapping');
    }
    return response.data.data;
  },

  removeTypeSubtypeMapping: async (type_code: string, subtype_code: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<WorkflowApiResponse<{ success: boolean }>>(
      '/workflow/actions/action-config/mappings/type-subtype',
      { data: { type_code, subtype_code } }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove type-subtype mapping');
    }
    return response.data.data;
  },

  removeSubtypeResultMapping: async (subtype_code: string, result_code: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<WorkflowApiResponse<{ success: boolean }>>(
      '/workflow/actions/action-config/mappings/subtype-result',
      { data: { subtype_code, result_code } }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove subtype-result mapping');
    }
    return response.data.data;
  },

  // Configuration Validation
  validateActionConfiguration: async (type_id: string, subtype_id: string, result_id: string): Promise<{ is_valid: boolean }> => {
    const response = await apiClient.post<WorkflowApiResponse<{ is_valid: boolean }>>(
      '/workflow/actions/action-config/validate',
      { type_id, subtype_id, result_id }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to validate action configuration');
    }
    return response.data.data;
  },

  // Usage Statistics
  getConfigurationUsageStats: async (): Promise<ConfigurationUsageStats> => {
    const response = await apiClient.get<WorkflowApiResponse<ConfigurationUsageStats>>(
      '/workflow/actions/action-config/usage-stats'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch configuration usage statistics');
    }
    return response.data.data;
  }
};