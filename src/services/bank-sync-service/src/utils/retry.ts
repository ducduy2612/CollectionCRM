/**
 * Retry utility for the Bank Synchronization Microservice
 * Implements retry policies with exponential backoff for handling transient errors
 */

import { Errors, ErrorType, OperationType, SourceSystemType } from '../errors';

/**
 * Interface for retry options
 */
export interface RetryOptions {
  // Maximum number of retry attempts
  maxAttempts: number;
  
  // Initial delay in milliseconds
  initialDelayMs: number;
  
  // Maximum delay in milliseconds
  maxDelayMs: number;
  
  // Backoff factor for exponential backoff
  backoffFactor: number;
  
  // Whether to add jitter to the delay
  jitter: boolean;
  
  // Timeout for each attempt in milliseconds
  timeoutMs?: number;
  
  // Function to determine if an error is retryable
  retryableErrorPredicate?: (error: Error) => boolean;
  
  // Function to execute before each retry
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
  timeoutMs: 10000, // 10 seconds
  retryableErrorPredicate: Errors.isRetryable,
  onRetry: (error, attempt, delay) => {
    console.warn(`Retry attempt ${attempt} after ${delay}ms due to error: ${error.message}`);
  }
};

/**
 * Predefined retry policies for different operation types
 */
export const RETRY_POLICIES: Record<OperationType, RetryOptions> = {
  [OperationType.DATABASE]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 10000
  },
  [OperationType.API_CALL]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 15000
  },
  [OperationType.FILE_OPERATION]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000
  },
  [OperationType.AUTH]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000
  },
  [OperationType.SYNC]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000
  },
  [OperationType.TRANSFORM]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 2,
    initialDelayMs: 500,
    maxDelayMs: 5000
  },
  [OperationType.VALIDATION]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 1, // Validation errors are typically not retryable
    initialDelayMs: 0,
    maxDelayMs: 0
  }
};

/**
 * Predefined retry policies for different source systems
 */
export const SOURCE_SYSTEM_RETRY_POLICIES: Record<SourceSystemType, RetryOptions> = {
  [SourceSystemType.T24]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 4,
    initialDelayMs: 2000,
    maxDelayMs: 45000
  },
  [SourceSystemType.W4]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 3,
    initialDelayMs: 1500,
    maxDelayMs: 30000
  },
  [SourceSystemType.OTHER]: {
    ...DEFAULT_RETRY_OPTIONS,
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 20000
  }
};

/**
 * Calculate the delay for a retry attempt with exponential backoff
 * @param attempt The current attempt number (0-based)
 * @param options The retry options
 * @returns The delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: RetryOptions): number {
  // Calculate exponential backoff
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffFactor, attempt);
  
  // Apply maximum delay limit
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);
  
  // Apply jitter if enabled (adds or subtracts up to 20% of the delay)
  if (options.jitter) {
    const jitterFactor = 0.2; // 20% jitter
    const jitterRange = cappedDelay * jitterFactor;
    return cappedDelay - jitterRange + (Math.random() * jitterRange * 2);
  }
  
  return cappedDelay;
}

/**
 * Sleep for a specified duration
 * @param ms The duration to sleep in milliseconds
 * @returns A promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 * @param fn The function to execute
 * @param options The retry options
 * @returns A promise that resolves with the result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // Merge with default options
  const retryOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };
  
  let attempt = 0;
  
  while (true) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      // Increment attempt counter
      attempt++;
      
      // Check if we've exceeded the maximum number of attempts
      if (attempt >= retryOptions.maxAttempts) {
        throw error;
      }
      
      // Check if the error is retryable
      const isRetryable = retryOptions.retryableErrorPredicate?.(error as Error) ?? true;
      if (!isRetryable) {
        throw error;
      }
      
      // Calculate the delay for this retry attempt
      const delay = calculateBackoffDelay(attempt, retryOptions);
      
      // Execute the onRetry callback if provided
      if (retryOptions.onRetry) {
        retryOptions.onRetry(error as Error, attempt, delay);
      }
      
      // Wait for the calculated delay
      await sleep(delay);
    }
  }
}

/**
 * Retry policy manager for getting appropriate retry policies
 */
