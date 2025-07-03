export interface Document {
  id: string;
  cif: string;
  loanAccountNumber?: string;
  documentType: DocumentType;
  documentCategory: DocumentCategory;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  metadata?: Record<string, any>;
  tags?: string[];
  uploadedBy: string;
  uploadedByAgent?: {
    id: string;
    name: string;
  };
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export enum DocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  SALARY_SLIP = 'SALARY_SLIP',
  LOAN_AGREEMENT = 'LOAN_AGREEMENT',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  CORRESPONDENCE = 'CORRESPONDENCE',
  OTHER = 'OTHER'
}

export enum DocumentCategory {
  IDENTITY = 'IDENTITY',
  FINANCIAL = 'FINANCIAL',
  LOAN = 'LOAN',
  COLLECTION = 'COLLECTION',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DELETED = 'DELETED'
}

export interface DocumentFilters {
  documentType?: DocumentType;
  documentCategory?: DocumentCategory;
  loanAccountNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface UploadFormData {
  files: File[];
  documentType: DocumentType;
  documentCategory: DocumentCategory;
  loanAccountNumber?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UploadResult {
  id: string;
  fileName: string;
  success: boolean;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  data: UploadResult[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}