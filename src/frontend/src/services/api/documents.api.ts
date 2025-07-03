import { api } from './client';
import { Document, DocumentFilters, UploadResult, ApiResponse } from '../../types/document';

export const documentsApi = {
  /**
   * Upload documents for a customer
   * @param cif Customer identification number
   * @param formData Form data containing files and metadata
   * @returns Promise<ApiResponse<UploadResult[]>>
   */
  upload: async (cif: string, formData: FormData): Promise<ApiResponse<UploadResult[]>> => {
    const response = await api.post<UploadResult[]>('/workflow/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: { cif },
    });
    return response;
  },

  /**
   * Get documents for a specific customer
   * @param cif Customer identification number
   * @param filters Optional filters to apply
   * @returns Promise<ApiResponse<Document[]>>
   */
  getByCustomer: async (cif: string, filters?: DocumentFilters): Promise<any> => {
    const response = await api.get<Document[]>(`/workflow/documents/customer/${cif}`, {
      params: filters,
    });
    return response;
  },

  /**
   * Get documents for a specific loan
   * @param loanAccountNumber Loan account number
   * @returns Promise<ApiResponse<Document[]>>
   */
  getByLoan: async (loanAccountNumber: string): Promise<ApiResponse<Document[]>> => {
    const response = await api.get<Document[]>(`/workflow/documents/loan/${loanAccountNumber}`);
    return response;
  },

  /**
   * Download a document
   * @param id Document ID
   * @returns Promise<Blob>
   */
  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/workflow/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get presigned URL for document access
   * @param id Document ID
   * @returns Promise<ApiResponse<{ url: string }>>
   */
  getPresignedUrl: async (id: string): Promise<ApiResponse<{ url: string }>> => {
    const response = await api.get<{ url: string }>(`/workflow/documents/${id}/presigned-url`);
    return response;
  },

  /**
   * Delete a document
   * @param id Document ID
   * @returns Promise<ApiResponse<void>>
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<void>(`/workflow/documents/${id}`);
    return response;
  },
};

export default documentsApi;