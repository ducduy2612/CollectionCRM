import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.utils';

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: string;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not found error handler middleware
 * This middleware should be placed after all routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApiError(404, `Resource not found: ${req.path}`);
  next(error);
}

/**
 * Global error handler middleware
 * This middleware should be placed after all other middleware and routes
 */
export function errorHandler(err: Error | ApiError, req: Request, res: Response, next: NextFunction) {
  // Default status code and error name
  let statusCode = 500;
  let errorName = 'Internal Server Error';
  let errorDetails: any = undefined;
  
  // Check if this is a known API error
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorName = getErrorNameFromStatus(statusCode);
    errorDetails = err.details;
  }
  
  // Log the error
  logger.error(`${errorName}: ${err.message}`, {
    error: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    requestId: req.headers['x-request-id']
  });
  
  // Create error response
  const errorResponse: ErrorResponse = {
    error: errorName,
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string
  };
  
  // Include error details if available and not in production
  if (errorDetails && process.env.NODE_ENV !== 'production') {
    errorResponse.details = errorDetails;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Get a standardized error name from HTTP status code
 */
function getErrorNameFromStatus(statusCode: number): string {
  const statusCodes: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return statusCodes[statusCode] || 'Unknown Error';
}