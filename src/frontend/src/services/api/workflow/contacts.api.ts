import { apiClient } from '../client';
import {
  WorkflowContactInfo,
  WorkflowPhone,
  WorkflowEmail,
  WorkflowAddress,
  PhoneFormData,
  EmailFormData,
  AddressFormData
} from '../../../pages/customers/types';
import { WorkflowApiResponse } from './types';

export const contactsApi = {
  // =============================================
  // CONTACT INFORMATION API FUNCTIONS
  // =============================================

  // Get all contact information for a customer
  getAllContacts: async (cif: string, refCif?: string | null): Promise<WorkflowContactInfo> => {
    console.log('calling contactsApi - getAllContacts');
    // Build query params - if refCif is provided (even if null), include it
    const queryParams = refCif !== undefined ? `?ref_cif=${refCif}` : '';
    const response = await apiClient.get<WorkflowApiResponse<WorkflowContactInfo>>(
      `/workflow/customers/${cif}/contacts${queryParams}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch contact information');
    }
    return response.data.data;
  },

  // =============================================
  // PHONE OPERATIONS
  // =============================================

  createPhone: async (cif: string, phoneData: PhoneFormData & { refCif?: string }): Promise<WorkflowPhone> => {
    console.log('calling contactsApi - createPhone');
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
    console.log('calling contactsApi - updatePhone');
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
    console.log('calling contactsApi - deletePhone');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/customers/${cif}/phones/${phoneId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete phone');
    }
    return response.data.data;
  },

  // =============================================
  // EMAIL OPERATIONS
  // =============================================

  createEmail: async (cif: string, emailData: EmailFormData & { refCif?: string }): Promise<WorkflowEmail> => {
    console.log('calling contactsApi - createEmail');
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
    console.log('calling contactsApi - updateEmail');
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
    console.log('calling contactsApi - deleteEmail');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/customers/${cif}/emails/${emailId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete email');
    }
    return response.data.data;
  },

  // =============================================
  // ADDRESS OPERATIONS
  // =============================================

  createAddress: async (cif: string, addressData: AddressFormData & { refCif?: string }): Promise<WorkflowAddress> => {
    console.log('calling contactsApi - createAddress');
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
    console.log('calling contactsApi - updateAddress');
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
    console.log('calling contactsApi - deleteAddress');
    const response = await apiClient.delete<WorkflowApiResponse<{ deleted: boolean }>>(
      `/workflow/customers/${cif}/addresses/${addressId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete address');
    }
    return response.data.data;
  }
};