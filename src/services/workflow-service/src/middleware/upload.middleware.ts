import multer from 'multer';
import { Request } from 'express';
import { storageConfig } from '../config/storage.config';

/**
 * Configure multer for CSV file uploads
 */
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only CSV files
  if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

export const uploadCSV = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: storageConfig.upload.maxFileSize, // Use configurable limit (default 50MB)
    files: 1 // Only one file at a time
  }
});

