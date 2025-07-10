import pino from 'pino';
import { env } from '../config/env.config';

/**
 * Logger configuration
 */
const loggerConfig = {
  level: env.LOG_LEVEL,
  transport: env.isDevelopment()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
  base: {
    service: 'audit-service'
  }
};

/**
 * Create and export the logger instance
 */
export const logger = pino(loggerConfig);

/**
 * Create a child logger with additional context
 * @param context Additional context to include in logs
 * @returns Child logger instance
 */
export const createLogger = (context: Record<string, any>) => {
  return logger.child(context);
};