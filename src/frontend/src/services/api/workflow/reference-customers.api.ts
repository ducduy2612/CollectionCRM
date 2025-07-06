import { apiClient } from '../client';
import { ReferenceCustomer } from '../../../pages/customers/types';
import { WorkflowApiResponse } from './types';

export interface ReferenceCustomerFormData {
  refCif: string;
  primaryCif: string;
  relationshipType: string;
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  name?: string;
  dateOfBirth?: string;
  nationalId?: string;
  gender?: string;
  companyName?: string;
  registrationNumber?: string;
  taxId?: string;
}

export interface ReferenceCustomerWithContacts extends ReferenceCustomer {
  phones?: any[];
  emails?: any[];
  addresses?: any[];
}

export const referenceCustomersApi = {
  // Get reference customers by primary CIF with contacts
  getReferenceCustomersByPrimaryCifWithContacts: async (primaryCif: string): Promise<ReferenceCustomerWithContacts[]> => {
    console.log('calling referenceCustomersApi - getReferenceCustomersByPrimaryCifWithContacts');
    const response = await apiClient.get<WorkflowApiResponse<ReferenceCustomerWithContacts[]>>(
      `/workflow/reference-customers/by-primary-cif/${primaryCif}/with-contacts`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch reference customers with contacts');
    }
    return response.data.data;
  },

  // Get single reference customer by ID
  getReferenceCustomerById: async (id: string): Promise<ReferenceCustomer> => {
    console.log('calling referenceCustomersApi - getReferenceCustomerById');
    const response = await apiClient.get<WorkflowApiResponse<ReferenceCustomer>>(
      `/workflow/reference-customers/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch reference customer');
    }
    return response.data.data;
  },

  // Create a new reference customer
  createReferenceCustomer: async (data: ReferenceCustomerFormData): Promise<ReferenceCustomer> => {
    console.log('calling referenceCustomersApi - createReferenceCustomer');
    const response = await apiClient.post<WorkflowApiResponse<ReferenceCustomer>>(
      '/workflow/reference-customers',
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create reference customer');
    }
    return response.data.data;
  },

  // Update an existing reference customer
  updateReferenceCustomer: async (id: string, data: Partial<ReferenceCustomerFormData>): Promise<ReferenceCustomer> => {
    console.log('calling referenceCustomersApi - updateReferenceCustomer');
    const response = await apiClient.put<WorkflowApiResponse<ReferenceCustomer>>(
      `/workflow/reference-customers/${id}`,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update reference customer');
    }
    return response.data.data;
  },

  // Delete a reference customer
  deleteReferenceCustomer: async (id: string): Promise<{ deleted: boolean }> => {
    console.log('calling referenceCustomersApi - deleteReferenceCustomer');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/reference-customers/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete reference customer');
    }
    return response.data.data;
  }
};