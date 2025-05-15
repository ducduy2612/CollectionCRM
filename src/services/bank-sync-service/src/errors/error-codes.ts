/**
 * Error codes for the Bank Synchronization Microservice
 * These codes are used to identify specific error scenarios
 */

/**
 * General error codes
 */
export enum GeneralErrorCodes {
  UNKNOWN_ERROR = 'GEN_001',
  INVALID_INPUT = 'GEN_002',
  OPERATION_TIMEOUT = 'GEN_003',
  RESOURCE_EXHAUSTED = 'GEN_004',
  INTERNAL_ERROR = 'GEN_005',
  NOT_IMPLEMENTED = 'GEN_006'
}

/**
 * Authentication error codes
 */
export enum AuthErrorCodes {
  INVALID_TOKEN = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  INSUFFICIENT_PERMISSIONS = 'AUTH_003',
  UNAUTHORIZED = 'AUTH_004',
  INVALID_CREDENTIALS = 'AUTH_005'
}

/**
 * Database error codes
 */
export enum DatabaseErrorCodes {
  CONNECTION_FAILED = 'DB_001',
  QUERY_FAILED = 'DB_002',
  TRANSACTION_FAILED = 'DB_003',
  CONSTRAINT_VIOLATION = 'DB_004',
  RECORD_NOT_FOUND = 'DB_005',
  DUPLICATE_RECORD = 'DB_006',
  DEADLOCK_DETECTED = 'DB_007'
}

/**
 * External service error codes
 */
export enum ExternalServiceErrorCodes {
  CONNECTION_FAILED = 'EXT_001',
  TIMEOUT = 'EXT_002',
  INVALID_RESPONSE = 'EXT_003',
  SERVICE_UNAVAILABLE = 'EXT_004',
  RATE_LIMITED = 'EXT_005',
  AUTHENTICATION_FAILED = 'EXT_006'
}

/**
 * Synchronization error codes
 */
export enum SyncErrorCodes {
  EXTRACTION_FAILED = 'SYNC_001',
  TRANSFORMATION_FAILED = 'SYNC_002',
  LOADING_FAILED = 'SYNC_003',
  INVALID_DATA_FORMAT = 'SYNC_004',
  SYNC_CONFLICT = 'SYNC_005',
  SYNC_TIMEOUT = 'SYNC_006',
  PARTIAL_SYNC = 'SYNC_007'
}

/**
 * Validation error codes
 */
export enum ValidationErrorCodes {
  REQUIRED_FIELD_MISSING = 'VAL_001',
  INVALID_FORMAT = 'VAL_002',
  VALUE_OUT_OF_RANGE = 'VAL_003',
  INVALID_REFERENCE = 'VAL_004',
  BUSINESS_RULE_VIOLATION = 'VAL_005'
}

/**
 * T24 specific error codes
 */
export enum T24ErrorCodes {
  CONNECTION_FAILED = 'T24_001',
  AUTHENTICATION_FAILED = 'T24_002',
  INVALID_RESPONSE = 'T24_003',
  RECORD_NOT_FOUND = 'T24_004',
  TIMEOUT = 'T24_005',
  RATE_LIMITED = 'T24_006'
}

/**
 * W4 specific error codes
 */
export enum W4ErrorCodes {
  CONNECTION_FAILED = 'W4_001',
  AUTHENTICATION_FAILED = 'W4_002',
  INVALID_RESPONSE = 'W4_003',
  RECORD_NOT_FOUND = 'W4_004',
  TIMEOUT = 'W4_005',
  RATE_LIMITED = 'W4_006'
}

