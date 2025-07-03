import { createHash } from 'crypto';
import { storageConfig } from '../config/storage.config';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScanResult {
  clean: boolean;
  details: string;
}

export class DocumentSecurityService {
  /**
   * Validate file before upload
   */
  validateFile(file: Express.Multer.File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file size
      if (file.size > storageConfig.upload.maxFileSize) {
        errors.push(
          `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(storageConfig.upload.maxFileSize)}`
        );
      }

      // Check MIME type
      if (!storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
        errors.push(
          `File type '${file.mimetype}' is not allowed. Allowed types: ${storageConfig.upload.allowedMimeTypes.join(', ')}`
        );
      }

      // Check filename
      if (!file.originalname || file.originalname.trim().length === 0) {
        errors.push('File must have a valid filename');
      }

      // Check for suspicious file extensions
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
      const fileExtension = this.getFileExtension(file.originalname).toLowerCase();
      
      if (suspiciousExtensions.includes(fileExtension)) {
        errors.push(`File extension '${fileExtension}' is not allowed for security reasons`);
      }

      // Check filename length
      if (file.originalname.length > 255) {
        warnings.push('Filename is very long and will be truncated');
      }

      // Check for special characters in filename
      const hasSpecialChars = /[<>:"/\\|?*\x00-\x1f]/.test(file.originalname);
      if (hasSpecialChars) {
        warnings.push('Filename contains special characters that will be sanitized');
      }


      logger.info('File validation completed', {
        fileName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        isValid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('File validation failed:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE,
        { fileName: file.originalname, operation: 'validateFile' }
      );
    }
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: Express.Multer.File[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    if (files.length === 0) {
      allErrors.push('No files provided for upload');
      return { isValid: false, errors: allErrors, warnings: allWarnings };
    }

    if (files.length > 10) {
      allErrors.push('Maximum 10 files can be uploaded at once');
    }

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = storageConfig.upload.maxFileSize * 5; // 5 times single file limit

    if (totalSize > maxTotalSize) {
      allErrors.push(
        `Total upload size ${this.formatFileSize(totalSize)} exceeds maximum allowed total size of ${this.formatFileSize(maxTotalSize)}`
      );
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      
      validation.errors.forEach(error => {
        allErrors.push(`File ${index + 1} (${file.originalname}): ${error}`);
      });
      
      validation.warnings.forEach(warning => {
        allWarnings.push(`File ${index + 1} (${file.originalname}): ${warning}`);
      });
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }


  /**
   * Generate file checksum for integrity verification
   */
  generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Verify file integrity using checksum
   */
  verifyChecksum(buffer: Buffer, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(buffer);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Sanitize filename for safe storage
   */
  sanitizeFileName(fileName: string): string {
    // Keep extension
    const extension = this.getFileExtension(fileName);
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    const sanitized = nameWithoutExt
      .replace(/[^a-z0-9.-]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
      .substring(0, 200); // Reasonable length limit
    
    return sanitized + extension;
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  /**
   * Format file size for human reading
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if file type is image
   */
  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file type is document
   */
  isDocumentFile(mimeType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    return documentTypes.includes(mimeType);
  }
}

// Export singleton instance
export const documentSecurityService = new DocumentSecurityService();