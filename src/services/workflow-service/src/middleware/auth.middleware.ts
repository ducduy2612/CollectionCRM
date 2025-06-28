import { Request, Response, NextFunction } from 'express';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { AgentRepository } from '../repositories/agent.repository';

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
        agentId?: string; // Added for agent context
        agentName?: string; // Added for agent name
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
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Try to extract user from headers if not already set
  extractUserFromHeaders(req);
  console.log('workflow-service auth middleware required auth')
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

/**
 * Middleware to add agent context to the request
 * This middleware should be used after requireAuth
 */
export const agentContextMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user && req.user.id) {
      // Fetch the agent by user ID from the database
      const agent = await AgentRepository.findByUserId(req.user.id);
      if (!agent) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'Agent not found',
          errors: [{
            code: 'AGENT_NOT_FOUND',
            message: 'No agent associated with this user',
            details: {
              userId: req.user.id
            }
          }]
        });
      }
      
      // Set the agent ID and name in the user object
      req.user.agentId = agent.id;
      req.user.agentName = agent.name;
    }
    next();
  } catch (error) {
    next(
      Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'agentContextMiddleware' }
      )
    );
  }
};