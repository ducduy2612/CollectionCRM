# Document Upload Backend Implementation Plan

## Overview
This document outlines the backend implementation plan for adding document upload functionality to CollectionCRM. The feature will allow users to upload documents at both customer and loan levels, with proper storage, security, and access control.

## Architecture Decision

### Storage Solution: MinIO (S3-compatible)
**Rationale:**
- S3-compatible API allows easy migration to AWS S3 in the future
- Self-hosted solution for development and on-premise deployments
- Built-in object versioning and lifecycle policies
- Excellent performance for large files
- Native support for pre-signed URLs for secure direct uploads

### Alternative Considered:
- **Local filesystem**: Not scalable, difficult to handle in distributed environment
- **Database BLOB storage**: Poor performance for large files, database bloat
- **Cloud-only (S3)**: Requires internet connectivity, may have compliance issues

## Implementation Phases

### Phase 1: Database Schema and Entity Layer

#### 1.1 Database Schema
```sql
-- Add to workflow_service schema
CREATE TABLE workflow_service.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cif VARCHAR(50) NOT NULL,
    loan_account_number VARCHAR(50),
    document_type VARCHAR(50) NOT NULL,
    document_category VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    tags TEXT[],
    uploaded_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) 
        REFERENCES auth_service.users(id),
    INDEX idx_documents_cif (cif),
    INDEX idx_documents_loan (loan_account_number),
    INDEX idx_documents_type (document_type),
    INDEX idx_documents_status (status),
    INDEX idx_documents_uploaded_by (uploaded_by)
);

-- Document access log for audit trail
CREATE TABLE workflow_service.document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'upload', 'delete'
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_access_logs_document FOREIGN KEY (document_id) 
        REFERENCES workflow_service.documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_logs_user FOREIGN KEY (user_id) 
        REFERENCES auth_service.users(id),
    INDEX idx_access_logs_document (document_id),
    INDEX idx_access_logs_user (user_id),
    INDEX idx_access_logs_created (created_at)
);
```

#### 1.2 TypeORM Entity
```typescript
// src/services/workflow-service/src/entities/document.entity.ts
@Entity('documents', { schema: 'workflow_service' })
export class Document extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  cif: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  loanAccountNumber?: string;

  @Column({ type: 'varchar', length: 50 })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 50 })
  documentCategory: DocumentCategory;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  originalFileName: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'varchar', length: 500 })
  storagePath: string;

  @Column({ type: 'varchar', length: 100 })
  storageBucket: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: DocumentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'uuid' })
  uploadedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  @OneToMany(() => DocumentAccessLog, (log) => log.document)
  accessLogs: DocumentAccessLog[];
}
```

#### 1.3 Repository Implementation
```typescript
// src/services/workflow-service/src/repositories/document.repository.ts
@EntityRepository(Document)
export class DocumentRepository extends Repository<Document> {
  async findByCustomer(cif: string, options?: FindDocumentOptions): Promise<Document[]> {
    const query = this.createQueryBuilder('document')
      .where('document.cif = :cif', { cif })
      .andWhere('document.status = :status', { status: 'active' });

    if (options?.documentType) {
      query.andWhere('document.documentType = :type', { type: options.documentType });
    }

    if (options?.loanAccountNumber) {
      query.andWhere('document.loanAccountNumber = :loan', { loan: options.loanAccountNumber });
    }

    return query.orderBy('document.createdAt', 'DESC').getMany();
  }

  async findByLoan(loanAccountNumber: string): Promise<Document[]> {
    return this.find({
      where: {
        loanAccountNumber,
        status: 'active'
      },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.update(id, {
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy
    });
  }
}
```

### Phase 2: Storage Service Implementation

#### 2.1 MinIO Configuration
```typescript
// src/services/workflow-service/src/config/storage.config.ts
export const storageConfig = {
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    region: process.env.MINIO_REGION || 'us-east-1'
  },
  buckets: {
    documents: process.env.DOCUMENTS_BUCKET || 'collection-documents',
    temp: process.env.TEMP_BUCKET || 'collection-temp'
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    chunkSize: 5 * 1024 * 1024 // 5MB chunks for multipart upload
  }
};
```

