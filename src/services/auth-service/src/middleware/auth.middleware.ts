import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

/**
 * Authentication middleware
 * Validates JWT token and adds user to request object
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'Authentication token is required' }]
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Validate token
    const result = await authService.validateToken(token);
    
    if (!result.valid || !result.user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid or expired token',
        errors: [{ code: 'INVALID_TOKEN', message: result.reason || 'Token validation failed' }]
      });
    }
    
    // Add user to request object
    req.user = result.user;
    
    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Authentication error',
      errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during authentication' }]
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required permissions
 * @param requiredPermissions - Array of required permissions
 */
export const authorize = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in request (should be added by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Authentication required',
          errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
        });
      }
      
      // Check if user has required permissions
      if (!req.user.permissions) {
        throw new Error('User permissions not found');
      }
      
      const userPermissions = req.user.permissions;
      
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Insufficient permissions',
          errors: [{ code: 'INSUFFICIENT_PERMISSIONS', message: 'User does not have required permissions' }]
        });
      }
      
      // Continue to next middleware or route handler
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Authorization error',
        errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during authorization' }]
      });
    }
  };
};

/**
 * Role-based authorization middleware
 * Checks if user has required roles
 * @param requiredRoles - Array of required roles
 */
export const authorizeRoles = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists in request (should be added by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Authentication required',
          errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
        });
      }
      
      // Check if user has required roles
      if (!req.user.roles) {
        throw new Error('User roles not found');
      }
      
      const userRoles = req.user.roles;
      
      const hasRole = requiredRoles.some(role =>
        userRoles.includes(role)
      );
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Insufficient permissions',
          errors: [{ code: 'INSUFFICIENT_PERMISSIONS', message: 'User does not have required roles' }]
        });
      }
      
      // Continue to next middleware or route handler
      next();
    } catch (error) {
      console.error('Role authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Authorization error',
        errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during role authorization' }]
      });
    }
  };
};