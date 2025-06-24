import pino from 'pino';
import { env } from '../config/env.config';

const loggerConfig = {
  level: env.LOG_LEVEL,
  transport: env.isDevelopment() ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  base: {
    service: env.SERVICE_NAME
  }
};

export const logger = pino(loggerConfig);

export const createLogger = (context: Record<string, any>) => {
  return logger.child(context);
};