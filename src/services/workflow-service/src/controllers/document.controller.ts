import { Request, Response, NextFunction } from 'express';
import { DocumentRepository } from '../repositories/document.repository';
import { DocumentAccessLogRepository } from '../repositories/document-access-log.repository';
import { storageService } from '../services/storage.service';
import { documentSecurityService } from '../services/document-security.service';
import { ResponseUtil } from '../utils/response';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { logger } from '../utils/logger';

export class DocumentController {

  /**
   * @route POST /api/v1/documents/upload
   * @description Upload one or multiple documents
   * @access Private - Requires authentication and agent context
   */
  async uploadDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const { cif, loanAccountNumber, documentType, documentCategory, metadata, tags } = req.body;
      const agentId = req.user!.agentId!;

      // Validate multiple files
      const validation = documentSecurityService.validateFiles(files);
      if (!validation.isValid) {
        throw Errors.validation('File validation failed', { errors: validation.errors });
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn('File upload warnings', { warnings: validation.warnings });
      }

      const uploadResults = [];

      for (const file of files) {
        try {
          // Upload to storage
          const storageResult = await storageService.uploadFile(file, {
            cif,
            documentType,
            uploadedBy: agentId
          });

          // Parse metadata if provided as string
          let parsedMetadata = metadata;
          if (typeof metadata === 'string') {
            try {
              parsedMetadata = JSON.parse(metadata);
            } catch {
              parsedMetadata = {};
            }
          }

          // Parse tags if provided as string
          let parsedTags = tags;
          if (typeof tags === 'string') {
            parsedTags = tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
          }

          // Save metadata to database
          const document = await DocumentRepository.save({
            cif,
            loanAccountNumber: loanAccountNumber || null,
            documentType: documentType,
            documentCategory: documentCategory,
            fileName: storageResult.fileName,
            originalFileName: file.originalname,
            fileSize: storageResult.size,
            mimeType: file.mimetype,
            storagePath: storageResult.storagePath,
            storageBucket: storageResult.bucket,
            checksum: storageResult.checksum,
            metadata: parsedMetadata,
            tags: parsedTags,
            uploadedBy: agentId,
            createdBy: agentId,
            status: 'active'
          });

          // Log upload action
          await DocumentAccessLogRepository.save({
            documentId: document.id,
            agentId,
            action: 'upload',
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          });

          uploadResults.push({
            id: document.id,
            fileName: document.originalFileName,
            status: 'success'
          });

          logger.info('Document uploaded successfully', {
            documentId: document.id,
            cif,
            fileName: file.originalname,
            agentId
          });
        } catch (error) {
          logger.error('Failed to upload document', {
            fileName: file.originalname,
            error,
            cif,
            agentId
          });

          uploadResults.push({
            fileName: file.originalname,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return ResponseUtil.success(res, uploadResults, 'Documents uploaded');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error uploading documents');
      next(error);
    }
  }

  /**
   * @route GET /api/v1/documents/customer/:cif
   * @description Get all documents for a customer
   * @access Private - Requires authentication and agent context
   */
  async getCustomerDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { documentType, loanAccountNumber, documentCategory } = req.query;

      const documents = await DocumentRepository.findByCustomer(cif, {
        documentType: documentType as string,
        loanAccountNumber: loanAccountNumber as string,
        documentCategory: documentCategory as string
      });

      return ResponseUtil.success(res, documents, 'Customer documents retrieved');
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.READ,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getCustomerDocuments' }
      );
    }
  }

  /**
   * @route GET /api/v1/documents/loan/:loanAccountNumber
   * @description Get all documents for a specific loan
   * @access Private - Requires authentication and agent context
   */
  async getLoanDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { loanAccountNumber } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const documents = await DocumentRepository.findByLoan(loanAccountNumber);

      return ResponseUtil.success(res, documents, 'Loan documents retrieved');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting loan documents');
      next(error);
    }
  }

  /**
   * @route GET /api/v1/documents/:id
   * @description Get document metadata by ID
   * @access Private - Requires authentication and agent context
   */
  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const document = await DocumentRepository.findById(id);
      if (!document) {
        throw Errors.notFound('Document not found', { documentId: id });
      }

      return ResponseUtil.success(res, document, 'Document retrieved');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting document');
      next(error);
    }
  }

  /**
   * @route GET /api/v1/documents/:id/download
   * @description Download a document
   * @access Private - Requires authentication and agent context
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agentId = req.user!.agentId!;

      const document = await DocumentRepository.findById(id);
      if (!document || document.status !== 'active') {
        throw Errors.notFound('Document not found', { documentId: id });
      }

      // Get file stream from storage
      const fileStream = await storageService.downloadFile(
        document.storagePath,
        document.storageBucket
      );

      // Log access
      await DocumentAccessLogRepository.save({
        documentId: document.id,
        agentId,
        action: 'download',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      });

      logger.info('Document downloaded', {
        documentId: document.id,
        agentId,
        fileName: document.originalFileName
      });

      // Set response headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', document.fileSize.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalFileName}"`);

      // Stream file to response
      fileStream.pipe(res);
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error downloading document');
      next(error);
    }
  }

  /**
   * @route GET /api/v1/documents/:id/presigned-url
   * @description Get a presigned URL for direct download
   * @access Private - Requires authentication and agent context
   */
  async getPresignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { expiry = 3600 } = req.query; // Default 1 hour
      const agentId = req.user!.agentId!;

      const document = await DocumentRepository.findById(id);
      if (!document || document.status !== 'active') {
        throw Errors.notFound('Document not found', { documentId: id });
      }

      // Generate presigned URL
      const presignedUrl = await storageService.generatePresignedUrl(
        document.storagePath,
        document.storageBucket,
        Number(expiry)
      );

      // Log access
      await DocumentAccessLogRepository.save({
        documentId: document.id,
        agentId,
        action: 'view',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      });

      logger.info('Presigned URL generated', {
        documentId: document.id,
        agentId,
        expiry: Number(expiry)
      });

      return ResponseUtil.success(res, { 
        url: presignedUrl,
        expiresIn: Number(expiry),
        fileName: document.originalFileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize
      }, 'Presigned URL generated');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error generating presigned URL');
      next(error);
    }
  }

  /**
   * @route DELETE /api/v1/documents/:id
   * @description Soft delete a document
   * @access Private - Requires authentication and agent context
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agentId = req.user!.agentId!;

      const document = await DocumentRepository.findById(id);
      if (!document || document.status !== 'active') {
        throw Errors.notFound('Document not found', { documentId: id });
      }

      // Soft delete in database
      await DocumentRepository.softDeleteDocument(id, agentId);

      // Log deletion
      await DocumentAccessLogRepository.save({
        documentId: document.id,
        agentId,
        action: 'delete',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      });

      logger.info('Document deleted', {
        documentId: document.id,
        agentId,
        fileName: document.originalFileName
      });

      return ResponseUtil.success(res, { id, message: 'Document deleted successfully' }, 'Document deleted');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting document');
      next(error);
    }
  }

  /**
   * @route GET /api/v1/documents/statistics/customer/:cif
   * @description Get document statistics for a customer
   * @access Private - Requires authentication and agent context
   */
  async getCustomerDocumentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;

      const stats = await DocumentRepository.getDocumentStatistics();

      return ResponseUtil.success(res, stats, 'Document statistics retrieved');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting document statistics');
      next(error);
    }
  }

}

// Export singleton instance
export const documentController = new DocumentController();