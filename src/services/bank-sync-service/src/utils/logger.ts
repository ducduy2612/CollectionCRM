/**
 * Logger utility for the Bank Synchronization Microservice
 * Implements a comprehensive logging strategy with different severity levels
 */

import { ErrorType } from '../errors';

/**
 * Log levels
 */
export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * Log level numeric values for comparison
 */
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
  [LogLevel.FATAL]: 5
};

/**
 * Log context interface
 */
export interface LogContext {
  // Request ID for tracing
  requestId?: string;
  
  // User ID for auditing
  userId?: string;
  
  // Operation being performed
  operation?: string;
  
  // Entity being operated on
  entity?: string;
  
  // Entity ID
  entityId?: string;
  
  // Source system
  sourceSystem?: string;
  
  // Additional context
  [key: string]: any;
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  // Service name
  serviceName: string;
  
  // Minimum log level
  level: LogLevel;
  
  // Whether to include timestamps
  timestamp: boolean;
  
  // Whether to colorize output
  colorize: boolean;
  
  // Base context to include in all logs
  baseContext?: LogContext;
}

/**
 * Default logger options
 */
export const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
  serviceName: 'bank-sync-service',
  level: LogLevel.INFO,
  timestamp: true,
  colorize: true
};

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Color mappings for log levels
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.TRACE]: COLORS.dim + COLORS.white,
  [LogLevel.DEBUG]: COLORS.cyan,
  [LogLevel.INFO]: COLORS.green,
  [LogLevel.WARN]: COLORS.yellow,
  [LogLevel.ERROR]: COLORS.red,
  [LogLevel.FATAL]: COLORS.bright + COLORS.red
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private options: LoggerOptions;

  /**
   * Create a new logger
   * @param options Logger options
   */
  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = { ...DEFAULT_LOGGER_OPTIONS, ...options };
  }

  /**
   * Log a message at the trace level
   * @param message The message to log
   * @param context Additional context
   */
  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Log a message at the debug level
   * @param message The message to log
   * @param context Additional context
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log a message at the info level
   * @param message The message to log
   * @param context Additional context
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a message at the warn level
   * @param message The message to log
   * @param context Additional context
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log a message at the error level
   * @param message The message to log
   * @param error The error object
   * @param context Additional context
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      } 
    } : {};
    
    this.log(LogLevel.ERROR, message, { ...errorContext, ...context });
  }

  /**
   * Log a message at the fatal level
   * @param message The message to log
   * @param error The error object
   * @param context Additional context
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      } 
    } : {};
    
    this.log(LogLevel.FATAL, message, { ...errorContext, ...context });
  }

  /**
   * Log a message at the specified level
   * @param level The log level
   * @param message The message to log
   * @param context Additional context
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if the log level is enabled
    if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[this.options.level]) {
      return;
    }
    
    const mergedContext = {
      ...this.options.baseContext,
      ...context
    };
    
    // Format the log entry
    const timestamp = this.options.timestamp ? new Date().toISOString() : '';
    const serviceName = this.options.serviceName;
    
    let logEntry = '';
    
    if (this.options.colorize) {
      const levelColor = LEVEL_COLORS[level];
      const resetColor = COLORS.reset;
      
      logEntry = `${timestamp ? `${COLORS.dim}${timestamp}${resetColor} ` : ''}${levelColor}[${level}]${resetColor} ${COLORS.bright}[${serviceName}]${resetColor}: ${message}`;
    } else {
      logEntry = `${timestamp ? `${timestamp} ` : ''}[${level}] [${serviceName}]: ${message}`;
    }
    
    // Add context if available
    if (Object.keys(mergedContext || {}).length > 0) {
      const contextStr = JSON.stringify(mergedContext, null, 2);
      logEntry += `\n${contextStr}`;
    }
    
    // Output to console based on level
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logEntry);
        break;
      case LogLevel.WARN:
        console.warn(logEntry);
        break;
      case LogLevel.INFO:
        console.info(logEntry);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
      default:
        console.log(logEntry);
        break;
    }
  }

  /**
   * Create a child logger with additional base context
   * @param baseContext Additional base context
   * @returns A new logger with the merged base context
   */
  child(baseContext: LogContext): Logger {
    return new Logger({
      ...this.options,
      baseContext: {
        ...this.options.baseContext,
        ...baseContext
      }
    });
  }

  /**
   * Log the start of an operation
   * @param operation The operation name
   * @param context Additional context
   */
  logOperationStart(operation: string, context?: LogContext): void {
    this.info(`Operation started: ${operation}`, {
      event: 'OPERATION_START',
      operation,
      ...context
    });
  }

  /**
   * Log the end of an operation
   * @param operation The operation name
   * @param durationMs The duration in milliseconds
   * @param context Additional context
   */
  logOperationEnd(operation: string, durationMs: number, context?: LogContext): void {
    this.info(`Operation completed: ${operation} (${durationMs}ms)`, {
      event: 'OPERATION_END',
      operation,
      durationMs,
      ...context
    });
  }

  /**
   * Log an API request
   * @param req The request object
   * @param context Additional context
   */
  logRequest(req: any, context?: LogContext): void {
    const reqInfo = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.ip || req.connection?.remoteAddress
    };
    
    this.debug(`API Request: ${reqInfo.method} ${reqInfo.url}`, {
      event: 'API_REQUEST',
      request: reqInfo,
      ...context
    });
  }

  /**
   * Log an API response
   * @param res The response object
   * @param durationMs The duration in milliseconds
   * @param context Additional context
   */
  logResponse(res: any, durationMs: number, context?: LogContext): void {
    const resInfo = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage
    };
    
    this.debug(`API Response: ${resInfo.statusCode} (${durationMs}ms)`, {
      event: 'API_RESPONSE',
      response: resInfo,
      durationMs,
      ...context
    });
  }

  /**
   * Log an error with appropriate level based on error type
   * @param error The error object
   * @param context Additional context
   */
  logError(error: Error, context?: LogContext): void {
    // Determine log level based on error type
    let level = LogLevel.ERROR;
    
    if ('type' in error && typeof (error as any).type === 'string') {
      const errorType = (error as any).type as ErrorType;
      
      switch (errorType) {
        case ErrorType.TRANSIENT:
          level = LogLevel.WARN;
          break;
        case ErrorType.CRITICAL:
          level = LogLevel.FATAL;
          break;
        default:
          level = LogLevel.ERROR;
      }
    }
    
    // Log the error with the determined level
    this.log(level, error.message, {
      event: 'ERROR',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    });
  }

  /**
   * Log a sync operation
   * @param operation The sync operation
   * @param sourceSystem The source system
   * @param entityType The entity type
   * @param status The status
   * @param context Additional context
   */
  logSync(
    operation: string,
    sourceSystem: string,
    entityType: string,
    status: string,
    context?: LogContext
  ): void {
    this.info(`Sync ${operation}: ${sourceSystem} ${entityType} - ${status}`, {
      event: 'SYNC',
      operation,
      sourceSystem,
      entityType,
      status,
      ...context
    });
  }

  /**
   * Log an audit event
   * @param action The action performed
   * @param userId The user ID
   * @param entity The entity type
   * @param entityId The entity ID
   * @param context Additional context
   */
  logAudit(
    action: string,
    userId: string,
    entity: string,
    entityId: string,
    context?: LogContext
  ): void {
    this.info(`Audit: ${action} on ${entity} ${entityId} by ${userId}`, {
      event: 'AUDIT',
      action,
      userId,
      entity,
      entityId,
      ...context
    });
  }
}

