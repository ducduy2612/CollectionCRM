import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { storageConfig } from '../config/storage.config';
import { documentSecurityService } from '../services/document-security.service';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { logger } from '../utils/logger';

// Memory storage for file processing
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Basic MIME type check
    if (storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        `Invalid file type '${file.mimetype}'. Allowed types: ${storageConfig.upload.allowedMimeTypes.join(', ')}`
      );
      cb(error as any, false);
    }
  } catch (error) {
    logger.error('File filter error:', error);
    cb(error as any, false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: storageConfig.upload.maxFileSize,
    files: 10, // Maximum 10 files per upload
    fields: 20, // Maximum number of form fields
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

/**
 * Middleware for single file upload
 */
export const uploadSingle = upload.single('document');

/**
 * Middleware for multiple file upload
 */
export const uploadMultiple = upload.array('documents', 10);

/**
 * Enhanced validation middleware that runs after multer
 */
export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    const file = req.file as Express.Multer.File;

    // Determine which files to validate
    const filesToValidate = files || (file ? [file] : []);

    if (filesToValidate.length === 0) {
      throw Errors.create(
        Errors.Validation.REQUIRED_FIELD_MISSING,
        'No files provided for upload',
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    // Validate files using security service
    const validation = documentSecurityService.validateFiles(filesToValidate);

    if (!validation.isValid) {
      throw Errors.create(
        Errors.Validation.INVALID_VALUE,
        `File validation failed: ${validation.errors.join(', ')}`,
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      logger.warn('File upload warnings:', {
        warnings: validation.warnings,
        fileCount: filesToValidate.length
      });
    }

    // Attach validation results to request for later use
    req.fileValidation = validation;

    next();
  } catch (error) {
    logger.error('Document upload validation failed:', error);
    next(error);
  }
};

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        const maxSizeMB = Math.round(storageConfig.upload.maxFileSize / 1024 / 1024);
        return res.status(400).json({
          success: false,
          error: `File too large. Maximum size allowed is ${maxSizeMB}MB`,
          code: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 10 files allowed per upload',
          code: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field name',
          code: 'UNEXPECTED_FILE'
        });
      
      default:
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`,
          code: 'UPLOAD_ERROR'
        });
    }
  }

  // Handle other file-related errors
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Pass other errors to global error handler
  next(error);
};

/**
 * Middleware to add request properties type definitions
 */
declare global {
  namespace Express {
    interface Request {
      fileValidation?: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
      };
    }
  }
}

export default {
  uploadSingle,
  uploadMultiple,
  validateDocumentUpload,
  handleUploadError
};