import { Client as MinioClient, ClientOptions } from 'minio';

export interface StorageConfig {
  minio: ClientOptions;
  buckets: {
    documents: string;
    temp: string;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    chunkSize: number;
  };
}

export const storageConfig: StorageConfig = {
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ],
    chunkSize: 5 * 1024 * 1024 // 5MB chunks for multipart upload
  }
};

// Create and export MinIO client instance
export const minioClient = new MinioClient(storageConfig.minio);