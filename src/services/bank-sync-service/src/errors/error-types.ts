/**
 * Error classification for the Bank Synchronization Microservice
 * Classifies errors into different categories for appropriate handling
 */

/**
 * Enum representing different error types
 */
export enum ErrorType {
  // Transient errors that may resolve on retry
  TRANSIENT = 'TRANSIENT',
  // Permanent errors that won't resolve with retries
  PERMANENT = 'PERMANENT',
  // Critical errors requiring immediate attention
  CRITICAL = 'CRITICAL',
  // Validation errors related to data format or business rules
  VALIDATION = 'VALIDATION',
  // Authentication/Authorization errors
  AUTH = 'AUTH',
  // Not found errors
  NOT_FOUND = 'NOT_FOUND',
  // Database errors
  DATABASE = 'DATABASE',
  // External service errors
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  // Unknown errors
  UNKNOWN = 'UNKNOWN'
}

/**
 * Enum representing different operation types
 */
export enum OperationType {
  // Database operations
  DATABASE = 'DATABASE',
  // External API calls
  API_CALL = 'API_CALL',
  // File operations
  FILE_OPERATION = 'FILE_OPERATION',
  // Authentication operations
  AUTH = 'AUTH',
  // Synchronization operations
  SYNC = 'SYNC',
  // Data transformation operations
  TRANSFORM = 'TRANSFORM',
  // Data validation operations
  VALIDATION = 'VALIDATION'
}

/**
 * Enum representing different source systems
 */
export enum SourceSystemType {
  T24 = 'T24',
  W4 = 'W4',
  OTHER = 'OTHER'
}

/**
 * Interface for error details
 */
export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: Date;
  operationType?: OperationType;
  sourceSystem?: SourceSystemType;
  retryable: boolean;
  context?: Record<string, any>;
}

/**
 * Base class for all application errors
 */
export class AppError extends Error {
  type: ErrorType;
  details: ErrorDetails;

  constructor(type: ErrorType, details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    
    // Set the prototype explicitly for better stack traces
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Determines if the error is retryable
   */
  isRetryable(): boolean {
    return this.details.retryable;
  }

  /**
   * Converts the error to a plain object for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Error class for transient errors
 */
export class TransientError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>) {
    super(ErrorType.TRANSIENT, { ...details, retryable: true });
    this.name = 'TransientError';
  }
}

/**
 * Error class for permanent errors
 */
export class PermanentError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>) {
    super(ErrorType.PERMANENT, { ...details, retryable: false });
    this.name = 'PermanentError';
  }
}

/**
 * Error class for critical errors
 */
export class CriticalError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>) {
    super(ErrorType.CRITICAL, { ...details, retryable: true });
    this.name = 'CriticalError';
  }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>) {
    super(ErrorType.VALIDATION, { ...details, retryable: false });
    this.name = 'ValidationError';
  }
}

/**
 * Error class for authentication/authorization errors
 */
export class AuthError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>) {
    super(ErrorType.AUTH, { ...details, retryable: false });
    this.name = 'AuthError';
  }
}

/**
 * Error class for not found errors
 */
export class NotFoundError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>) {
    super(ErrorType.NOT_FOUND, { ...details, retryable: false });
    this.name = 'NotFoundError';
  }
}

/**
 * Error class for database errors
 */
export class DatabaseError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>, retryable = true) {
    super(ErrorType.DATABASE, { ...details, retryable });
    this.name = 'DatabaseError';
  }
}

/**
 * Error class for external service errors
 */
export class ExternalServiceError extends AppError {
  constructor(details: Omit<ErrorDetails, 'retryable'>, retryable = true) {
    super(ErrorType.EXTERNAL_SERVICE, { ...details, retryable });
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error classifier utility
 */
export class ErrorClassifier {
  /**
   * Classifies an error based on its type and properties
   * @param error The error to classify
   * @returns The classified error type
   */
  static classify(error: Error): ErrorType {
    if (error instanceof AppError) {
      return error.type;
    }

    // Classify based on error name or message
    if (error.name === 'QueryFailedError' || error.message.includes('database')) {
      return ErrorType.DATABASE;
    }

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return ErrorType.AUTH;
    }

    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return ErrorType.VALIDATION;
    }

    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('ETIMEDOUT') || 
        error.message.includes('429') ||
        error.message.includes('timeout')) {
      return ErrorType.TRANSIENT;
    }

    if (error.message.includes('404') || error.message.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Determines if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isRetryable();
    }

    const errorType = this.classify(error);
    return errorType === ErrorType.TRANSIENT;
  }

  /**
   * Wraps a standard Error into an appropriate AppError
   * @param error The error to wrap
   * @param operationType The type of operation that caused the error
   * @param sourceSystem The source system involved
   * @returns An AppError instance
   */
  static wrapError(
    error: Error, 
    operationType?: OperationType, 
    sourceSystem?: SourceSystemType
  ): AppError {
    const errorType = this.classify(error);
    const details: ErrorDetails = {
      code: `ERR_${errorType}`,
      message: error.message,
      timestamp: new Date(),
      operationType,
      sourceSystem,
      retryable: errorType === ErrorType.TRANSIENT,
      context: { originalError: error.name }
    };

    switch (errorType) {
      case ErrorType.TRANSIENT:
        return new TransientError(details);
      case ErrorType.PERMANENT:
        return new PermanentError(details);
      case ErrorType.CRITICAL:
        return new CriticalError(details);
      case ErrorType.VALIDATION:
        return new ValidationError(details);
      case ErrorType.AUTH:
        return new AuthError(details);
      case ErrorType.NOT_FOUND:
        return new NotFoundError(details);
      case ErrorType.DATABASE:
        return new DatabaseError(details);
      case ErrorType.EXTERNAL_SERVICE:
        return new ExternalServiceError(details);
      default:
        return new AppError(ErrorType.UNKNOWN, { ...details, retryable: false });
    }
  }
}