import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, authorizeRoles } from '../../../src/middleware/auth.middleware';
import { authService } from '../../../src/services/auth.service';

// Mock the auth service
jest.mock('../../../src/services/auth.service');

describe('Auth Middleware', () => {
  // Mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock request, response, and next function
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });
  
  describe('authenticate', () => {
    it('should authenticate successfully with valid token', async () => {
      // Mock request with valid token
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      // Mock auth service
      (authService.validateToken as jest.Mock).mockResolvedValue({
        valid: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          roles: ['user'],
          permissions: ['users:read']
        }
      });
      
      // Call the middleware
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual({
        id: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: ['users:read']
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should return 401 if no authorization header', async () => {
      // Call the middleware
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(authService.validateToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'Authentication token is required' }]
      });
    });
    
    it('should return 401 if authorization header does not start with Bearer', async () => {
      // Mock request with invalid token format
      mockRequest.headers = {
        authorization: 'invalid-format'
      };
      
      // Call the middleware
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(authService.validateToken).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'Authentication token is required' }]
      });
    });
    
    it('should return 401 if token is invalid', async () => {
      // Mock request with invalid token
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      
      // Mock auth service
      (authService.validateToken as jest.Mock).mockResolvedValue({
        valid: false,
        reason: 'INVALID_TOKEN'
      });
      
      // Call the middleware
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(authService.validateToken).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Invalid or expired token',
        errors: [{ code: 'INVALID_TOKEN', message: 'INVALID_TOKEN' }]
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock request with token
      mockRequest.headers = {
        authorization: 'Bearer token'
      };
      
      // Mock auth service to throw an error
      (authService.validateToken as jest.Mock).mockRejectedValue(new Error('Authentication error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the middleware
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(authService.validateToken).toHaveBeenCalledWith('token');
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authentication error',
        errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during authentication' }]
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('authorize', () => {
    it('should authorize successfully with required permissions', async () => {
      // Mock request with user having required permissions
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: ['users:read', 'users:write']
      };
      
      // Create authorize middleware with required permissions
      const authorizeMiddleware = authorize(['users:read', 'users:write']);
      
      // Call the middleware
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Create authorize middleware with required permissions
      const authorizeMiddleware = authorize(['users:read']);
      
      // Call the middleware
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
      });
    });
    
    it('should return 403 if user does not have required permissions', async () => {
      // Mock request with user having insufficient permissions
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: ['users:read']
      };
      
      // Create authorize middleware with required permissions
      const authorizeMiddleware = authorize(['users:read', 'users:write']);
      
      // Call the middleware
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Insufficient permissions',
        errors: [{ code: 'INSUFFICIENT_PERMISSIONS', message: 'User does not have required permissions' }]
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock request with user that will cause an error
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: ['user'],
        // Missing permissions property to cause an error
      } as any;
      
      // Create authorize middleware with required permissions
      const authorizeMiddleware = authorize(['users:read']);
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the middleware
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authorization error',
        errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during authorization' }]
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('authorizeRoles', () => {
    it('should authorize successfully with required roles', async () => {
      // Mock request with user having required roles
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: ['admin', 'user'],
        permissions: ['users:read', 'users:write']
      };
      
      // Create authorizeRoles middleware with required roles
      const authorizeRolesMiddleware = authorizeRoles(['admin']);
      
      // Call the middleware
      authorizeRolesMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Create authorizeRoles middleware with required roles
      const authorizeRolesMiddleware = authorizeRoles(['admin']);
      
      // Call the middleware
      authorizeRolesMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'User not authenticated' }]
      });
    });
    
    it('should return 403 if user does not have required roles', async () => {
      // Mock request with user having insufficient roles
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: ['users:read']
      };
      
      // Create authorizeRoles middleware with required roles
      const authorizeRolesMiddleware = authorizeRoles(['admin']);
      
      // Call the middleware
      authorizeRolesMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Insufficient permissions',
        errors: [{ code: 'INSUFFICIENT_PERMISSIONS', message: 'User does not have required roles' }]
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock request with user that will cause an error
      mockRequest.user = {
        id: 'user-123',
        username: 'testuser',
        // Missing roles property to cause an error
        permissions: ['users:read']
      } as any;
      
      // Create authorizeRoles middleware with required roles
      const authorizeRolesMiddleware = authorizeRoles(['admin']);
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the middleware
      authorizeRolesMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: null,
        message: 'Authorization error',
        errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during role authorization' }]
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
});