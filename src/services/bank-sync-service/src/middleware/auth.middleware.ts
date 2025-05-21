import { Request, Response, NextFunction } from 'express';

/**
 * Extend Express Request interface to include user information
 * This matches the user object structure set by the API gateway
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Helper function to extract user information from headers
 */
const extractUserFromHeaders = (req: Request): void => {
  if (!req.user) {
    const userInfoHeader = req.headers['x-user-info'];
    
    if (userInfoHeader && typeof userInfoHeader === 'string') {
      try {
        req.user = JSON.parse(userInfoHeader);
      } catch (error) {
        console.error('Failed to parse user info from header:', error);
      }
    }
  }
};

/**
 * Middleware to check if user is authenticated
 * Assumes the API gateway has already validated the JWT token
 * and attached the user object to the request or headers
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Try to extract user from headers if not already set
  extractUserFromHeaders(req);
  
  // If no user, return authentication error
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Authentication required',
      errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
    });
  }
  
  next();
};

/**
 * Middleware to check if user has required roles
 * @param roles Array of required roles
 */
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Try to extract user from headers if not already set
    extractUserFromHeaders(req);
    
    // If no user, return authentication error
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        errors: [{ 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions',
          details: {
            requiredRoles: roles,
            userRoles
          }
        }]
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user has required permissions
 * @param permissions Array of required permissions
 */
export const requirePermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Try to extract user from headers if not already set
    extractUserFromHeaders(req);
    
    // If no user, return authentication error
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasRequiredPermissions = permissions.every(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermissions) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Access denied',
        errors: [{ 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions',
          details: {
            requiredPermissions: permissions,
            userPermissions
          }
        }]
      });
    }
    
    next();
  };
};