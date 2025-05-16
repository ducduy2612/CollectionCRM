/**
 * Circuit Breaker implementation for the Bank Synchronization Microservice
 * Prevents cascading failures by temporarily disabling operations after repeated failures
 */

import {
  Errors,
  ErrorType,
  AppError,
  OperationType,
  SourceSystemType
} from '../errors';

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation, requests pass through
  OPEN = 'OPEN',         // Circuit is open, requests are rejected
  HALF_OPEN = 'HALF_OPEN' // Testing if the service has recovered
}

/**
 * Options for configuring the circuit breaker
 */
export interface CircuitBreakerOptions {
  // The name of the circuit breaker
  name: string;
  
  // The failure threshold count to trip the circuit
  failureThreshold: number;
  
  // The timeout in milliseconds before trying half-open state
  resetTimeout: number;
  
  // The number of successful calls in half-open state to close the circuit
  successThreshold: number;
  
  // The timeout in milliseconds for each operation
  operationTimeout?: number;
  
  // Function to determine if an error should count as a failure
  failurePredicate?: (error: Error) => boolean;
  
  // Function called when the circuit state changes
  onStateChange?: (oldState: CircuitBreakerState, newState: CircuitBreakerState) => void;
  
  // Function called when an operation fails
  onFailure?: (error: Error, operationName?: string) => void;
  
  // Function called when an operation succeeds
  onSuccess?: (operationName?: string) => void;
}

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  name: 'default',
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  operationTimeout: 10000, // 10 seconds
  failurePredicate: (error: Error) => true, // All errors count as failures by default
  onStateChange: (oldState, newState) => {
    console.warn(`Circuit ${DEFAULT_CIRCUIT_BREAKER_OPTIONS.name} state changed from ${oldState} to ${newState}`);
  },
  onFailure: (error, operationName) => {
    console.error(`Circuit ${DEFAULT_CIRCUIT_BREAKER_OPTIONS.name} operation ${operationName || 'unknown'} failed: ${error.message}`);
  },
  onSuccess: (operationName) => {
    console.debug(`Circuit ${DEFAULT_CIRCUIT_BREAKER_OPTIONS.name} operation ${operationName || 'unknown'} succeeded`);
  }
};

/**
 * Error thrown when the circuit is open
 */
export class CircuitOpenError extends AppError {
  constructor(circuitName: string) {
    const details = {
      code: Errors.ExternalService.SERVICE_UNAVAILABLE,
      message: `Circuit ${circuitName} is open`,
      timestamp: new Date(),
      operationType: OperationType.API_CALL,
      sourceSystem: SourceSystemType.OTHER,
      retryable: false,
      context: { circuitName }
    };
    super(ErrorType.EXTERNAL_SERVICE, details);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private options: CircuitBreakerOptions;

  /**
   * Create a new circuit breaker
   * @param options The circuit breaker options
   */
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
  }

  /**
   * Get the current state of the circuit
   * @returns The current circuit state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get the name of the circuit
   * @returns The circuit name
   */
  getName(): string {
    return this.options.name;
  }

  /**
   * Get the current failure count
   * @returns The failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Get the current success count (in half-open state)
   * @returns The success count
   */
  getSuccessCount(): number {
    return this.successCount;
  }

