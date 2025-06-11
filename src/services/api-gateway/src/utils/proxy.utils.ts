import { Request, Response, NextFunction, RequestHandler } from 'express';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from 'axios';
import { IncomingHttpHeaders } from 'http';
import { URL } from 'url';
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
  routes?: Record<string, string>;
  requiresAuth?: {
    all: boolean;
    except?: string[];
  };
}

/**
 * Request middleware interface
 */
interface RequestMiddleware {
  process(req: Request, axiosConfig: AxiosRequestConfig, proxyConfig: ProxyConfig): Promise<AxiosRequestConfig>;
}

/**
 * Response middleware interface
 */
interface ResponseMiddleware {
  process(proxyRes: AxiosResponse, req: Request, res: Response, proxyConfig: ProxyConfig): Promise<void>;
}

/**
 * Error middleware interface
 */
interface ErrorMiddleware {
  process(error: AxiosError, req: Request, res: Response, proxyConfig: ProxyConfig): Promise<void>;
}

/**
 * Middleware chain for processing requests and responses
 */
class MiddlewareChain<T> {
  private middlewares: T[] = [];

  /**
   * Add middleware to the chain
   * @param middleware - Middleware to add
   */
  add(middleware: T): MiddlewareChain<T> {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Get all middlewares
   */
  getAll(): T[] {
    return this.middlewares;
  }
}

/**
 * Authentication middleware
 */
class AuthenticationMiddleware implements RequestMiddleware {
  async process(req: Request, axiosConfig: AxiosRequestConfig, proxyConfig: ProxyConfig): Promise<AxiosRequestConfig> {
    // Check if authentication is required for this route
    if (proxyConfig.requiresAuth?.all && 
        (!proxyConfig.requiresAuth.except || 
         !proxyConfig.requiresAuth.except.some(path => req.path.endsWith(path)))) {
      // Authentication required
      if (!req.user) {
        throw {
          status: 401,
          message: 'Authentication required',
          service: proxyConfig.serviceName,
          requestId: req.headers['x-request-id'] || 'unknown'
        };
      }
    }
    
    return axiosConfig;
  }
}

/**
 * Headers middleware for adding request headers
 */
class RequestHeadersMiddleware implements RequestMiddleware {
  async process(req: Request, axiosConfig: AxiosRequestConfig, proxyConfig: ProxyConfig): Promise<AxiosRequestConfig> {
    // Initialize headers if not present
    if (!axiosConfig.headers) {
      axiosConfig.headers = {};
    }
    
    // Add request ID header for tracing
    if (req.headers['x-request-id']) {
      axiosConfig.headers['x-request-id'] = req.headers['x-request-id'] as string;
    }
    
    // Add original client IP
    if (req.ip) {
      axiosConfig.headers['x-forwarded-for'] = req.ip;
    }

    // Add user information if authenticated
    if (req.user) {
      axiosConfig.headers['x-user-id'] = req.user.id;
      axiosConfig.headers['x-user-info'] = JSON.stringify(req.user);
    }
    
    // Forward other important headers
    const headersToForward = [
      'content-type',
      'accept',
      'accept-encoding',
      'accept-language',
      'user-agent',
      'authorization'
    ];
    
    headersToForward.forEach(header => {
      if (req.headers[header]) {
        axiosConfig.headers![header] = req.headers[header];
      }
    });
    
    return axiosConfig;
  }
}

/**
 * Path rewrite middleware
 */
class PathRewriteMiddleware implements RequestMiddleware {
  async process(req: Request, axiosConfig: AxiosRequestConfig, proxyConfig: ProxyConfig): Promise<AxiosRequestConfig> {
    let path = req.originalUrl;
    
    // Apply path rewrite rules if defined
    if (proxyConfig.pathRewrite) {
      for (const [pattern, replacement] of Object.entries(proxyConfig.pathRewrite)) {
        const regex = new RegExp(pattern);
        path = path.replace(regex, replacement);
      }
    }
    
    // Update the URL in the axios config
    axiosConfig.url = path;
    
    return axiosConfig;
  }
}

/**
 * Response headers middleware
 */
class ResponseHeadersMiddleware implements ResponseMiddleware {
  async process(proxyRes: AxiosResponse, req: Request, res: Response, proxyConfig: ProxyConfig): Promise<void> {
    // Add service name to response headers for debugging
    res.setHeader('x-proxied-service', proxyConfig.serviceName);
    
    // Forward response headers
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    }
  }
}

/**
 * Error handling middleware
 */
