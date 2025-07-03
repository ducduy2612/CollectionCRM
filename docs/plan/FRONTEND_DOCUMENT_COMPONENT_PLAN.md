# Frontend Document Component Implementation Plan

## Overview
This document outlines the implementation plan for building the frontend document management component for CollectionCRM. The component will replace the placeholder in `CustomersPage.tsx` and provide full document upload, view, and download functionality.

## Current State Analysis

### Existing Implementation
- **Location**: `src/frontend/src/pages/customers/CustomersPage.tsx#L243-247`
- **Current State**: Placeholder div with "under development" message
- **Integration Point**: Documents tab in customer detail page

### Backend API Available
Based on `DOCUMENT_UPLOAD_BACKEND_PLAN.md`, the following endpoints are available through the API Gateway:
- `POST /api/workflow/documents/upload` - Upload documents (via API Gateway → Workflow Service)
- `GET /api/workflow/documents/customer/:cif` - Get customer documents (via API Gateway → Workflow Service)
- `GET /api/workflow/documents/loan/:loanAccountNumber` - Get loan documents (via API Gateway → Workflow Service)
- `GET /api/workflow/documents/:id/download` - Download document (via API Gateway → Workflow Service)
- `GET /api/workflow/documents/:id/presigned-url` - Get presigned URL (via API Gateway → Workflow Service)
- `DELETE /api/workflow/documents/:id` - Delete document (via API Gateway → Workflow Service)

**Note**: All frontend requests go through the API Gateway (port 3000):
- Frontend calls: `/api/workflow/documents/*`
- API Gateway routes to: `workflow-service:3003/api/v1/collection/documents/*`
- Rate limiting configured for upload (10/min) and download (50/min) operations

## Component Architecture

### 1. Main Component Structure
```
src/frontend/src/pages/customers/components/
├── DocumentHistory.tsx              # Main document component
├── DocumentUploadModal.tsx          # File upload modal
├── DocumentViewModal.tsx            # Document viewer modal
├── DocumentCard.tsx                 # Individual document card
└── DocumentFilters.tsx              # Filter controls
```

### 2. Component Hierarchy
```
DocumentHistory (Main Component)
├── DocumentFilters (Filter controls)
├── DocumentUploadModal (Upload interface)
├── DocumentViewModal (View interface)
├── DocumentCard[] (Document list)
└── LoadingStates/ErrorStates
```

## Detailed Component Specifications

### 1. DocumentHistory.tsx (Main Component)
**Purpose**: Main container component for document management
**Props**:
```typescript
interface DocumentHistoryProps {
  cif: string;
  loans: Loan[];
  className?: string;
}
```

**Features**:
- Display documents in two sections: Customer documents and Loan documents
- Filter documents by type, date, loan account
- Upload new documents
- View/download existing documents
- Delete documents (with confirmation)
- Responsive grid layout

**State Management**:
```typescript
interface DocumentHistoryState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  filters: DocumentFilters;
  uploadModalOpen: boolean;
  viewModalOpen: boolean;
  selectedDocument: Document | null;
}
```

### 2. DocumentUploadModal.tsx
**Purpose**: Handle file upload with drag-and-drop interface
**Features**:
- Drag and drop file upload
- Multiple file selection
- File type validation (PDF, images, Office docs)
- File size validation (max 50MB)
- Progress indication
- Document type/category selection
- Loan account association (optional)
- Success/error feedback

**Form Fields**:
```typescript
interface UploadFormData {
  files: File[];
  documentType: DocumentType;
  documentCategory: DocumentCategory;
  loanAccountNumber?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### 3. DocumentViewModal.tsx
**Purpose**: Display document metadata and preview
**Features**:
- Document metadata display
- Download button
- Delete button (with confirmation)
- File type icon
- Upload information
- Access to full-screen view

### 4. DocumentCard.tsx
**Purpose**: Individual document display card
**Features**:
- Document icon based on file type
- Document name and type
- File size and upload date
- Quick actions (view, download, delete)
- Hover effects and responsive design

### 5. DocumentFilters.tsx
**Purpose**: Filter and search controls
**Features**:
- Document type filter
- Document category filter
- Loan account filter
- Date range filter
- Search by filename
- Clear filters button

## API Integration

### 1. API Service Structure
```typescript
// src/frontend/src/services/api/documents.ts
export const documentsApi = {
  // All endpoints go through API Gateway (localhost:3000)
  upload: (cif: string, formData: FormData) => Promise<ApiResponse<UploadResult[]>>,
  getByCustomer: (cif: string, filters?: DocumentFilters) => Promise<ApiResponse<Document[]>>,
  getByLoan: (loanAccountNumber: string) => Promise<ApiResponse<Document[]>>,
  download: (id: string) => Promise<Blob>,
  getPresignedUrl: (id: string) => Promise<ApiResponse<{ url: string }>>,
  delete: (id: string) => Promise<ApiResponse<void>>,
}