  /**
   * Get the time since the last failure
   * @returns The time in milliseconds since the last failure
   */
  getTimeSinceLastFailure(): number {
    if (this.lastFailureTime === 0) {
      return 0;
    }
    return Date.now() - this.lastFailureTime;
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.changeState(CircuitBreakerState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn The function to execute
   * @param operationName Optional name for the operation (for logging)
   * @returns A promise that resolves with the result of the function
   * @throws CircuitOpenError if the circuit is open
   */
  async execute<T>(fn: () => Promise<T>, operationName?: string): Promise<T> {
    // Check if the circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      // Check if it's time to try half-open state
      if (this.getTimeSinceLastFailure() > this.options.resetTimeout) {
        this.changeState(CircuitBreakerState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(this.options.name);
      }
    }

    try {
      // Execute the function with timeout if specified
      const result = await this.executeWithTimeout(fn);
      
      // Handle success
      this.handleSuccess(operationName);
      
      return result;
    } catch (error) {
      // Handle failure
      this.handleFailure(error as Error, operationName);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Execute a function with a timeout
   * @param fn The function to execute
   * @returns A promise that resolves with the result of the function
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.operationTimeout) {
      return fn();
    }

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.options.operationTimeout}ms`));
      }, this.options.operationTimeout);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle a successful operation
   * @param operationName Optional name for the operation (for logging)
   */
  private handleSuccess(operationName?: string): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      
      // If we've reached the success threshold, close the circuit
      if (this.successCount >= this.options.successThreshold) {
        this.changeState(CircuitBreakerState.CLOSED);
      }
    }

    // Reset failure count on success in closed state
    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
    }

    // Call the onSuccess callback if provided
    if (this.options.onSuccess) {
      this.options.onSuccess(operationName);
    }
  }

  /**
   * Handle a failed operation
   * @param error The error that occurred
   * @param operationName Optional name for the operation (for logging)
   */
  private handleFailure(error: Error, operationName?: string): void {
    // Check if the error should count as a failure
    if (this.options.failurePredicate && !this.options.failurePredicate(error)) {
      return;
    }

    this.lastFailureTime = Date.now();
    
    // Increment failure count in closed state
    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      
      // If we've reached the failure threshold, open the circuit
      if (this.failureCount >= this.options.failureThreshold) {
        this.changeState(CircuitBreakerState.OPEN);
      }
    }
    
    // Any failure in half-open state opens the circuit
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.changeState(CircuitBreakerState.OPEN);
    }

    // Call the onFailure callback if provided
    if (this.options.onFailure) {
      this.options.onFailure(error, operationName);
    }
  }

  /**
   * Change the state of the circuit
   * @param newState The new state
   */
  private changeState(newState: CircuitBreakerState): void {
    if (this.state === newState) {
      return;
    }

    const oldState = this.state;
    this.state = newState;

    // Reset counters on state change
    if (newState === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      
      // Clear any existing reset timeout
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
    } else if (newState === CircuitBreakerState.OPEN) {
      this.successCount = 0;
      
      // Set a timeout to try half-open state
      this.resetTimeoutId = setTimeout(() => {
        this.changeState(CircuitBreakerState.HALF_OPEN);
      }, this.options.resetTimeout);
    } else if (newState === CircuitBreakerState.HALF_OPEN) {
      this.successCount = 0;
    }

    // Call the onStateChange callback if provided
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }
}

/**
 * Circuit breaker registry to manage multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   * @param name The name of the circuit breaker
   * @param options The circuit breaker options
   * @returns The circuit breaker
   */
  getOrCreate(name: string, options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker({ ...options, name }));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get a circuit breaker by name
   * @param name The name of the circuit breaker
   * @returns The circuit breaker or undefined if not found
   */
  get(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Check if a circuit breaker exists
   * @param name The name of the circuit breaker
   * @returns True if the circuit breaker exists, false otherwise
   */
  has(name: string): boolean {
    return this.circuitBreakers.has(name);
  }

  /**
   * Remove a circuit breaker
   * @param name The name of the circuit breaker
   * @returns True if the circuit breaker was removed, false otherwise
   */
  remove(name: string): boolean {
    return this.circuitBreakers.delete(name);
  }

  /**
   * Get all circuit breakers
   * @returns An array of all circuit breakers
   */
  getAll(): CircuitBreaker[] {
    return Array.from(this.circuitBreakers.values());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }
}

// Export a singleton instance of the circuit breaker registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Create a circuit breaker for a specific operation type
 * @param operationType The operation type
 * @param options Additional circuit breaker options
 * @returns A circuit breaker
 */
export function createCircuitBreaker(
  operationType: string,
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  const name = `${operationType}-circuit`;
  return circuitBreakerRegistry.getOrCreate(name, options);
}

/**
 * Execute a function with circuit breaker protection
 * @param circuitName The name of the circuit breaker
 * @param fn The function to execute
 * @param options Additional circuit breaker options
 * @returns A promise that resolves with the result of the function
 */
export async function withCircuitBreaker<T>(
  circuitName: string,
  fn: () => Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T> {
  const circuitBreaker = circuitBreakerRegistry.getOrCreate(circuitName, options);
  return circuitBreaker.execute(fn, circuitName);
}

/**
 * Decorator for applying circuit breaker to class methods
 * @param circuitName The name of the circuit breaker
 * @param options Additional circuit breaker options
 * @returns A method decorator
 */
export function CircuitBreak(
  circuitName: string,
  options: Partial<CircuitBreakerOptions> = {}
): MethodDecorator {
  return function(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    
    descriptor.value = async function(...args: any[]) {
      const fullCircuitName = `${circuitName}-${methodName}`;
      const circuitBreaker = circuitBreakerRegistry.getOrCreate(fullCircuitName, options);
      
      return circuitBreaker.execute(() => originalMethod.apply(this, args), methodName);
    };
    
    return descriptor;
  };
}