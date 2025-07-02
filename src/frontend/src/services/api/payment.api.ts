import { apiClient } from './client';

// Payment API response types based on backend structure
export interface PaymentItem {
  id: string;
  reference_number: string;
  loan_account_number: string;
  cif: string;
  amount: number;
  payment_date: string;
  payment_channel: string | null;
  source: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentPagination {
  limit: number;
  offset: number;
  count: number;
}

export interface PaymentFilters {
  cif: string;
  loan_account_number?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface PaymentApiResponse {
  success: boolean;
  data: {
    payments: PaymentItem[];
    pagination: PaymentPagination;
    filters: PaymentFilters;
  };
  timestamp: string;
}

export interface PaymentQueryParams {
  limit?: number;
  offset?: number;
  loan_account_number?: string;
  start_date?: string;
  end_date?: string;
}

export const paymentApi = {
  /**
   * Get payments by CIF with optional filters
   */
  async getPaymentsByCif(cif: string, params?: PaymentQueryParams): Promise<PaymentApiResponse> {
    console.log('calling getPaymentsByCif');
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.loan_account_number) queryParams.append('loan_account_number', params.loan_account_number);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const url = `/payment/payments/cif/${cif}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<PaymentApiResponse>(url);
    return response.data;
  }
};