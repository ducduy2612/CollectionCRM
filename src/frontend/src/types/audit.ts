export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  serviceName: string;
  action: string;
  userId?: string;
  agentId?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'timestamp' | 'eventType' | 'serviceName' | 'action';
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  userId?: string;
  agentId?: string;
  entityType?: string;
  entityId?: string;
  eventType?: string;
  serviceName?: string;
  action?: string;
  ipAddress?: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStatistics {
  totalLogs: number;
  todayLogs: number;
  thisWeekLogs: number;
  thisMonthLogs: number;
  topServices: Array<{
    serviceName: string;
    count: number;
  }>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    count: number;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}