// API Endpoints (configured in API Gateway):
// - POST /api/workflow/documents/upload
// - GET /api/workflow/documents/customer/:cif
// - GET /api/workflow/documents/loan/:loanAccountNumber
// - GET /api/workflow/documents/:id/download
// - GET /api/workflow/documents/:id/presigned-url
// - DELETE /api/workflow/documents/:id
```

### 2. Type Definitions
```typescript
// src/frontend/src/types/document.ts
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

export interface DocumentFilters {
  documentType?: DocumentType;
  documentCategory?: DocumentCategory;
  loanAccountNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}
```

## UI/UX Design Specifications

### 1. Layout Structure
```
[Filter Controls]
[Upload Button]

[Customer Documents Section]
┌─────────────────────────────────────────────────────┐
│ Customer Documents (X)                               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ │ Doc 1   │ │ Doc 2   │ │ Doc 3   │ │ Doc 4   │     │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
└─────────────────────────────────────────────────────┘

[Loan Documents Section]
┌─────────────────────────────────────────────────────┐
│ Loan Documents by Account                           │
│ ┌─── Loan 123456 ───────────────────────────────┐   │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐         │   │
│ │ │ Doc A   │ │ Doc B   │ │ Doc C   │         │   │
│ │ └─────────┘ └─────────┘ └─────────┘         │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2. Document Card Design
```
┌─────────────────────────────────────────────────────┐
│ [📄] Document Name.pdf                              │
│ Type: Bank Statement • Size: 2.5MB                 │
│ Uploaded: 2024-01-15 by John Doe                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│ │ View    │ │Download │ │ Delete  │              │
│ └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────────────────────────────┘
```

### 3. Upload Modal Design
```
┌─────────────────────────────────────────────────────┐
│ Upload Documents                                [×] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📁 Drag and drop files here                    │ │
│ │    or click to browse                          │ │
│ │                                                │ │
│ │ Supported: PDF, JPG, PNG, DOC, XLS             │ │
│ │ Max size: 50MB per file                        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Document Type: [Dropdown]                           │
│ Document Category: [Dropdown]                       │
│ Loan Account: [Dropdown] (Optional)                 │
│ Tags: [Input]                                       │
│                                                     │
│ ┌─────────┐ ┌─────────┐                           │
│ │ Cancel  │ │ Upload  │                           │
│ └─────────┘ └─────────┘                           │
└─────────────────────────────────────────────────────┘
```

## Internationalization

### Translation Keys Structure
```json
{
  "customers": {
    "documents": {
      "title": "Documents",
      "customer_documents": "Customer Documents",
      "loan_documents": "Loan Documents",
      "upload_documents": "Upload Documents",
      "no_documents": "No documents found",
      "filters": {
        "document_type": "Document Type",
        "document_category": "Document Category",
        "loan_account": "Loan Account",
        "date_range": "Date Range",
        "search": "Search documents",
        "clear_filters": "Clear Filters"
      },
      "actions": {
        "view": "View",
        "download": "Download",
        "delete": "Delete",
        "upload": "Upload"
      },
      "upload": {
        "drag_drop": "Drag and drop files here",
        "browse": "or click to browse",
        "supported_formats": "Supported formats",
        "max_size": "Max size",
        "select_type": "Select document type",
        "select_category": "Select document category",
        "optional_loan": "Loan account (optional)",
        "tags": "Tags",
        "uploading": "Uploading...",
        "upload_success": "Upload successful",
        "upload_error": "Upload failed"
      },
      "document_types": {
        "NATIONAL_ID": "National ID",
        "PASSPORT": "Passport",
        "BANK_STATEMENT": "Bank Statement",
        "SALARY_SLIP": "Salary Slip",
        "LOAN_AGREEMENT": "Loan Agreement",
        "PAYMENT_RECEIPT": "Payment Receipt",
        "CORRESPONDENCE": "Correspondence",
        "OTHER": "Other"
      }
    }
  }
}
```