export class RetryPolicyManager {
  private customPolicies: Map<string, RetryOptions> = new Map();
  
  /**
   * Get a retry policy for a specific operation type
   * @param operationType The operation type
   * @returns The retry policy for the operation type
   */
  getPolicy(operationType: OperationType): RetryOptions {
    return RETRY_POLICIES[operationType];
  }
  
  /**
   * Get a retry policy for a specific source system
   * @param sourceSystem The source system
   * @returns The retry policy for the source system
   */
  getSourceSystemPolicy(sourceSystem: SourceSystemType): RetryOptions {
    return SOURCE_SYSTEM_RETRY_POLICIES[sourceSystem];
  }
  
  /**
   * Get a retry policy for a specific error type
   * @param errorType The error type
   * @returns The retry policy for the error type
   */
  getErrorTypePolicy(errorType: ErrorType): RetryOptions {
    switch (errorType) {
      case ErrorType.TRANSIENT:
        return {
          ...DEFAULT_RETRY_OPTIONS,
          maxAttempts: 5,
          initialDelayMs: 1000,
          maxDelayMs: 30000
        };
      case ErrorType.CRITICAL:
        return {
          ...DEFAULT_RETRY_OPTIONS,
          maxAttempts: 2,
          initialDelayMs: 2000,
          maxDelayMs: 10000
        };
      case ErrorType.DATABASE:
        return RETRY_POLICIES[OperationType.DATABASE];
      case ErrorType.EXTERNAL_SERVICE:
        return RETRY_POLICIES[OperationType.API_CALL];
      default:
        return {
          ...DEFAULT_RETRY_OPTIONS,
          maxAttempts: 1 // No retry for other error types
        };
    }
  }
  
  /**
   * Register a custom retry policy
   * @param key The key for the custom policy
   * @param options The retry options
   */
  registerCustomPolicy(key: string, options: RetryOptions): void {
    this.customPolicies.set(key, options);
  }
  
  /**
   * Get a custom retry policy
   * @param key The key for the custom policy
   * @returns The custom retry policy or the default policy if not found
   */
  getCustomPolicy(key: string): RetryOptions {
    return this.customPolicies.get(key) || DEFAULT_RETRY_OPTIONS;
  }
}

// Export a singleton instance of the retry policy manager
export const retryPolicyManager = new RetryPolicyManager();

/**
 * Decorator for retrying class methods
 * @param options The retry options or a function that returns retry options
 * @returns A method decorator
 */
export function Retry(
  options: Partial<RetryOptions> | ((target: any, propertyKey: string | symbol) => Partial<RetryOptions>) = {}
): MethodDecorator {
  return function(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const key = String(propertyKey);
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const resolvedOptions = typeof options === 'function'
        ? options(target, propertyKey)
        : options;
        
      return withRetry(() => originalMethod.apply(this, args), resolvedOptions);
    };
    
    return descriptor;
  };
}

/**
 * Execute a function with a specific retry policy
 * @param operationType The operation type to determine the retry policy
 * @param fn The function to execute
 * @param customOptions Additional retry options to override the policy
 * @returns A promise that resolves with the result of the function
 */
export async function withRetryPolicy<T>(
  operationType: OperationType,
  fn: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<T> {
  const policyOptions = retryPolicyManager.getPolicy(operationType);
  return withRetry(fn, { ...policyOptions, ...customOptions });
}

/**
 * Execute a function with a specific source system retry policy
 * @param sourceSystem The source system to determine the retry policy
 * @param fn The function to execute
 * @param customOptions Additional retry options to override the policy
 * @returns A promise that resolves with the result of the function
 */
export async function withSourceSystemRetryPolicy<T>(
  sourceSystem: SourceSystemType,
  fn: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<T> {
  const policyOptions = retryPolicyManager.getSourceSystemPolicy(sourceSystem);
  return withRetry(fn, { ...policyOptions, ...customOptions });
}