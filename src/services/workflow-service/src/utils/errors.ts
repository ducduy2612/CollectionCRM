/**
 * Error types
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  GENERAL = 'GENERAL'
}

/**
 * Operation types
 */
export enum OperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  EVENT_PROCESSING = 'EVENT_PROCESSING',
  STORAGE = 'STORAGE',
  GENERAL = 'GENERAL'
}

/**
 * Source system types
 */
export enum SourceSystemType {
  AUTH_SERVICE = 'AUTH_SERVICE',
  BANK_SYNC_SERVICE = 'BANK_SYNC_SERVICE',
  WORKFLOW_SERVICE = 'WORKFLOW_SERVICE',
  PAYMENT_SERVICE = 'PAYMENT_SERVICE',
  OTHER = 'OTHER'
}

/**
 * Error details interface
 */
export interface ErrorDetails {
  code: string;
  timestamp: Date;
  operationType: OperationType;
  sourceSystem: SourceSystemType;
  retryable: boolean;
  context?: Record<string, any>;
}

/**
 * Application error class
 */
export class AppError extends Error {
  type: ErrorType;
  details: ErrorDetails;

  constructor(
    message: string,
    type: ErrorType,
    details: ErrorDetails
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
  }
}

/**
 * Error code definitions
 */
export const GeneralErrorCodes = {
  UNKNOWN_ERROR: 'GENERAL_UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR: 'GENERAL_INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'GENERAL_SERVICE_UNAVAILABLE'
};

export const ValidationErrorCodes = {
  REQUIRED_FIELD_MISSING: 'VALIDATION_REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  INVALID_VALUE: 'VALIDATION_INVALID_VALUE',
  INVALID_DATE: 'VALIDATION_INVALID_DATE'
};

export const DatabaseErrorCodes = {
  CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  RECORD_NOT_FOUND: 'DATABASE_RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DATABASE_DUPLICATE_RECORD',
  FOREIGN_KEY_VIOLATION: 'DATABASE_FOREIGN_KEY_VIOLATION'
};

export const AuthErrorCodes = {
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  FORBIDDEN: 'AUTH_FORBIDDEN',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED'
};

/**
 * Error utilities
 */
export const Errors = {
  General: GeneralErrorCodes,
  Validation: ValidationErrorCodes,
  Database: DatabaseErrorCodes,
  Auth: AuthErrorCodes,

  /**
   * Create a new application error
   */
  create: (
    code: string,
    message: string,
    operationType: OperationType = OperationType.GENERAL,
    sourceSystem: SourceSystemType = SourceSystemType.WORKFLOW_SERVICE,
    context?: Record<string, any>,
    retryable: boolean = false
  ): AppError => {
    let type: ErrorType;

    if (code.startsWith('VALIDATION_')) {
      type = ErrorType.VALIDATION;
    } else if (code.startsWith('AUTH_')) {
      type = ErrorType.AUTH;
    } else if (code.startsWith('DATABASE_')) {
      type = ErrorType.DATABASE;
    } else if (code === 'DATABASE_RECORD_NOT_FOUND') {
      type = ErrorType.NOT_FOUND;
    } else {
      type = ErrorType.GENERAL;
    }

    return new AppError(message, type, {
      code,
      timestamp: new Date(),
      operationType,
      sourceSystem,
      retryable,
      context
    });
  },

  /**
   * Wrap an existing error as an application error
   */
  wrap: (
    error: Error,
    operationType: OperationType = OperationType.GENERAL,
    sourceSystem: SourceSystemType = SourceSystemType.WORKFLOW_SERVICE,
    context?: Record<string, any>,
    retryable: boolean = false
  ): AppError => {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(error.message, ErrorType.GENERAL, {
      code: GeneralErrorCodes.UNKNOWN_ERROR,
      timestamp: new Date(),
      operationType,
      sourceSystem,
      retryable,
      context: {
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        ...context
      }
    });
  },

  /**
   * Get HTTP status code for an error code
   */
  getHttpStatus: (code: string): number => {
    if (code.startsWith('VALIDATION_')) {
      return 400;
    } else if (code.startsWith('AUTH_UNAUTHORIZED') || code.startsWith('AUTH_INVALID_TOKEN') || code.startsWith('AUTH_TOKEN_EXPIRED')) {
      return 401;
    } else if (code.startsWith('AUTH_FORBIDDEN')) {
      return 403;
    } else if (code === 'DATABASE_RECORD_NOT_FOUND') {
      return 404;
    } else if (code === 'DATABASE_DUPLICATE_RECORD') {
      return 409;
    } else {
      return 500;
    }
  },

  /**
   * Create a validation error
   */
  validation: (
    message: string,
    context?: Record<string, any>
  ): AppError => {
    return Errors.create(
      ValidationErrorCodes.INVALID_VALUE,
      message,
      OperationType.VALIDATION,
      SourceSystemType.WORKFLOW_SERVICE,
      context
    );
  },

  /**
   * Create a not found error
   */
  notFound: (
    message: string,
    context?: Record<string, any>
  ): AppError => {
    return Errors.create(
      DatabaseErrorCodes.RECORD_NOT_FOUND,
      message,
      OperationType.READ,
      SourceSystemType.WORKFLOW_SERVICE,
      context
    );
  },

  /**
   * Create a forbidden error
   */
  forbidden: (
    message: string,
    context?: Record<string, any>
  ): AppError => {
    return Errors.create(
      AuthErrorCodes.FORBIDDEN,
      message,
      OperationType.AUTHORIZATION,
      SourceSystemType.WORKFLOW_SERVICE,
      context
    );
  }
};