import { apiClient } from './client';
import { Customer, Loan } from '../../pages/customers/types';

export interface BankApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface CustomerResponse {
  customer: Customer;
}

export interface LoansResponse {
  loans: Loan[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface CollateralsResponse {
  collaterals: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ReferencesResponse {
  references: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface PhoneType {
  value: string;
  label: string;
  description?: string;
}

export const bankApi = {
  // Get customer by CIF
  getCustomer: async (cif: string): Promise<Customer> => {
    console.log('calling getCustomer');
    const response = await apiClient.get<BankApiResponse<Customer>>(`/bank/customers/${cif}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer data');
    }
    return response.data.data;
  },

  // Search customers
  searchCustomers: async (params: {
    cif?: string;
    name?: string;
    nationalId?: string;
    companyName?: string;
    registrationNumber?: string;
    segment?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    console.log('calling searchCustomers');
    const response = await apiClient.get<BankApiResponse<{
      customers: Partial<Customer>[];
      pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
      };
    }>>('/bank/customers', { params });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to search customers');
    }
    
    return response.data.data;
  },

  // Get customer loans
  getCustomerLoans: async (cif: string, params?: {
    status?: 'OPEN' | 'CLOSED';
    productType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<LoansResponse> => {
    console.log('calling getCustomerLoans');
    const response = await apiClient.get<BankApiResponse<LoansResponse>>(
      `/bank/customers/${cif}/loans`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer loans');
    }
    
    return response.data.data;
  },

  // Get customer collaterals
  getCustomerCollaterals: async (cif: string, params?: {
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<CollateralsResponse> => {
    console.log('calling getCustomerCollaterals');
    const response = await apiClient.get<BankApiResponse<CollateralsResponse>>(
      `/bank/customers/${cif}/collaterals`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer collaterals');
    }
    
    return response.data.data;
  },

  // Get customer references
  getCustomerReferences: async (cif: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ReferencesResponse> => {
    console.log('calling getCustomerReferences');
    const response = await apiClient.get<BankApiResponse<ReferencesResponse>>(
      `/bank/customers/${cif}/references`,
      { params }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch customer references');
    }
    
    return response.data.data;
  },

  // Get loan by account number
  getLoan: async (accountNumber: string): Promise<Loan> => {
    console.log('calling getLoan');
    const response = await apiClient.get<BankApiResponse<Loan>>(`/bank/loans/${accountNumber}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch loan data');
    }
    
    return response.data.data;
  },

  // Get phone types
  getPhoneTypes: async (): Promise<PhoneType[]> => {
    console.log('calling getPhoneTypes');
    const response = await apiClient.get<BankApiResponse<PhoneType[]>>('/bank/phone-types');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch phone types');
    }
    
    return response.data.data;
  }
};