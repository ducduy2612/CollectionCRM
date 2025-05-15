import { Request, Response, NextFunction } from 'express';

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
 * Error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      errors: [
        {
          code: err.name,
          message: err.message,
          details: err.details
        }
      ]
    });
  }

  // Handle TypeORM errors
  if (err.name === 'QueryFailedError') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Database query failed',
      errors: [
        {
          code: 'DATABASE_ERROR',
          message: 'An error occurred while executing the database query',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
      ]
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validation failed',
      errors: [
        {
          code: 'VALIDATION_ERROR',
          message: err.message
        }
      ]
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Authentication failed',
      errors: [
        {
          code: 'AUTH_ERROR',
          message: err.message
        }
      ]
    });
  }

  // Handle all other errors
  const statusCode = 500;
  const message = 'Internal server error';
  
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors: [
      {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : message
      }
    ]
  });
};

/**
 * Not found handler middleware
 * Handles 404 errors for routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    data: null,
    message: 'Resource not found',
    errors: [
      {
        code: 'NOT_FOUND',
        message: `The requested resource at ${req.originalUrl} was not found`
      }
    ]
  });
};