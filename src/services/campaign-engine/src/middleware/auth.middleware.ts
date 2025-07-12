import { Request, Response, NextFunction } from 'express';

/**
 * Extend Express Request interface to include user information
 * This matches the user object structure set by the API gateway
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        roles: string[];
        permissions: string[];
        agentId?: string;
        agentName?: string;
      };
    }
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
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Try to extract user from headers if not already set
  extractUserFromHeaders(req);
  
  // If no user, return authentication error
  if (!req.user) {
    res.status(401).json({
      success: false,
      data: null,
      message: 'Authentication required',
      errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
    });
    return;
  }
  
  next();
};

/**
 * Middleware to check if user has required permissions
 * @param permissions Array of required permissions
 */
export const requirePermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Try to extract user from headers if not already set
    extractUserFromHeaders(req);
    
    // If no user, return authentication error
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
      });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasRequiredPermissions = permissions.every(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermissions) {
      res.status(403).json({
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
      return;
    }
    
    next();
  };
};

/**
 * Middleware to add agent context to the request
 * For campaign engine, we'll use the user ID as agent ID for simplicity
 * This can be enhanced later to fetch actual agent information from database
 */
export const agentContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.user && req.user.id) {
      // For now, use user ID as agent ID and username as agent name
      // This can be enhanced later to fetch from agent repository
      req.user.agentId = req.user.id;
      req.user.agentName = req.user.username;
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Internal server error in agent context middleware',
      errors: [{ code: 'INTERNAL_ERROR', message: 'Failed to process agent context' }]
    });
    return;
  }
};