## Error Handling Strategy

### 1. Upload Errors
- File size exceeded
- Invalid file type
- Upload timeout
- Server errors
- Network issues

### 2. Download Errors
- File not found
- Permission denied
- Network timeout

### 3. Display Errors
- Loading failures
- Empty states
- Filter errors

### 4. Error UI Components
- Toast notifications for actions
- Inline error messages
- Retry mechanisms
- Fallback states

## Performance Considerations

### 1. File Upload Optimization
- Chunk large files
- Progress indication
- Concurrent upload limits
- File compression for images

### 2. Document List Optimization
- Pagination for large document sets
- Virtual scrolling for performance
- Lazy loading of thumbnails
- Efficient filtering

### 3. Memory Management
- Cleanup file references
- Efficient state updates
- Memoization for expensive operations

## Testing Strategy

### 1. Unit Tests
- Component rendering
- State management
- API integration
- Form validation
- File upload logic

### 2. Integration Tests
- Upload flow
- Download flow
- Filter functionality
- Modal interactions

### 3. E2E Tests
- Complete user workflows
- Error scenarios
- Cross-browser compatibility

## Security Considerations

### 1. File Upload Security
- File type validation
- Size limits
- Virus scanning feedback
- Secure file handling

### 2. Access Control
- Permission checks
- Document visibility rules
- Download authentication

### 3. Data Protection
- Secure API calls
- Token management
- Error message sanitization

## Implementation Phases

### Phase 1: Core Infrastructure
1. Create TypeScript interfaces
2. Implement API service layer
3. Add translation keys
4. Create base component structure

### Phase 2: Basic Document Display
1. Implement DocumentHistory component
2. Add document list view
3. Implement basic filters
4. Add loading and error states

### Phase 3: Upload Functionality
1. Create DocumentUploadModal
2. Implement drag-and-drop
3. Add file validation
4. Implement upload progress

### Phase 4: View and Download
1. Create DocumentViewModal
2. Implement download functionality
3. Add document preview
4. Implement delete functionality

### Phase 5: Advanced Features
1. Add search functionality
2. Implement advanced filters
3. Add bulk operations
4. Performance optimizations

### Phase 6: Testing and Polish
1. Unit and integration tests
2. E2E testing
3. Performance testing
4. UI/UX improvements

## Integration with Existing Code

### 1. CustomersPage.tsx Modification
Replace the placeholder div with:
```typescript
{activeTab === 'documents' && (
  <DocumentHistory 
    cif={cif}
    loans={loans}
    className="space-y-4"
  />
)}
```

### 2. Import Statements
Add to CustomersPage.tsx:
```typescript
import { DocumentHistory } from './components/DocumentHistory';
```

### 3. Dependencies
No additional dependencies required - uses existing:
- React 18
- TypeScript
- Tailwind CSS
- i18next
- Existing API client

## Success Metrics

### 1. Functionality
- ✅ Upload documents successfully
- ✅ View customer and loan documents
- ✅ Download documents
- ✅ Filter and search documents
- ✅ Delete documents with confirmation

### 2. Performance
- Upload completion in < 30 seconds for 50MB files
- Document list loads in < 2 seconds
- Smooth UI interactions (60fps)

### 3. User Experience
- Intuitive drag-and-drop interface
- Clear error messaging
- Responsive design
- Accessibility compliance

### 4. Integration
- Seamless integration with existing customer page
- Consistent with existing UI patterns
- Proper error handling
- Internationalization support

## Maintenance and Future Enhancements

### 1. Potential Improvements
- Document thumbnails/previews
- Bulk upload operations
- Document versioning
- Advanced search with metadata
- Document templates
- OCR text extraction
- Document approval workflows

### 2. Monitoring
- Upload success rates
- Download performance
- Error tracking
- User adoption metrics

This comprehensive plan provides a roadmap for implementing a robust, user-friendly document management component that integrates seamlessly with the existing CollectionCRM frontend architecture.