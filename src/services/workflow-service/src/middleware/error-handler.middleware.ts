import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ErrorType,
  Errors
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Error handler middleware
 * Handles all errors thrown in the application using the error system
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({ err, path: req.path, method: req.method }, 'Error occurred');

  // Convert to AppError if it's not already
  const appError = err instanceof AppError
    ? err
    : Errors.wrap(err);
  
  // Get HTTP status code based on error code or type
  let statusCode = 500;
  
  if (appError instanceof AppError && appError.details.code) {
    statusCode = Errors.getHttpStatus(appError.details.code);
  } else {
    // Fallback status codes based on error type
    switch (appError.type) {
      case ErrorType.VALIDATION:
        statusCode = 400;
        break;
      case ErrorType.AUTH:
        statusCode = 401;
        break;
      case ErrorType.NOT_FOUND:
        statusCode = 404;
        break;
      case ErrorType.DATABASE:
        statusCode = 500;
        break;
      case ErrorType.EXTERNAL_SERVICE:
        statusCode = 502;
        break;
      default:
        statusCode = 500;
    }
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    data: null,
    message: appError.message,
    errors: [
      {
        code: appError.details.code || `ERR_${appError.type}`,
        message: appError.message,
        type: appError.type,
        details: process.env.NODE_ENV === 'development' ? {
          timestamp: appError.details.timestamp,
          operationType: appError.details.operationType,
          sourceSystem: appError.details.sourceSystem,
          retryable: appError.details.retryable,
          context: appError.details.context
        } : undefined
      }
    ]
  };

  return res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler middleware
 * Handles 404 errors for routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const notFoundError = Errors.create(
    Errors.General.UNKNOWN_ERROR,
    `The requested resource at ${req.originalUrl} was not found`
  );
  
  logger.warn({ path: req.path, method: req.method }, 'Resource not found');

  return res.status(404).json({
    success: false,
    data: null,
    message: notFoundError.message,
    errors: [
      {
        code: 'NOT_FOUND',
        message: notFoundError.message,
        type: ErrorType.NOT_FOUND
      }
    ]
  });
};