// Create and export a default logger instance
export const logger = new Logger();

/**
 * Create a request logger middleware for Express
 * @returns Express middleware function
 */
export function requestLoggerMiddleware() {
  return (req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || generateRequestId();
    const userId = req.user?.id || 'anonymous';
    
    // Add request ID to request object
    req.requestId = requestId;
    
    // Create a child logger for this request
    req.logger = logger.child({
      requestId,
      userId
    });
    
    // Log the request
    req.logger.logRequest(req);
    
    // Record start time
    const startTime = Date.now();
    
    // Log the response
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      req.logger.logResponse(res, durationMs);
    });
    
    next();
  };
}

/**
 * Generate a unique request ID
 * @returns A unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Create a performance logger for timing operations
 */
export class PerformanceLogger {
  private timers: Map<string, number> = new Map();
  private logger: Logger;

  /**
   * Create a new performance logger
   * @param logger The logger to use
   */
  constructor(logger: Logger = globalLogger) {
    this.logger = logger;
  }

  /**
   * Start timing an operation
   * @param operation The operation name
   * @param context Additional context
   */
  start(operation: string, context?: LogContext): void {
    this.timers.set(operation, Date.now());
    this.logger.logOperationStart(operation, context);
  }

  /**
   * End timing an operation and log the duration
   * @param operation The operation name
   * @param context Additional context
   * @returns The duration in milliseconds
   */
  end(operation: string, context?: LogContext): number {
    const startTime = this.timers.get(operation);
    
    if (!startTime) {
      this.logger.warn(`PerformanceLogger: No start time found for operation ${operation}`);
      return 0;
    }
    
    const durationMs = Date.now() - startTime;
    this.timers.delete(operation);
    
    this.logger.logOperationEnd(operation, durationMs, context);
    
    return durationMs;
  }
}

// Create and export a global logger instance
export const globalLogger = logger;

// Create and export a global performance logger instance
export const performanceLogger = new PerformanceLogger(logger);