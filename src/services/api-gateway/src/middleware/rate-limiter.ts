import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { createRateLimiter, RateLimitOptions, RateLimitResult } from 'collection-crm-common';
import { logger } from '../utils/logger.utils';

// Load environment variables
dotenv.config();

// Parse rate limit configuration from environment variables
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const RATE_LIMIT_WINDOW_SECONDS = Math.floor(RATE_LIMIT_WINDOW_MS / 1000);

// Create a Redis-based rate limiter instance
let rateLimiterInstance: ReturnType<typeof createRateLimiter>;

/**
 * Create a rate limiter middleware using Redis
 * @param options - Custom rate limit options (optional)
 */
export function redisRateLimiter(options?: Partial<RateLimitOptions>) {
  // Initialize rate limiter with options
  const rateLimiterOptions: RateLimitOptions = {
    max: options?.max || RATE_LIMIT_MAX,
    windowSizeInSeconds: options?.windowSizeInSeconds || RATE_LIMIT_WINDOW_SECONDS,
    clientName: options?.clientName || 'api-gateway-rate-limit',
    prefix: options?.prefix || 'rate-limit:',
    includeUserId: options?.includeUserId !== undefined ? options.includeUserId : true,
    includeRoute: options?.includeRoute !== undefined ? options.includeRoute : true
  };
  
  // Create the rate limiter instance if it doesn't exist
  if (!rateLimiterInstance) {
    rateLimiterInstance = createRateLimiter(rateLimiterOptions);
  }
  
  // Return Express middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get identifier (IP address or user ID if authenticated)
      const identifier = getRequestIdentifier(req);
      
      // Get route identifier (if enabled)
      const route = rateLimiterOptions.includeRoute ? getRouteIdentifier(req) : undefined;
      
      // Check rate limit using Redis
      const result = await rateLimiterInstance.check(identifier, route);
      
      // Set rate limit headers
      setRateLimitHeaders(res, result);
      
      if (result.allowed) {
        // Request is allowed, proceed to next middleware
        next();
      } else {
        // Rate limit exceeded
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetIn
        });
      }
    } catch (error) {
      // Log the error but allow the request to proceed
      logger.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Get a unique identifier for the request
 * @param req - Express request object
 */
function getRequestIdentifier(req: Request): string {
  // Use user ID if authenticated
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  
  // Otherwise use IP address
  const ip = req.ip || 
    req.connection.remoteAddress || 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim();
  
  return `ip:${ip}`;
}

/**
 * Get a route identifier for the request
 * @param req - Express request object
 */
function getRouteIdentifier(req: Request): string {
  // Use the base path (first segment after API prefix)
  const path = req.path;
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length >= 2 && segments[0] === 'api') {
    return segments[1];
  }
  
  return 'unknown';
}

/**
 * Set rate limit headers on the response
 * @param res - Express response object
 * @param result - Rate limit result
 */
function setRateLimitHeaders(res: Response, result: RateLimitResult): void {
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetIn.toString());
  
  if (!result.allowed) {
    res.setHeader('Retry-After', result.resetIn.toString());
  }
}

/**
 * Create route-specific rate limiter middleware
 * @param routeOptions - Rate limit options for the route
 */
export function routeRateLimiter(routeOptions: any) {
  return redisRateLimiter({
    ...routeOptions,
    prefix: `api-gateway:route:${routeOptions.prefix || ''}:`
  });
}

// Add TypeScript declaration for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}