#### 2.2 Storage Service
```typescript
// src/services/workflow-service/src/services/storage.service.ts
import * as Minio from 'minio';
import crypto from 'crypto';

export class StorageService {
  private minioClient: Minio.Client;

  constructor() {
    this.minioClient = new Minio.Client(storageConfig.minio);
    this.initializeBuckets();
  }

  async uploadFile(file: Express.Multer.File, metadata: UploadMetadata): Promise<StorageResult> {
    const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
    const fileName = `${fileHash}-${Date.now()}-${file.originalname}`;
    const storagePath = this.generateStoragePath(metadata.cif, metadata.documentType, fileName);

    // Upload to MinIO
    await this.minioClient.putObject(
      storageConfig.buckets.documents,
      storagePath,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'X-Document-Type': metadata.documentType,
        'X-CIF': metadata.cif,
        'X-Upload-User': metadata.uploadedBy
      }
    );

    return {
      fileName,
      storagePath,
      bucket: storageConfig.buckets.documents,
      checksum: fileHash,
      size: file.size
    };
  }

  async downloadFile(storagePath: string, bucket: string): Promise<Stream> {
    return this.minioClient.getObject(bucket, storagePath);
  }

  async deleteFile(storagePath: string, bucket: string): Promise<void> {
    await this.minioClient.removeObject(bucket, storagePath);
  }

  async generatePresignedUrl(storagePath: string, bucket: string, expiry = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(bucket, storagePath, expiry);
  }

  private generateStoragePath(cif: string, documentType: string, fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `customers/${cif}/${documentType}/${year}/${month}/${fileName}`;
  }
}
```

### Phase 3: API Implementation

#### 3.1 Document Controller
```typescript
// src/services/workflow-service/src/controllers/document.controller.ts
export class DocumentController {
  constructor(
    private documentRepository: DocumentRepository,
    private storageService: StorageService,
    private accessLogRepository: DocumentAccessLogRepository
  ) {}

  async uploadDocuments(req: Request, res: Response): Promise<void> {
    const files = req.files as Express.Multer.File[];
    const { cif, loanAccountNumber, documentType, documentCategory, metadata, tags } = req.body;
    const userId = req.user.id;

    const uploadResults = [];

    for (const file of files) {
      try {
        // Validate file
        this.validateFile(file);

        // Upload to storage
        const storageResult = await this.storageService.uploadFile(file, {
          cif,
          documentType,
          uploadedBy: userId
        });

        // Save metadata to database
        const document = await this.documentRepository.save({
          cif,
          loanAccountNumber,
          documentType,
          documentCategory,
          fileName: storageResult.fileName,
          originalFileName: file.originalname,
          fileSize: storageResult.size,
          mimeType: file.mimetype,
          storagePath: storageResult.storagePath,
          storageBucket: storageResult.bucket,
          checksum: storageResult.checksum,
          metadata,
          tags,
          uploadedBy: userId,
          createdBy: userId
        });

        // Log upload action
        await this.accessLogRepository.save({
          documentId: document.id,
          userId,
          action: 'upload',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        uploadResults.push({
          id: document.id,
          fileName: document.originalFileName,
          status: 'success'
        });
      } catch (error) {
        uploadResults.push({
          fileName: file.originalname,
          status: 'failed',
          error: error.message
        });
      }
    }

    ResponseUtil.success(res, uploadResults);
  }

  async getCustomerDocuments(req: Request, res: Response): Promise<void> {
    const { cif } = req.params;
    const { documentType, loanAccountNumber } = req.query;

    // Check user permission to view customer documents
    await this.checkCustomerAccess(req.user, cif);

    const documents = await this.documentRepository.findByCustomer(cif, {
      documentType: documentType as string,
      loanAccountNumber: loanAccountNumber as string
    });

    ResponseUtil.success(res, documents);
  }

  async downloadDocument(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await this.documentRepository.findOne(id);
    if (!document || document.status !== 'active') {
      throw new NotFoundError('Document not found');
    }

    // Check access permission
    await this.checkCustomerAccess(req.user, document.cif);

    // Get file stream from storage
    const fileStream = await this.storageService.downloadFile(
      document.storagePath,
      document.storageBucket
    );

    // Log access
    await this.accessLogRepository.save({
      documentId: document.id,
      userId,
      action: 'download',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Set response headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.fileSize.toString());
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);

    // Stream file to response
    fileStream.pipe(res);
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await this.documentRepository.findOne(id);
    if (!document || document.status !== 'active') {
      throw new NotFoundError('Document not found');
    }

    // Check permission
    await this.checkCustomerAccess(req.user, document.cif);

    // Soft delete in database
    await this.documentRepository.softDelete(id, userId);

    // Log deletion
    await this.accessLogRepository.save({
      documentId: document.id,
      userId,
      action: 'delete',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    ResponseUtil.success(res, { message: 'Document deleted successfully' });
  }

  private validateFile(file: Express.Multer.File): void {
    if (!storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      throw new ValidationError(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size > storageConfig.upload.maxFileSize) {
      throw new ValidationError(`File size exceeds maximum allowed size of ${storageConfig.upload.maxFileSize} bytes`);
    }
  }

  private async checkCustomerAccess(user: User, cif: string): Promise<void> {
    // Implement based on your business rules
    // For example, check if user is assigned to this customer
    const hasAccess = await this.checkUserCustomerAssignment(user.id, cif);
    if (!hasAccess && !user.roles.includes('ADMIN')) {
      throw new ForbiddenError('You do not have permission to access this customer\'s documents');
    }
  }
}
```

