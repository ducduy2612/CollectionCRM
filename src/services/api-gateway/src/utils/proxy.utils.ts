import { Request, Response, NextFunction, RequestHandler } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { IncomingMessage, ServerResponse } from 'http';
import { Url } from 'url';
import { logger } from './logger.utils';

/**
 * Proxy configuration interface
 */
export interface ProxyConfig {
  path: string;
  target: string;
  pathRewrite?: Record<string, string>;
  timeout?: number;
  serviceName: string;
}

/**
 * Create a proxy middleware for a microservice
 * @param config - Proxy configuration
 * @returns Express request handler
 */
export function createServiceProxy(config: ProxyConfig): RequestHandler {
  const options: Options = {
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    timeout: config.timeout || 30000,
    proxyTimeout: config.timeout || 30000,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    onError: (err: Error, req: IncomingMessage, res: ServerResponse, target?: string | Partial<Url>) => {
      const request = req as Request;
      const response = res as Response;
      
      logger.error(`Proxy error for ${config.serviceName}: ${err.message}`, {
        service: config.serviceName,
        target: config.target,
        path: request.path,
        error: err.message
      });
      
      response.status(502).json({
        error: 'Bad Gateway',
        message: `The ${config.serviceName} is temporarily unavailable`,
        service: config.serviceName,
        requestId: request.headers['x-request-id'] || 'unknown'
      });
    },
    onProxyReq: (proxyReq: any, req: IncomingMessage, res: ServerResponse) => {
      const request = req as Request;
      
      // Add request ID header for tracing
      if (!proxyReq.getHeader('x-request-id') && request.headers['x-request-id']) {
        proxyReq.setHeader('x-request-id', request.headers['x-request-id'] as string);
      }
      
      // Add original client IP
      if (request.ip) {
        proxyReq.setHeader('x-forwarded-for', request.ip);
      }
    },
    onProxyRes: (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
      const response = res as Response;
      
      // Add service name to response headers for debugging
      response.setHeader('x-proxied-service', config.serviceName);
    }
  };

  return createProxyMiddleware(options);
}