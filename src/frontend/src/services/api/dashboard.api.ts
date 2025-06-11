import { api, ApiResponse } from './client';

// Dashboard Performance Metrics Interface
export interface DashboardPerformance {
  calls_made: number;
  successful_contacts: number;
  promises_to_pay: number;
  amount_promised: number;
  contact_rate: number;
  promise_rate: number;
}

// Priority Customer Interface
export interface PriorityCustomer {
  id: string;
  customer_name: string;
  cif: string;
  dpd: number;
  outstanding_amount: number;
  priority_level: 'High' | 'Medium' | 'Low';
  initials?: string;
}

// Recent Activity Interface
export interface RecentActivity {
  id: string;
  timestamp: string;
  customer_info: {
    id: string;
    name: string;
    initials: string;
  };
  action_type: 'Call' | 'SMS' | 'Email' | 'Visit';
  result: 'Promise to Pay' | 'No Answer' | 'Sent' | 'Busy' | 'Refused' | 'Partial Payment';
  details: string;
}

// API Request/Response Interfaces
export interface GetPriorityCustomersParams {
  search?: string;
  priority_level?: string;
  limit?: number;
  offset?: number;
}

export interface GetRecentActivitiesParams {
  limit?: number;
  offset?: number;
}

// Dashboard API Service
export const dashboardApi = {
  /**
   * Get dashboard performance metrics
   */
  getDashboardPerformance: async (): Promise<DashboardPerformance> => {
    const response: ApiResponse<DashboardPerformance> = await api.get('/v1/collection/dashboard/performance');
    return response.data;
  },

  /**
   * Get priority customers with optional search and filtering
   */
  getPriorityCustomers: async (params?: GetPriorityCustomersParams): Promise<PriorityCustomer[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.priority_level) {
      queryParams.append('priority_level', params.priority_level);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const url = `/v1/collection/dashboard/priority-customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response: ApiResponse<PriorityCustomer[]> = await api.get(url);
    
    // Add initials if not provided by API
    return response.data.map(customer => ({
      ...customer,
      initials: customer.initials || customer.customer_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }));
  },

  /**
   * Get recent activities
   */
  getRecentActivities: async (params?: GetRecentActivitiesParams): Promise<RecentActivity[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const url = `/v1/collection/dashboard/recent-activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response: ApiResponse<RecentActivity[]> = await api.get(url);
    
    // Ensure initials are set for customer info
    return response.data.map(activity => ({
      ...activity,
      customer_info: {
        ...activity.customer_info,
        initials: activity.customer_info.initials || activity.customer_info.name
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }
    }));
  }
};

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₫', '₫');
};

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const getPriorityBadgeVariant = (priority: string): 'danger' | 'warning' | 'success' => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'warning';
  }
};

export const getActionTypeBadgeVariant = (actionType: string): 'primary' | 'success' | 'secondary' => {
  switch (actionType.toLowerCase()) {
    case 'call':
      return 'primary';
    case 'sms':
      return 'success';
    case 'email':
      return 'secondary';
    case 'visit':
      return 'primary';
    default:
      return 'secondary';
  }
};

export const getResultBadgeVariant = (result: string): 'success' | 'secondary' | 'warning' | 'danger' => {
  switch (result.toLowerCase()) {
    case 'promise to pay':
    case 'partial payment':
      return 'success';
    case 'sent':
      return 'secondary';
    case 'no answer':
    case 'busy':
      return 'warning';
    case 'refused':
      return 'danger';
    default:
      return 'secondary';
  }
};