#### 3.2 Upload Middleware Enhancement
```typescript
// src/services/workflow-service/src/middleware/document-upload.middleware.ts
import multer from 'multer';
import { storageConfig } from '../config/storage.config';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${storageConfig.upload.allowedMimeTypes.join(', ')}`));
  }
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: storageConfig.upload.maxFileSize,
    files: 10 // Maximum 10 files per upload
  }
});

// Middleware for single file upload
export const uploadSingle = documentUpload.single('document');

// Middleware for multiple file upload
export const uploadMultiple = documentUpload.array('documents', 10);
```

#### 3.3 Routes Configuration
```typescript
// src/services/workflow-service/src/routes/document.routes.ts
import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { requireAuth, requireAgentContext } from '../middleware/auth.middleware';
import { uploadMultiple } from '../middleware/document-upload.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { documentValidation } from '../validations/document.validation';

const router = Router();
const documentController = new DocumentController(
  documentRepository,
  storageService,
  accessLogRepository
);

// Upload documents
router.post(
  '/upload',
  requireAuth,
  requireAgentContext,
  uploadMultiple,
  validateRequest(documentValidation.upload),
  (req, res) => documentController.uploadDocuments(req, res)
);

// Get customer documents
router.get(
  '/customer/:cif',
  requireAuth,
  requireAgentContext,
  validateRequest(documentValidation.getByCustomer),
  (req, res) => documentController.getCustomerDocuments(req, res)
);

// Get loan documents
router.get(
  '/loan/:loanAccountNumber',
  requireAuth,
  requireAgentContext,
  validateRequest(documentValidation.getByLoan),
  (req, res) => documentController.getLoanDocuments(req, res)
);

// Download document
router.get(
  '/:id/download',
  requireAuth,
  requireAgentContext,
  validateRequest(documentValidation.download),
  (req, res) => documentController.downloadDocument(req, res)
);

// Get presigned URL for direct download
router.get(
  '/:id/presigned-url',
  requireAuth,
  requireAgentContext,
  validateRequest(documentValidation.presignedUrl),
  (req, res) => documentController.getPresignedUrl(req, res)
);

// Delete document
router.delete(
  '/:id',
  requireAuth,
  requireAgentContext,
  validateRequest(documentValidation.delete),
  (req, res) => documentController.deleteDocument(req, res)
);

// Get document metadata
router.get(
  '/:id',
  requireAuth,
  requireAgentContext,
  validateRequest(documentValidation.getById),
  (req, res) => documentController.getDocument(req, res)
);

export default router;
```

### Phase 4: Validation and Security

#### 4.1 Validation Schemas
```typescript
// src/services/workflow-service/src/validations/document.validation.ts
import { body, param, query } from 'express-validator';

