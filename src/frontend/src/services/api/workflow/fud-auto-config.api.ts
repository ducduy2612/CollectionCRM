import { apiClient } from '../client';
import { WorkflowApiResponse } from './types';

// FUD Auto Configuration Types
export interface FudAutoConfig {
  id: string;
  action_result_id: string;
  calculation_type: 'PROMISE_DATE' | 'ACTION_DATE';
  days_offset: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  action_result?: {
    id: string;
    code: string;
    name: string;
    is_promise: boolean;
  };
}

export interface CreateFudConfigRequest {
  action_result_id: string;
  calculation_type: 'PROMISE_DATE' | 'ACTION_DATE';
  days_offset: number;
  is_active?: boolean;
  priority?: number;
}

export interface UpdateFudConfigRequest {
  calculation_type?: 'PROMISE_DATE' | 'ACTION_DATE';
  days_offset?: number;
  is_active?: boolean;
  priority?: number;
}

export interface FudCalculationRequest {
  action_result_id: string;
  action_date: string;
  promise_date?: string;
  loan_account_number?: string;
  request_index?: number;
}

export interface FudCalculationResponse {
  fud_date: string | null;
  auto_calculated: boolean;
}

export interface BulkFudCalculationRequest {
  calculations: FudCalculationRequest[];
}

export interface BulkFudCalculationResult {
  action_result_id: string;
  fud_date: string | null;
  auto_calculated: boolean;
  error?: string;
  original_request: FudCalculationRequest;
}

export interface BulkFudCalculationResponse {
  results: BulkFudCalculationResult[];
  total_processed: number;
  successful: number;
  failed: number;
}

export interface FudConfigStats {
  id: string;
  action_result_id: string;
  action_result_code: string;
  action_result_name: string;
  calculation_type: string;
  days_offset: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export const fudAutoConfigApi = {
  // Get all FUD configurations
  getAllConfigs: async (includeInactive = false): Promise<FudAutoConfig[]> => {
    const response = await apiClient.get<WorkflowApiResponse<FudAutoConfig[]>>(
      `/workflow/fud-auto-config?include_inactive=${includeInactive}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch FUD configurations');
    }
    return response.data.data;
  },

  // Get FUD configuration by ID
  getConfigById: async (id: string): Promise<FudAutoConfig> => {
    const response = await apiClient.get<WorkflowApiResponse<FudAutoConfig>>(
      `/workflow/fud-auto-config/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch FUD configuration');
    }
    return response.data.data;
  },

  // Get FUD configuration by action result ID
  getConfigByActionResult: async (actionResultId: string): Promise<FudAutoConfig | null> => {
    const response = await apiClient.get<WorkflowApiResponse<FudAutoConfig | null>>(
      `/workflow/fud-auto-config/action-result/${actionResultId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch FUD configuration');
    }
    return response.data.data;
  },

  // Create new FUD configuration
  createConfig: async (config: CreateFudConfigRequest): Promise<FudAutoConfig> => {
    const response = await apiClient.post<WorkflowApiResponse<FudAutoConfig>>(
      '/workflow/fud-auto-config',
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create FUD configuration');
    }
    return response.data.data;
  },

  // Update FUD configuration
  updateConfig: async (id: string, config: UpdateFudConfigRequest): Promise<FudAutoConfig> => {
    const response = await apiClient.put<WorkflowApiResponse<FudAutoConfig>>(
      `/workflow/fud-auto-config/${id}`,
      config
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update FUD configuration');
    }
    return response.data.data;
  },

  // Delete FUD configuration
  deleteConfig: async (id: string): Promise<void> => {
    const response = await apiClient.delete<WorkflowApiResponse<null>>(
      `/workflow/fud-auto-config/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete FUD configuration');
    }
  },

  // Calculate FUD date
  calculateFudDate: async (params: FudCalculationRequest): Promise<FudCalculationResponse> => {
    console.log('calling fud-auto-config api - calculateFudDate');
    const response = await apiClient.post<WorkflowApiResponse<FudCalculationResponse>>(
      '/workflow/fud-auto-config/calculate',
      params
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to calculate FUD date');
    }
    return response.data.data;
  },

  // Calculate FUD dates in bulk
  calculateBulkFudDates: async (params: BulkFudCalculationRequest): Promise<BulkFudCalculationResponse> => {
    console.log('calling fud-auto-config api - calculateBulkFudDates');
    const response = await apiClient.post<WorkflowApiResponse<BulkFudCalculationResponse>>(
      '/workflow/fud-auto-config/calculate-bulk',
      params
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to calculate bulk FUD dates');
    }
    return response.data.data;
  },

  // Get configuration statistics
  getConfigStats: async (): Promise<FudConfigStats[]> => {
    const response = await apiClient.get<WorkflowApiResponse<FudConfigStats[]>>(
      '/workflow/fud-auto-config/stats'
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch FUD configuration statistics');
    }
    return response.data.data;
  }
};