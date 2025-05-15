/**
 * Error handling module for the Bank Synchronization Microservice
 * Exports all error-related types, classes, and utilities
 */

// Export error types and classes
export * from './error-types';

// Export error codes
export * from './error-codes';

// Export custom error factory
import { 
  AppError, 
  ErrorType, 
  ErrorClassifier, 
  OperationType, 
  SourceSystemType,
  ErrorDetails
} from './error-types';

import {
  GeneralErrorCodes,
  AuthErrorCodes,
  DatabaseErrorCodes,
  ExternalServiceErrorCodes,
  SyncErrorCodes,
  ValidationErrorCodes,
  T24ErrorCodes,
  W4ErrorCodes,
  getHttpStatusForErrorCode,
  isRetryableErrorCode
} from './error-codes';

/**
 * Factory function to create an error with the appropriate type and details
 * @param code The error code
 * @param message The error message
 * @param operationType The type of operation that caused the error
 * @param sourceSystem The source system involved
 * @param context Additional context for the error
 * @returns An AppError instance
 */
export function createError(
  code: string,
  message: string,
  operationType?: OperationType,
  sourceSystem?: SourceSystemType,
  context?: Record<string, any>
): AppError {
  const timestamp = new Date();
  const retryable = isRetryableErrorCode(code);
  
  const details: ErrorDetails = {
    code,
    message,
    timestamp,
    operationType,
    sourceSystem,
    retryable,
    context
  };

  // Determine error type based on code prefix
  if (code.startsWith('AUTH_')) {
    return new AppError(ErrorType.AUTH, details);
  } else if (code.startsWith('DB_')) {
    return new AppError(ErrorType.DATABASE, details);
  } else if (code.startsWith('EXT_')) {
    return new AppError(ErrorType.EXTERNAL_SERVICE, details);
  } else if (code.startsWith('SYNC_')) {
    // Determine if it's transient or permanent
    if (retryable) {
      return new AppError(ErrorType.TRANSIENT, details);
    } else {
      return new AppError(ErrorType.PERMANENT, details);
    }
  } else if (code.startsWith('VAL_')) {
    return new AppError(ErrorType.VALIDATION, details);
  } else if (code.startsWith('T24_') || code.startsWith('W4_')) {
    // External system errors
    if (retryable) {
      return new AppError(ErrorType.TRANSIENT, details);
    } else {
      return new AppError(ErrorType.EXTERNAL_SERVICE, details);
    }
  } else {
    // General errors
    if (retryable) {
      return new AppError(ErrorType.TRANSIENT, details);
    } else {
      return new AppError(ErrorType.PERMANENT, details);
    }
  }
}

/**
 * Wrap an existing error with additional context
 * @param error The original error
 * @param operationType The type of operation that caused the error
 * @param sourceSystem The source system involved
 * @param context Additional context for the error
 * @returns An AppError instance
 */
export function wrapError(
  error: Error,
  operationType?: OperationType,
  sourceSystem?: SourceSystemType,
  context?: Record<string, any>
): AppError {
  // If it's already an AppError, just add the additional context
  if (error instanceof AppError) {
    const updatedContext = {
      ...error.details.context,
      ...context
    };
    
    const updatedDetails: ErrorDetails = {
      ...error.details,
      operationType: operationType || error.details.operationType,
      sourceSystem: sourceSystem || error.details.sourceSystem,
      context: updatedContext
    };
    
    return new AppError(error.type, updatedDetails);
  }
  
  // Otherwise, classify and wrap the error
  return ErrorClassifier.wrapError(error, operationType, sourceSystem);
}

// Export a unified error handling API
export const Errors = {
  create: createError,
  wrap: wrapError,
  classify: ErrorClassifier.classify,
  isRetryable: ErrorClassifier.isRetryable,
  getHttpStatus: getHttpStatusForErrorCode,
  
  // Error code categories
  General: GeneralErrorCodes,
  Auth: AuthErrorCodes,
  Database: DatabaseErrorCodes,
  ExternalService: ExternalServiceErrorCodes,
  Sync: SyncErrorCodes,
  Validation: ValidationErrorCodes,
  T24: T24ErrorCodes,
  W4: W4ErrorCodes
};