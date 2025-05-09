import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger.utils';
import { ApiError } from './error-handler.middleware';

/**
 * JWT authentication middleware
 * Validates JWT token from Authorization header and adds user to request object
 */
export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Skip validation for auth service endpoints (to prevent circular requests)
    if (req.path.startsWith('/api/auth/login') || 
        req.path.startsWith('/api/auth/token/refresh') ||
        req.path.startsWith('/api/auth/token/validate')) {
      return next();
    }
    
    // Validate token with auth service
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';
      const response = await axios.post(`${authServiceUrl}/token/validate`, { token });
      
      if (response.data.success && response.data.data.valid) {
        // Add user to request object
        req.user = response.data.data.user;
      }
    } catch (error) {
      logger.warn('Token validation failed:', error);
      // Continue without user object
    }
    
    next();
  } catch (error) {
    logger.error('JWT authentication middleware error:', error);
    next();
  }
};

/**
 * JWT authorization middleware
 * Checks if user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  
  next();
};

/**
 * Role-based authorization middleware
 * Checks if user has required roles
 * @param roles - Array of required roles
 */
export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      throw new ApiError(403, 'Insufficient permissions', {
        requiredRoles: roles,
        userRoles
      });
    }
    
    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if user has required permissions
 * @param permissions - Array of required permissions
 */
export const requirePermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      throw new ApiError(403, 'Insufficient permissions', {
        requiredPermissions: permissions,
        userPermissions
      });
    }
    
    next();
  };
};