import jwt from 'jsonwebtoken';
import { AuthService } from '../../../src/services/auth.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { userService } from '../../../src/services/user.service';
import { sessionService } from '../../../src/services/session-service';

// Mock the repositories and services
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/services/user.service');
jest.mock('../../../src/services/session-service');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  
  // Sample test data
  const testUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  const testUserWithPermissions = {
    user: testUser,
    roles: ['user'],
    permissions: ['users:read']
  };
  
  const testSession = {
    id: 'session-123',
    userId: testUser.id,
    username: testUser.username,
    roles: ['user'],
    permissions: ['users:read'],
    token: 'jwt-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    createdAt: new Date(),
    lastActivityAt: new Date(),
    deviceInfo: {
      userAgent: 'test-agent',
      deviceType: 'test-device',
      browser: 'test-browser',
      os: 'test-os',
      ip: '127.0.0.1'
    }
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of AuthService for each test
    authService = new AuthService();
  });
  
  describe('login', () => {
    it('should login successfully', async () => {
      // Mock repository and service functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(testUser);
      (userService.validatePassword as jest.Mock).mockResolvedValue(true);
      (userRepository.getUserWithPermissions as jest.Mock).mockResolvedValue(testUserWithPermissions);
      (sessionService.createSession as jest.Mock).mockResolvedValue(testSession);
      
      const deviceInfo = {
        deviceId: 'test-device',
        deviceType: 'test-device',
        browser: 'test-browser',
        operatingSystem: 'test-os',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };
      
      // Call the function
      const result = await authService.login('testuser', 'password123', deviceInfo);
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.validatePassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(userRepository.getUserWithPermissions).toHaveBeenCalledWith(testUser.id);
      expect(sessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          roles: [testUser.role],
          permissions: testUserWithPermissions.permissions
        }),
        expect.objectContaining({
          userAgent: 'test-agent',
          deviceType: 'test-device',
          browser: 'test-browser',
          os: 'test-os',
          ip: '127.0.0.1'
        })
      );
      expect(result).toEqual({
        success: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          name: 'Test User',
          email: testUser.email,
          roles: [testUser.role],
          permissions: testUserWithPermissions.permissions
        },
        token: testSession.token,
        refreshToken: testSession.refreshToken,
        expiresAt: testSession.expiresAt
      });
    });
    
    it('should return failure for invalid credentials', async () => {
      // Mock repository and service functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(testUser);
      (userService.validatePassword as jest.Mock).mockResolvedValue(false);
      
      // Call the function
      const result = await authService.login('testuser', 'wrong_password');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.validatePassword).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(userRepository.getUserWithPermissions).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'INVALID_CREDENTIALS'
      });
    });
    
    it('should return failure for inactive user', async () => {
      // Mock repository and service functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue({
        ...testUser,
        is_active: false
      });
      
      // Call the function
      const result = await authService.login('testuser', 'password123');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.validatePassword).not.toHaveBeenCalled();
      expect(userRepository.getUserWithPermissions).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'USER_INACTIVE'
      });
    });
    
    it('should return failure for non-existent user', async () => {
      // Mock repository and service functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await authService.login('nonexistent', 'password123');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('nonexistent');
      expect(userService.validatePassword).not.toHaveBeenCalled();
      expect(userRepository.getUserWithPermissions).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'INVALID_CREDENTIALS'
      });
    });
    
    it('should return failure if user permissions cannot be retrieved', async () => {
      // Mock repository and service functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(testUser);
      (userService.validatePassword as jest.Mock).mockResolvedValue(true);
      (userRepository.getUserWithPermissions as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await authService.login('testuser', 'password123');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userService.validatePassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(userRepository.getUserWithPermissions).toHaveBeenCalledWith(testUser.id);
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'USER_NOT_FOUND'
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock repository and service functions to throw an error
      (userRepository.findByUsername as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.login('testuser', 'password123');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual({
        success: false,
        reason: 'AUTHENTICATION_ERROR'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Mock service functions
      (sessionService.validateToken as jest.Mock).mockResolvedValue({
        valid: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          roles: ['user'],
          permissions: ['users:read']
        }
      });
      
      // Call the function
      const result = await authService.validateToken('valid-token');
      
      // Assertions
      expect(sessionService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({
        valid: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          roles: ['user'],
          permissions: ['users:read']
        }
      });
    });
    
    it('should return invalid for invalid token', async () => {
      // Mock service functions
      (sessionService.validateToken as jest.Mock).mockResolvedValue({
        valid: false,
        reason: 'INVALID_TOKEN'
      });
      
      // Call the function
      const result = await authService.validateToken('invalid-token');
      
      // Assertions
      expect(sessionService.validateToken).toHaveBeenCalledWith('invalid-token');
      expect(result).toEqual({
        valid: false,
        reason: 'INVALID_TOKEN'
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock service functions to throw an error
      (sessionService.validateToken as jest.Mock).mockRejectedValue(new Error('Validation error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.validateToken('token');
      
      // Assertions
      expect(sessionService.validateToken).toHaveBeenCalledWith('token');
      expect(result).toEqual({
        valid: false,
        reason: 'VALIDATION_ERROR'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Mock service functions
      const refreshResult = {
        success: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          roles: ['user'],
          permissions: ['users:read']
        },
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000)
      };
      (sessionService.refreshToken as jest.Mock).mockResolvedValue(refreshResult);
      
      // Call the function
      const result = await authService.refreshToken('valid-refresh-token');
      
      // Assertions
      expect(sessionService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(refreshResult);
    });
    
    it('should return failure for invalid refresh token', async () => {
      // Mock service functions
      (sessionService.refreshToken as jest.Mock).mockResolvedValue({
        success: false,
        reason: 'INVALID_REFRESH_TOKEN'
      });
      
      // Call the function
      const result = await authService.refreshToken('invalid-refresh-token');
      
      // Assertions
      expect(sessionService.refreshToken).toHaveBeenCalledWith('invalid-refresh-token');
      expect(result).toEqual({
        success: false,
        reason: 'INVALID_REFRESH_TOKEN'
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock service functions to throw an error
      (sessionService.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.refreshToken('refresh-token');
      
      // Assertions
      expect(sessionService.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual({
        success: false,
        reason: 'REFRESH_ERROR'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    it('should logout successfully', async () => {
      // Mock service functions
      (sessionService.revokeSession as jest.Mock).mockResolvedValue(true);
      
      // Call the function
      const result = await authService.logout('session-id');
      
      // Assertions
      expect(sessionService.revokeSession).toHaveBeenCalledWith('session-id');
      expect(result).toBe(true);
    });
    
    it('should return false if session revocation fails', async () => {
      // Mock service functions
      (sessionService.revokeSession as jest.Mock).mockResolvedValue(false);
      
      // Call the function
      const result = await authService.logout('invalid-session-id');
      
      // Assertions
      expect(sessionService.revokeSession).toHaveBeenCalledWith('invalid-session-id');
      expect(result).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock service functions to throw an error
      (sessionService.revokeSession as jest.Mock).mockRejectedValue(new Error('Logout error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.logout('session-id');
      
      // Assertions
      expect(sessionService.revokeSession).toHaveBeenCalledWith('session-id');
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(testUser);
      
      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('reset-token');
      
      // Call the function
      const result = await authService.requestPasswordReset('testuser', 'test@example.com');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: testUser.id, type: 'password_reset' },
        expect.any(String),
        { expiresIn: '1h' }
      );
      expect(result).toEqual({
        resetRequested: true,
        resetTokenExpiry: expect.any(Date)
      });
    });
    
    it('should return failure for non-matching email', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(testUser);
      
      // Call the function
      const result = await authService.requestPasswordReset('testuser', 'wrong@example.com');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result).toEqual({
        resetRequested: false,
        reason: 'USER_NOT_FOUND'
      });
    });
    
    it('should return failure for inactive user', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue({
        ...testUser,
        is_active: false
      });
      
      // Call the function
      const result = await authService.requestPasswordReset('testuser', 'test@example.com');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result).toEqual({
        resetRequested: false,
        reason: 'USER_INACTIVE'
      });
    });
    
    it('should return failure for non-existent user', async () => {
      // Mock repository functions
      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      
      // Call the function
      const result = await authService.requestPasswordReset('nonexistent', 'test@example.com');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('nonexistent');
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(result).toEqual({
        resetRequested: false,
        reason: 'USER_NOT_FOUND'
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock repository functions to throw an error
      (userRepository.findByUsername as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.requestPasswordReset('testuser', 'test@example.com');
      
      // Assertions
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual({
        resetRequested: false,
        reason: 'RESET_REQUEST_ERROR'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getUserSessions', () => {
    it('should get user sessions successfully', async () => {
      // Mock service functions
      const sessionIds = ['session1', 'session2'];
      const sessionData1 = {
        userId: testUser.id,
        deviceInfo: { userAgent: 'agent1' },
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
      const sessionData2 = {
        userId: testUser.id,
        deviceInfo: { userAgent: 'agent2' },
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
      
      (sessionService.getUserSessions as jest.Mock).mockResolvedValue(sessionIds);
      (sessionService.getSessionData as jest.Mock)
        .mockResolvedValueOnce(sessionData1)
        .mockResolvedValueOnce(sessionData2);
      
      // Call the function
      const result = await authService.getUserSessions(testUser.id);
      
      // Assertions
      expect(sessionService.getUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(sessionService.getSessionData).toHaveBeenCalledTimes(2);
      expect(sessionService.getSessionData).toHaveBeenCalledWith('session1');
      expect(sessionService.getSessionData).toHaveBeenCalledWith('session2');
      expect(result).toEqual([
        {
          id: 'session1',
          userId: testUser.id,
          deviceInfo: { userAgent: 'agent1' },
          createdAt: expect.any(String),
          lastActivityAt: expect.any(String),
          expiresAt: expect.any(String)
        },
        {
          id: 'session2',
          userId: testUser.id,
          deviceInfo: { userAgent: 'agent2' },
          createdAt: expect.any(String),
          lastActivityAt: expect.any(String),
          expiresAt: expect.any(String)
        }
      ]);
    });
    
    it('should skip sessions with missing data', async () => {
      // Mock service functions
      const sessionIds = ['session1', 'session2'];
      const sessionData = {
        userId: testUser.id,
        deviceInfo: { userAgent: 'agent1' },
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
      
      (sessionService.getUserSessions as jest.Mock).mockResolvedValue(sessionIds);
      (sessionService.getSessionData as jest.Mock)
        .mockResolvedValueOnce(sessionData)
        .mockResolvedValueOnce(null);
      
      // Call the function
      const result = await authService.getUserSessions(testUser.id);
      
      // Assertions
      expect(sessionService.getUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(sessionService.getSessionData).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          id: 'session1',
          userId: testUser.id,
          deviceInfo: { userAgent: 'agent1' },
          createdAt: expect.any(String),
          lastActivityAt: expect.any(String),
          expiresAt: expect.any(String)
        }
      ]);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock service functions to throw an error
      (sessionService.getUserSessions as jest.Mock).mockRejectedValue(new Error('Session error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.getUserSessions(testUser.id);
      
      // Assertions
      expect(sessionService.getUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('terminateUserSessions', () => {
    it('should terminate user sessions successfully', async () => {
      // Mock service functions
      (sessionService.revokeUserSessions as jest.Mock).mockResolvedValue(true);
      
      // Call the function
      const result = await authService.terminateUserSessions(testUser.id);
      
      // Assertions
      expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(result).toBe(1);
    });
    
    it('should return 0 if session revocation fails', async () => {
      // Mock service functions
      (sessionService.revokeUserSessions as jest.Mock).mockResolvedValue(false);
      
      // Call the function
      const result = await authService.terminateUserSessions(testUser.id);
      
      // Assertions
      expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(result).toBe(0);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock service functions to throw an error
      (sessionService.revokeUserSessions as jest.Mock).mockRejectedValue(new Error('Termination error'));
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await authService.terminateUserSessions(testUser.id);
      
      // Assertions
      expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock service functions
      (userService.changePassword as jest.Mock).mockResolvedValue(true);
      
      // Call the function
      const result = await authService.changePassword(
        testUser.id,
        'current_password',
        'new_password'
      );
      
      // Assertions
      expect(userService.changePassword).toHaveBeenCalledWith(
        testUser.id,
        'current_password',
        'new_password'
      );
      expect(result).toBe(true);
    });
    
    it('should propagate errors from user service', async () => {
      // Mock service functions to throw an error
      const error = new Error('Change password error');
      (userService.changePassword as jest.Mock).mockRejectedValue(error);
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function and expect it to throw
      await expect(authService.changePassword(
        testUser.id,
        'current_password',
        'new_password'
      )).rejects.toThrow('Change password error');
      
      // Assertions
      expect(userService.changePassword).toHaveBeenCalledWith(
        testUser.id,
        'current_password',
        'new_password'
      );
      expect(console.error).toHaveBeenCalled();
    });
  });
});