export const documentValidation = {
  upload: [
    body('cif').notEmpty().isString().withMessage('Customer CIF is required'),
    body('loanAccountNumber').optional().isString(),
    body('documentType').notEmpty().isIn(Object.values(DocumentType)),
    body('documentCategory').notEmpty().isIn(Object.values(DocumentCategory)),
    body('metadata').optional().isJSON(),
    body('tags').optional().isArray()
  ],
  getByCustomer: [
    param('cif').notEmpty().isString(),
    query('documentType').optional().isIn(Object.values(DocumentType)),
    query('loanAccountNumber').optional().isString()
  ],
  download: [
    param('id').notEmpty().isUUID()
  ],
  delete: [
    param('id').notEmpty().isUUID()
  ]
};
```

#### 4.2 Security Enhancements
```typescript
// src/services/workflow-service/src/services/document-security.service.ts
import { createHash } from 'crypto';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class DocumentSecurityService {
  // Virus scanning using ClamAV
  async scanFile(filePath: string): Promise<ScanResult> {
    try {
      const { stdout } = await execAsync(`clamscan ${filePath}`);
      return {
        clean: !stdout.includes('FOUND'),
        details: stdout
      };
    } catch (error) {
      // If ClamAV is not available, log and continue
      console.warn('Virus scanning failed:', error);
      return { clean: true, details: 'Scanning unavailable' };
    }
  }

  // Generate file checksum
  generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  // Sanitize filename
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-z0-9.-]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  // Check for malicious content in PDFs
  async checkPdfSecurity(buffer: Buffer): Promise<boolean> {
    // Basic check for JavaScript in PDFs
    const content = buffer.toString('utf8', 0, 1024);
    const suspiciousPatterns = ['/JavaScript', '/JS', '/OpenAction'];
    
    return !suspiciousPatterns.some(pattern => content.includes(pattern));
  }
}
```

### Phase 5: Integration and Infrastructure

#### 5.1 Docker Compose Addition
```yaml
# Add to docker-compose.dev.yml
minio:
  image: minio/minio:latest
  container_name: collection-minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
  networks:
    - collection-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3

# Add to volumes section
minio_data:
  driver: local
```

#### 5.2 API Gateway Configuration
```typescript
// Add to src/services/api-gateway/src/config/routes.config.ts
{
  path: '/documents',
  target: 'http://workflow-service:3003',
  pathRewrite: {
    '^/api/v1/documents': '/api/v1/documents'
  },
  auth: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit uploads
    message: 'Too many upload requests'
  }
}
```

#### 5.3 Environment Variables
```bash
# Add to workflow-service .env
# MinIO Configuration
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1

# Document Storage
DOCUMENTS_BUCKET=collection-documents
TEMP_BUCKET=collection-temp
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx,xls,xlsx

# Security
ENABLE_VIRUS_SCAN=false
ENABLE_FILE_ENCRYPTION=false
```

### Phase 6: Monitoring and Maintenance

#### 6.1 Metrics Collection
```typescript
// src/services/workflow-service/src/metrics/document.metrics.ts
export class DocumentMetrics {
  private uploadCounter = new Counter({
    name: 'document_uploads_total',
    help: 'Total number of document uploads',
    labelNames: ['status', 'document_type']
  });

  private downloadCounter = new Counter({
    name: 'document_downloads_total',
    help: 'Total number of document downloads',
    labelNames: ['document_type']
  });

  private uploadDuration = new Histogram({
    name: 'document_upload_duration_seconds',
    help: 'Document upload duration in seconds',
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  });

  private storageSize = new Gauge({
    name: 'document_storage_bytes',
    help: 'Total storage used by documents',
    labelNames: ['bucket']
  });

  recordUpload(status: string, documentType: string, duration: number): void {
    this.uploadCounter.inc({ status, document_type: documentType });
    this.uploadDuration.observe(duration);
  }

  recordDownload(documentType: string): void {
    this.downloadCounter.inc({ document_type: documentType });
  }

  async updateStorageMetrics(): Promise<void> {
    // Query MinIO for storage statistics
    const stats = await this.getStorageStats();
    this.storageSize.set({ bucket: 'collection-documents' }, stats.totalSize);
  }
}
```

#### 6.2 Cleanup Jobs
```typescript
// src/services/workflow-service/src/jobs/document-cleanup.job.ts
export class DocumentCleanupJob {
  async cleanupDeletedDocuments(): Promise<void> {
    // Find documents marked as deleted more than 30 days ago
    const deletedDocuments = await this.documentRepository.find({
      where: {
        status: 'deleted',
        deletedAt: LessThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      }
    });

    for (const doc of deletedDocuments) {
      try {
        // Delete from storage
        await this.storageService.deleteFile(doc.storagePath, doc.storageBucket);
        
        // Delete from database
        await this.documentRepository.delete(doc.id);
        
        logger.info(`Cleaned up document ${doc.id}`);
      } catch (error) {
        logger.error(`Failed to cleanup document ${doc.id}:`, error);
      }
    }
  }