class ErrorHandlingMiddleware implements ErrorMiddleware {
  async process(error: AxiosError, req: Request, res: Response, proxyConfig: ProxyConfig): Promise<void> {
    // Log the error
    logger.error(`Proxy error for ${proxyConfig.serviceName}: ${error.message}`, {
      service: proxyConfig.serviceName,
      target: proxyConfig.target,
      path: req.path,
      error: error.message,
      stack: error.stack
    });
    
    // Custom error response
    if (error.response) {
      // Forward the status code and response from the target service
      res.status(error.response.status).json({
        error: error.response.statusText,
        message: error.message,
        service: proxyConfig.serviceName,
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      // Service unavailable
      res.status(503).json({
        error: 'Service Unavailable',
        message: `The ${proxyConfig.serviceName} is temporarily unavailable`,
        service: proxyConfig.serviceName,
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } else if (error.status) {
      // Custom error with status
      res.status(error.status).json({
        error: 'Proxy Error',
        message: error.message,
        service: proxyConfig.serviceName,
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } else {
      // Generic bad gateway
      res.status(502).json({
        error: 'Bad Gateway',
        message: `The ${proxyConfig.serviceName} is temporarily unavailable`,
        service: proxyConfig.serviceName,
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    }
  }
}

/**
 * Axios proxy service
 */
class AxiosProxyService {
  private axiosInstance: AxiosInstance;
  private requestMiddlewares: MiddlewareChain<RequestMiddleware>;
  private responseMiddlewares: MiddlewareChain<ResponseMiddleware>;
  private errorMiddlewares: MiddlewareChain<ErrorMiddleware>;
  private proxyConfig: ProxyConfig;
  
  /**
   * Create a new Axios proxy service
   * @param config - Proxy configuration
   */
  constructor(config: ProxyConfig) {
    this.proxyConfig = config;
    
    // Create Axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: config.target,
      timeout: config.timeout || 30000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 600, // Accept all status codes to handle them manually
    });
    
    // Initialize middleware chains
    this.requestMiddlewares = new MiddlewareChain<RequestMiddleware>();
    this.responseMiddlewares = new MiddlewareChain<ResponseMiddleware>();
    this.errorMiddlewares = new MiddlewareChain<ErrorMiddleware>();
    
    // Add default middlewares
    this.requestMiddlewares
      .add(new AuthenticationMiddleware())
      .add(new RequestHeadersMiddleware())
      .add(new PathRewriteMiddleware());
      
    this.responseMiddlewares
      .add(new ResponseHeadersMiddleware());
      
    this.errorMiddlewares
      .add(new ErrorHandlingMiddleware());
  }
  
  /**
   * Add request middleware
   * @param middleware - Request middleware to add
   */
  addRequestMiddleware(middleware: RequestMiddleware): AxiosProxyService {
    this.requestMiddlewares.add(middleware);
    return this;
  }
  
  /**
   * Add response middleware
   * @param middleware - Response middleware to add
   */
  addResponseMiddleware(middleware: ResponseMiddleware): AxiosProxyService {
    this.responseMiddlewares.add(middleware);
    return this;
  }
  
  /**
   * Add error middleware
   * @param middleware - Error middleware to add
   */
  addErrorMiddleware(middleware: ErrorMiddleware): AxiosProxyService {
    this.errorMiddlewares.add(middleware);
    return this;
  }
  
  /**
   * Handle proxy request
   * @param req - Express request
   * @param res - Express response
   */
  async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      // Create initial Axios request config
      let axiosConfig: AxiosRequestConfig = {
        method: req.method,
        headers: {},
        responseType: 'json', // Default to JSON for API responses
      };

      // Handle multipart/form-data (file uploads)
      const contentType = req.headers['content-type'];
      if (contentType && contentType.includes('multipart/form-data')) {
        // For file uploads, pass the raw request as stream
        axiosConfig.data = req;
        axiosConfig.maxBodyLength = Infinity;
        axiosConfig.maxContentLength = Infinity;
      } else {
        // For regular requests, use req.body
        axiosConfig.data = req.body;
      }
      
      // Process request through middleware chain
      for (const middleware of this.requestMiddlewares.getAll()) {
        axiosConfig = await middleware.process(req, axiosConfig, this.proxyConfig);
      }
      
      // Send the request
      const response = await this.axiosInstance.request(axiosConfig);
      
      // Process response through middleware chain
      for (const middleware of this.responseMiddlewares.getAll()) {
        await middleware.process(response, req, res, this.proxyConfig);
      }
      
      // Send the response
      res.status(response.status);
      
      // Handle response data
      if (typeof response.data === 'object') {
        res.json(response.data);
      } else {
        res.send(response.data);
      }
    } catch (error) {
      // Process error through middleware chain
      for (const middleware of this.errorMiddlewares.getAll()) {
        await middleware.process(error as AxiosError, req, res, this.proxyConfig);
      }
    }
  }
}

/**
 * Create a proxy middleware for a microservice
 * @param config - Proxy configuration
 * @returns Express request handler
 */
export function createServiceProxy(config: ProxyConfig): RequestHandler {
  const proxyService = new AxiosProxyService(config);
  
  // Return Express middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await proxyService.handleRequest(req, res);
    } catch (error) {
      next(error);
    }
  };
}