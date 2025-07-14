import { apiClient } from './client';
import { 
  AuditLog, 
  AuditLogFilters, 
  AuditLogResponse, 
  AuditStatistics, 
  ApiResponse 
} from '../../types/audit';

export const auditApi = {
  getLogs: async (filters: AuditLogFilters = {}): Promise<AuditLogResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.serviceName) params.append('serviceName', filters.serviceName);
    if (filters.action) params.append('action', filters.action);
    if (filters.ipAddress) params.append('ipAddress', filters.ipAddress);

    const response = await apiClient.get<ApiResponse<AuditLogResponse>>(`/audit/logs?${params.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch audit logs');
    }
    
    return response.data.data;
  },

  getLogById: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get<ApiResponse<AuditLog>>(`/audit/logs/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch audit log');
    }
    
    return response.data.data;
  },

  getUserLogs: async (userId: string, limit?: number): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await apiClient.get<ApiResponse<AuditLog[]>>(`/audit/user/${userId}?${params.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch user logs');
    }
    
    return response.data.data;
  },

  getEntityLogs: async (entityType: string, entityId: string, limit?: number): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await apiClient.get<ApiResponse<AuditLog[]>>(`/audit/entity/${entityType}/${entityId}?${params.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch entity logs');
    }
    
    return response.data.data;
  },

  getStatistics: async (filters: Pick<AuditLogFilters, 'startDate' | 'endDate' | 'userId' | 'agentId' | 'entityType'> = {}): Promise<AuditStatistics> => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.entityType) params.append('entityType', filters.entityType);

    const response = await apiClient.get<ApiResponse<AuditStatistics>>(`/audit/statistics?${params.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch audit statistics');
    }
    
    return response.data.data;
  }
};