  async cleanupOrphanedFiles(): Promise<void> {
    // List all files in storage
    const storageFiles = await this.storageService.listAllFiles();
    
    // Get all document paths from database
    const dbPaths = await this.documentRepository
      .createQueryBuilder('document')
      .select('document.storagePath')
      .getRawMany();
    
    const dbPathSet = new Set(dbPaths.map(d => d.storagePath));
    
    // Find orphaned files
    const orphanedFiles = storageFiles.filter(file => !dbPathSet.has(file.path));
    
    for (const file of orphanedFiles) {
      await this.storageService.deleteFile(file.path, file.bucket);
      logger.info(`Cleaned up orphaned file ${file.path}`);
    }
  }
}
```

## Document Types and Categories

### Document Types
```typescript
export enum DocumentType {
  // Identity Documents
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  
  // Financial Documents
  BANK_STATEMENT = 'BANK_STATEMENT',
  SALARY_SLIP = 'SALARY_SLIP',
  TAX_RETURN = 'TAX_RETURN',
  
  // Loan Documents
  LOAN_AGREEMENT = 'LOAN_AGREEMENT',
  PROMISSORY_NOTE = 'PROMISSORY_NOTE',
  COLLATERAL_DOCS = 'COLLATERAL_DOCS',
  
  // Collection Documents
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  SETTLEMENT_AGREEMENT = 'SETTLEMENT_AGREEMENT',
  LEGAL_NOTICE = 'LEGAL_NOTICE',
  
  // Other
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
```

## API Endpoints

### Document Upload
```
POST /api/v1/documents/upload
Content-Type: multipart/form-data

Form fields:
- documents: File[] (required)
- cif: string (required)
- loanAccountNumber: string (optional)
- documentType: DocumentType (required)
- documentCategory: DocumentCategory (required)
- metadata: JSON (optional)
- tags: string[] (optional)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fileName": "document.pdf",
      "status": "success"
    }
  ]
}
```

### Get Customer Documents
```
GET /api/v1/documents/customer/:cif?documentType=NATIONAL_ID&loanAccountNumber=123

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cif": "CIF123",
      "documentType": "NATIONAL_ID",
      "fileName": "id-card.pdf",
      "fileSize": 1024000,
      "uploadedAt": "2024-01-15T10:00:00Z",
      "uploadedBy": "John Doe"
    }
  ]
}
```

### Download Document
```
GET /api/v1/documents/:id/download

Response: Binary file stream with appropriate headers
```

### Delete Document
```
DELETE /api/v1/documents/:id

Response:
{
  "success": true,
  "message": "Document deleted successfully"
}
```

## Testing Strategy

### Unit Tests
- Storage service methods
- Document validation logic
- Security checks
- File path generation

### Integration Tests
- Complete upload flow
- Download with access control
- Database transactions
- MinIO integration

### Performance Tests
- Large file uploads (up to 50MB)
- Concurrent uploads
- Bulk document retrieval

## Migration Path

### From POC to Production
1. **Storage Migration**: Move from MinIO to AWS S3
   - Update storage service to use AWS SDK
   - Implement S3 bucket policies
   - Set up CloudFront for CDN

2. **Security Enhancements**
   - Integrate enterprise antivirus API
   - Implement document encryption at rest
   - Add watermarking for sensitive documents

3. **Performance Optimization**
   - Implement document thumbnails
   - Add full-text search with Elasticsearch
   - Use queue for async processing

4. **Compliance Features**
   - Document retention policies
   - Audit trail enhancements
   - GDPR compliance tools

## Rollback Plan

In case of issues:
1. Disable document routes in API Gateway
2. Preserve uploaded documents in MinIO
3. Keep database records intact
4. Fix issues and re-enable incrementally

## Success Metrics

- Upload success rate > 99%
- Average upload time < 5 seconds for 10MB files
- Zero data loss incidents
- Download availability > 99.9%
- User adoption rate > 80% within 3 months