/**
 * Mapping of error codes to HTTP status codes
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<string, number> = {
  // General errors
  [GeneralErrorCodes.UNKNOWN_ERROR]: 500,
  [GeneralErrorCodes.INVALID_INPUT]: 400,
  [GeneralErrorCodes.OPERATION_TIMEOUT]: 504,
  [GeneralErrorCodes.RESOURCE_EXHAUSTED]: 429,
  [GeneralErrorCodes.INTERNAL_ERROR]: 500,
  [GeneralErrorCodes.NOT_IMPLEMENTED]: 501,

  // Authentication errors
  [AuthErrorCodes.INVALID_TOKEN]: 401,
  [AuthErrorCodes.TOKEN_EXPIRED]: 401,
  [AuthErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
  [AuthErrorCodes.UNAUTHORIZED]: 401,
  [AuthErrorCodes.INVALID_CREDENTIALS]: 401,

  // Database errors
  [DatabaseErrorCodes.CONNECTION_FAILED]: 503,
  [DatabaseErrorCodes.QUERY_FAILED]: 500,
  [DatabaseErrorCodes.TRANSACTION_FAILED]: 500,
  [DatabaseErrorCodes.CONSTRAINT_VIOLATION]: 400,
  [DatabaseErrorCodes.RECORD_NOT_FOUND]: 404,
  [DatabaseErrorCodes.DUPLICATE_RECORD]: 409,
  [DatabaseErrorCodes.DEADLOCK_DETECTED]: 500,

  // External service errors
  [ExternalServiceErrorCodes.CONNECTION_FAILED]: 503,
  [ExternalServiceErrorCodes.TIMEOUT]: 504,
  [ExternalServiceErrorCodes.INVALID_RESPONSE]: 502,
  [ExternalServiceErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ExternalServiceErrorCodes.RATE_LIMITED]: 429,
  [ExternalServiceErrorCodes.AUTHENTICATION_FAILED]: 401,

  // Synchronization errors
  [SyncErrorCodes.EXTRACTION_FAILED]: 500,
  [SyncErrorCodes.TRANSFORMATION_FAILED]: 500,
  [SyncErrorCodes.LOADING_FAILED]: 500,
  [SyncErrorCodes.INVALID_DATA_FORMAT]: 400,
  [SyncErrorCodes.SYNC_CONFLICT]: 409,
  [SyncErrorCodes.SYNC_TIMEOUT]: 504,
  [SyncErrorCodes.PARTIAL_SYNC]: 207,

  // Validation errors
  [ValidationErrorCodes.REQUIRED_FIELD_MISSING]: 400,
  [ValidationErrorCodes.INVALID_FORMAT]: 400,
  [ValidationErrorCodes.VALUE_OUT_OF_RANGE]: 400,
  [ValidationErrorCodes.INVALID_REFERENCE]: 400,
  [ValidationErrorCodes.BUSINESS_RULE_VIOLATION]: 422,

  // T24 errors
  [T24ErrorCodes.CONNECTION_FAILED]: 503,
  [T24ErrorCodes.AUTHENTICATION_FAILED]: 401,
  [T24ErrorCodes.INVALID_RESPONSE]: 502,
  [T24ErrorCodes.RECORD_NOT_FOUND]: 404,
  [T24ErrorCodes.TIMEOUT]: 504,
  [T24ErrorCodes.RATE_LIMITED]: 429,

  // W4 errors
  [W4ErrorCodes.CONNECTION_FAILED]: 503,
  [W4ErrorCodes.AUTHENTICATION_FAILED]: 401,
  [W4ErrorCodes.INVALID_RESPONSE]: 502,
  [W4ErrorCodes.RECORD_NOT_FOUND]: 404,
  [W4ErrorCodes.TIMEOUT]: 504,
  [W4ErrorCodes.RATE_LIMITED]: 429
};

/**
 * Get HTTP status code for an error code
 * @param errorCode The error code
 * @returns The corresponding HTTP status code (defaults to 500)
 */
export function getHttpStatusForErrorCode(errorCode: string): number {
  return ERROR_CODE_TO_HTTP_STATUS[errorCode] || 500;
}

/**
 * Mapping of error codes to whether they are retryable
 */
export const RETRYABLE_ERROR_CODES: Set<string> = new Set([
  // General errors
  GeneralErrorCodes.OPERATION_TIMEOUT,
  GeneralErrorCodes.RESOURCE_EXHAUSTED,
  
  // Database errors
  DatabaseErrorCodes.CONNECTION_FAILED,
  DatabaseErrorCodes.QUERY_FAILED,
  DatabaseErrorCodes.TRANSACTION_FAILED,
  DatabaseErrorCodes.DEADLOCK_DETECTED,
  
  // External service errors
  ExternalServiceErrorCodes.CONNECTION_FAILED,
  ExternalServiceErrorCodes.TIMEOUT,
  ExternalServiceErrorCodes.SERVICE_UNAVAILABLE,
  ExternalServiceErrorCodes.RATE_LIMITED,
  
  // Synchronization errors
  SyncErrorCodes.EXTRACTION_FAILED,
  SyncErrorCodes.LOADING_FAILED,
  SyncErrorCodes.SYNC_TIMEOUT,
  
  // T24 errors
  T24ErrorCodes.CONNECTION_FAILED,
  T24ErrorCodes.TIMEOUT,
  T24ErrorCodes.RATE_LIMITED,
  
  // W4 errors
  W4ErrorCodes.CONNECTION_FAILED,
  W4ErrorCodes.TIMEOUT,
  W4ErrorCodes.RATE_LIMITED
]);

/**
 * Check if an error code is retryable
 * @param errorCode The error code to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableErrorCode(errorCode: string): boolean {
  return RETRYABLE_ERROR_CODES.has(errorCode);
}