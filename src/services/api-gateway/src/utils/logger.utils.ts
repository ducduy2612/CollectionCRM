import pino from 'pino';
import { Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

/**
 * Logger configuration
 */
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

/**
 * Application logger instance
 */
export const logger = pino(loggerConfig);

/**
 * Create a child logger with additional context
 * @param context - Additional context to include in logs
 */
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * HTTP request logger middleware
 */
export function requestLogger() {
  // Using dynamic import for pino-http
  const pinoHttp = require('pino-http');
  
  return pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) => {
      const request = req as Request;
      return request.headers['x-request-id'] || randomUUID();
    },
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
      const request = req as Request;
      return `${request.method} ${request.url} completed with status ${res.statusCode}`;
    },
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
      const request = req as Request;
      return `${request.method} ${request.url} failed with status ${res.statusCode}: ${err.message}`;
    },
    customProps: (req: IncomingMessage, res: ServerResponse) => {
      const request = req as Request;
      return {
        userAgent: request.headers['user-agent'],
        remoteAddress: request.ip || (request.connection && request.connection.remoteAddress),
        responseTime: (res as any).responseTime,
      };
    },
  });
}