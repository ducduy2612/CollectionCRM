import { Readable } from 'stream';
import crypto from 'crypto';
import { minioClient, storageConfig } from '../config/storage.config';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { logger } from '../utils/logger';

export interface UploadMetadata {
  cif: string;
  documentType: string;
  uploadedBy: string;
  loanAccountNumber?: string;
}

export interface StorageResult {
  fileName: string;
  storagePath: string;
  bucket: string;
  checksum: string;
  size: number;
}

export interface FileInfo {
  path: string;
  bucket: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export class StorageService {
  private initialized = false;

  constructor() {
    this.initializeBuckets();
  }

  /**
   * Initialize MinIO buckets
   */
  private async initializeBuckets(): Promise<void> {
    try {
      // Check and create documents bucket
      const documentsExists = await minioClient.bucketExists(storageConfig.buckets.documents);
      if (!documentsExists) {
        await minioClient.makeBucket(storageConfig.buckets.documents);
        logger.info(`Created bucket: ${storageConfig.buckets.documents}`);
      }

      // Check and create temp bucket
      const tempExists = await minioClient.bucketExists(storageConfig.buckets.temp);
      if (!tempExists) {
        await minioClient.makeBucket(storageConfig.buckets.temp);
        logger.info(`Created bucket: ${storageConfig.buckets.temp}`);
      }

      this.initialized = true;
      logger.info('Storage service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize storage service:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'initializeBuckets' }
      );
    }
  }

  /**
   * Ensure storage is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeBuckets();
    }
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(file: Express.Multer.File, metadata: UploadMetadata): Promise<StorageResult> {
    try {
      await this.ensureInitialized();

      // Generate file checksum
      const checksum = this.generateChecksum(file.buffer);
      
      // Generate unique filename
      const fileName = this.generateFileName(file.originalname, checksum);
      
      // Generate storage path
      const storagePath = this.generateStoragePath(metadata.cif, metadata.documentType, fileName);

      // Upload to MinIO
      await minioClient.putObject(
        storageConfig.buckets.documents,
        storagePath,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Document-Type': metadata.documentType,
          'X-CIF': metadata.cif,
          'X-Upload-User': metadata.uploadedBy,
          'X-Checksum': checksum,
          'X-Original-Name': file.originalname
        }
      );

      logger.info(`File uploaded successfully: ${storagePath}`, {
        fileName,
        size: file.size,
        checksum,
        cif: metadata.cif
      });

      return {
        fileName,
        storagePath,
        bucket: storageConfig.buckets.documents,
        checksum,
        size: file.size
      };
    } catch (error) {
      logger.error('Failed to upload file:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { metadata, fileName: file.originalname, operation: 'uploadFile' }
      );
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(storagePath: string, bucket: string = storageConfig.buckets.documents): Promise<Readable> {
    try {
      await this.ensureInitialized();

      const stream = await minioClient.getObject(bucket, storagePath);
      
      logger.info(`File downloaded: ${storagePath}`, { bucket });
      
      return stream;
    } catch (error) {
      logger.error('Failed to download file:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { storagePath, bucket, operation: 'downloadFile' }
      );
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string, bucket: string = storageConfig.buckets.documents): Promise<void> {
    try {
      await this.ensureInitialized();

      await minioClient.removeObject(bucket, storagePath);
      
      logger.info(`File deleted: ${storagePath}`, { bucket });
    } catch (error) {
      logger.error('Failed to delete file:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { storagePath, bucket, operation: 'deleteFile' }
      );
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(storagePath: string, bucket: string = storageConfig.buckets.documents): Promise<FileInfo> {
    try {
      await this.ensureInitialized();

      const stat = await minioClient.statObject(bucket, storagePath);
      
      return {
        path: storagePath,
        bucket,
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag
      };
    } catch (error) {
      logger.error('Failed to get file info:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { storagePath, bucket, operation: 'getFileInfo' }
      );
    }
  }

  /**
   * Generate a presigned URL for file access
   */
  async generatePresignedUrl(
    storagePath: string, 
    bucket: string = storageConfig.buckets.documents,
    expiry: number = 3600
  ): Promise<string> {
    try {
      await this.ensureInitialized();

      const url = await minioClient.presignedGetObject(bucket, storagePath, expiry);
      
      logger.info(`Generated presigned URL for: ${storagePath}`, { bucket, expiry });
      
      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { storagePath, bucket, expiry, operation: 'generatePresignedUrl' }
      );
    }
  }

  /**
   * List all files in a path
   */
  async listFiles(prefix: string = '', bucket: string = storageConfig.buckets.documents): Promise<FileInfo[]> {
    try {
      await this.ensureInitialized();

      const objects: FileInfo[] = [];
      const stream = minioClient.listObjects(bucket, prefix, true);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          objects.push({
            path: obj.name || '',
            bucket,
            size: obj.size || 0,
            lastModified: obj.lastModified || new Date(),
            etag: obj.etag || ''
          });
        });

        stream.on('error', (error) => {
          reject(Errors.wrap(
            error,
            OperationType.STORAGE,
            SourceSystemType.WORKFLOW_SERVICE,
            { prefix, bucket, operation: 'listFiles' }
          ));
        });

        stream.on('end', () => {
          resolve(objects);
        });
      });
    } catch (error) {
      logger.error('Failed to list files:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { prefix, bucket, operation: 'listFiles' }
      );
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(storagePath: string, bucket: string = storageConfig.buckets.documents): Promise<boolean> {
    try {
      await this.ensureInitialized();
      await minioClient.statObject(bucket, storagePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(bucket: string = storageConfig.buckets.documents): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    try {
      const files = await this.listFiles('', bucket);
      
      return {
        totalFiles: files.length,
        totalSize: files.reduce((total, file) => total + file.size, 0)
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.STORAGE,
        SourceSystemType.WORKFLOW_SERVICE,
        { bucket, operation: 'getStorageStats' }
      );
    }
  }

  /**
   * Generate file checksum
   */
  private generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string, checksum: string): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(originalName);
    const sanitizedName = this.sanitizeFileName(originalName);
    
    return `${checksum.substring(0, 8)}-${timestamp}-${sanitizedName}${extension}`;
  }

  /**
   * Generate storage path with hierarchy
   */
  private generateStoragePath(cif: string, documentType: string, fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `customers/${cif}/${documentType}/${year}/${month}/${fileName}`;
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }

  /**
   * Sanitize filename for safe storage
   */
  private sanitizeFileName(fileName: string): string {
    // Remove extension for sanitization
    const name = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    return name
      .replace(/[^a-z0-9.-]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
      .substring(0, 100); // Limit length
  }
}

// Export singleton instance
export const storageService = new StorageService();