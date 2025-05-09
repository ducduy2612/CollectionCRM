import jwt from 'jsonwebtoken';
import { SessionService } from '../../../src/services/session-service';
import { createSessionStore } from 'collection-crm-common/redis/session';

// Mock the Redis session store
jest.mock('collection-crm-common/redis/session');
jest.mock('jsonwebtoken');

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSessionStore: any;
  
  // Sample test data
  const testUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    roles: ['user'],
    permissions: ['users:read']
  };
  
  const testDeviceInfo = {
    userAgent: 'test-agent',
    deviceType: 'test-device',
    browser: 'test-browser',
    os: 'test-os',
    ip: '127.0.0.1'
  };
  
  const testSessionData = {
    userId: testUser.id,
    username: testUser.username,
    roles: testUser.roles,
    permissions: testUser.permissions,
    deviceInfo: testDeviceInfo,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock session store
    mockSessionStore = {
      createSession: jest.fn().mockResolvedValue('session-123'),
      getSession: jest.fn().mockResolvedValue(testSessionData),
      updateSession: jest.fn().mockResolvedValue(true),
      deleteSession: jest.fn().mockResolvedValue(true),
      deleteUserSessions: jest.fn().mockResolvedValue(true),
      getUserSessions: jest.fn().mockResolvedValue(['session-123']),
      sessionExists: jest.fn().mockResolvedValue(true),
      getSessionTTL: jest.fn().mockResolvedValue(3600),
      extendSession: jest.fn().mockResolvedValue(true)
    };
    
    // Mock the createSessionStore function
    (createSessionStore as jest.Mock).mockReturnValue(mockSessionStore);
    
    // Create a new instance of SessionService for each test
    sessionService = new SessionService();
  });
  
  describe('createSession', () => {
    it('should create a session successfully', async () => {
      // Mock jwt.sign
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');
      
      // Call the function
      const result = await sessionService.createSession(testUser, testDeviceInfo);
      
      // Assertions
      expect(createSessionStore).toHaveBeenCalled();
      expect(mockSessionStore.createSession).toHaveBeenCalledWith({
        userId: testUser.id,
        username: testUser.username,
        roles: testUser.roles,
        permissions: testUser.permissions,
        deviceInfo: testDeviceInfo,
        createdAt: expect.any(String),
        lastActivityAt: expect.any(String)
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: testUser.id,
          username: testUser.username,
          roles: testUser.roles,
          sessionId: 'session-123'
        },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(mockSessionStore.updateSession).toHaveBeenCalledWith(
        'session-123',
        {
          refreshToken: expect.any(String),
          expiresAt: expect.any(String)
        }
      );
      expect(result).toEqual({
        id: 'session-123',
        userId: testUser.id,
        username: testUser.username,
        roles: testUser.roles,
        permissions: testUser.permissions,
        token: 'jwt-token',
        refreshToken: expect.any(String),
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        lastActivityAt: expect.any(Date),
        deviceInfo: testDeviceInfo,
        ipAddress: '127.0.0.1'
      });
    });
  });
  
  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      // Mock jwt.verify
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: testUser.id,
        username: testUser.username,
        roles: testUser.roles,
        sessionId: 'session-123'
      });
      
      // Call the function
      const result = await sessionService.validateToken('valid-token');
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('session-123', true);
      expect(result).toEqual({
        valid: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          roles: testUser.roles,
          permissions: testUser.permissions
        }
      });
    });
    
    it('should return invalid for non-existent session', async () => {
      // Mock jwt.verify
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: testUser.id,
        username: testUser.username,
        roles: testUser.roles,
        sessionId: 'session-123'
      });
      
      // Mock session store to return null for getSession
      mockSessionStore.getSession.mockResolvedValue(null);
      
      // Call the function
      const result = await sessionService.validateToken('valid-token');
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('session-123', true);
      expect(result).toEqual({
        valid: false,
        reason: 'SESSION_NOT_FOUND'
      });
    });
    
    it('should return invalid for invalid token', async () => {
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await sessionService.validateToken('invalid-token');
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', expect.any(String));
      expect(mockSessionStore.getSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        valid: false,
        reason: 'INVALID_TOKEN'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Set up test data
      const testRefreshToken = 'valid-refresh-token';
      const testSessionData = {
        userId: testUser.id,
        username: testUser.username,
        roles: testUser.roles,
        permissions: testUser.permissions,
        refreshToken: testRefreshToken
      };
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Mock functions
      jest.spyOn(sessionService as any, 'extractSessionIdFromRefreshToken')
        .mockReturnValue('session-123');
      mockSessionStore.getSession.mockResolvedValueOnce(testSessionData);
      (jwt.sign as jest.Mock).mockImplementation(() => 'new-jwt-token');
      jest.spyOn(sessionService as any, 'generateRefreshToken')
        .mockReturnValue('new-refresh-token');
      jest.spyOn(sessionService as any, 'getTokenExpirationDate')
        .mockReturnValue(new Date(Date.now() + 3600000));
      
      // Call the function
      const result = await sessionService.refreshToken(testRefreshToken);
      
      // Assertions
      expect(sessionService['extractSessionIdFromRefreshToken'])
        .toHaveBeenCalledWith('valid-refresh-token');
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('session-123', true);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: testUser.id,
          username: testUser.username,
          roles: testUser.roles,
          sessionId: 'session-123'
        },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(sessionService['generateRefreshToken']).toHaveBeenCalledWith('session-123');
      expect(mockSessionStore.updateSession).toHaveBeenCalledWith(
        'session-123',
        {
          refreshToken: 'new-refresh-token',
          expiresAt: expect.any(String),
          lastActivityAt: expect.any(String)
        }
      );
      expect(result).toEqual({
        success: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: '',
          roles: testUser.roles,
          permissions: testUser.permissions
        },
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Date)
      });
    });
    
    it('should return failure for invalid refresh token format', async () => {
      // Mock functions
      jest.spyOn(sessionService as any, 'extractSessionIdFromRefreshToken')
        .mockReturnValue(null);
      
      // Call the function
      const result = await sessionService.refreshToken('invalid-refresh-token');
      
      // Assertions
      expect(sessionService['extractSessionIdFromRefreshToken'])
        .toHaveBeenCalledWith('invalid-refresh-token');
      expect(mockSessionStore.getSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        reason: 'INVALID_REFRESH_TOKEN'
      });
    });
    
    it('should return failure for non-existent session', async () => {
      // Mock functions
      jest.spyOn(sessionService as any, 'extractSessionIdFromRefreshToken')
        .mockReturnValue('session-123');
      mockSessionStore.getSession.mockResolvedValue(null);
      
      // Call the function
      const result = await sessionService.refreshToken('valid-refresh-token');
      
      // Assertions
      expect(sessionService['extractSessionIdFromRefreshToken'])
        .toHaveBeenCalledWith('valid-refresh-token');
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('session-123', true);
      expect(result).toEqual({
        success: false,
        reason: 'SESSION_NOT_FOUND'
      });
    });
    
    it('should return failure for mismatched refresh token', async () => {
      // Mock functions
      jest.spyOn(sessionService as any, 'extractSessionIdFromRefreshToken')
        .mockReturnValue('session-123');
      mockSessionStore.getSession.mockResolvedValue({
        ...testSessionData,
        refreshToken: 'different-refresh-token'
      });
      
      // Call the function
      const result = await sessionService.refreshToken('valid-refresh-token');
      
      // Assertions
      expect(sessionService['extractSessionIdFromRefreshToken'])
        .toHaveBeenCalledWith('valid-refresh-token');
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('session-123', true);
      expect(result).toEqual({
        success: false,
        reason: 'INVALID_REFRESH_TOKEN'
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock functions to throw an error
      jest.spyOn(sessionService as any, 'extractSessionIdFromRefreshToken')
        .mockImplementation(() => {
          throw new Error('Extraction error');
        });
      
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = await sessionService.refreshToken('refresh-token');
      
      // Assertions
      expect(sessionService['extractSessionIdFromRefreshToken'])
        .toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual({
        success: false,
        reason: 'TOKEN_REFRESH_ERROR'
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      // Call the function
      const result = await sessionService.revokeSession('session-123');
      
      // Assertions
      expect(mockSessionStore.deleteSession).toHaveBeenCalledWith('session-123');
      expect(result).toBe(true);
    });
    
    it('should return false if session deletion fails', async () => {
      // Mock session store to return false for deleteSession
      mockSessionStore.deleteSession.mockResolvedValue(false);
      
      // Call the function
      const result = await sessionService.revokeSession('invalid-session-id');
      
      // Assertions
      expect(mockSessionStore.deleteSession).toHaveBeenCalledWith('invalid-session-id');
      expect(result).toBe(false);
    });
  });
  
  describe('revokeUserSessions', () => {
    it('should revoke all user sessions successfully', async () => {
      // Call the function
      const result = await sessionService.revokeUserSessions(testUser.id);
      
      // Assertions
      expect(mockSessionStore.deleteUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(result).toBe(true);
    });
    
    it('should return false if user sessions deletion fails', async () => {
      // Mock session store to return false for deleteUserSessions
      mockSessionStore.deleteUserSessions.mockResolvedValue(false);
      
      // Call the function
      const result = await sessionService.revokeUserSessions('invalid-user-id');
      
      // Assertions
      expect(mockSessionStore.deleteUserSessions).toHaveBeenCalledWith('invalid-user-id');
      expect(result).toBe(false);
    });
  });
  
  describe('getUserSessions', () => {
    it('should get user sessions successfully', async () => {
      // Call the function
      const result = await sessionService.getUserSessions(testUser.id);
      
      // Assertions
      expect(mockSessionStore.getUserSessions).toHaveBeenCalledWith(testUser.id);
      expect(result).toEqual(['session-123']);
    });
  });
  
  describe('getSessionData', () => {
    it('should get session data successfully', async () => {
      // Call the function
      const result = await sessionService.getSessionData('session-123');
      
      // Assertions
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('session-123', false);
      expect(result).toEqual(testSessionData);
    });
    
    it('should return null for non-existent session', async () => {
      // Mock session store to return null for getSession
      mockSessionStore.getSession.mockResolvedValue(null);
      
      // Call the function
      const result = await sessionService.getSessionData('invalid-session-id');
      
      // Assertions
      expect(mockSessionStore.getSession).toHaveBeenCalledWith('invalid-session-id', false);
      expect(result).toBeNull();
    });
  });
  
  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      // Call the function
      const result = (sessionService as any).generateRefreshToken('session-123');
      
      // Assertions
      expect(result).toEqual(expect.any(String));
      expect(Buffer.from(result, 'base64').toString()).toContain('session-123');
    });
  });
  
  describe('extractSessionIdFromRefreshToken', () => {
    it('should extract session ID from refresh token', () => {
      // Create a refresh token
      const refreshToken = Buffer.from('session-123:12345').toString('base64');
      
      // Call the function
      const result = (sessionService as any).extractSessionIdFromRefreshToken(refreshToken);
      
      // Assertions
      expect(result).toBe('session-123');
    });
    
    it('should return null for invalid refresh token', () => {
      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Call the function
      const result = (sessionService as any).extractSessionIdFromRefreshToken('invalid-token');
      
      // Assertions
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getTokenExpirationDate', () => {
    it('should calculate expiration date for seconds', () => {
      // Call the function
      const result = (sessionService as any).getTokenExpirationDate('30s');
      
      // Assertions
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
      expect(result.getTime()).toBeLessThan(Date.now() + 31000);
    });
    
    it('should calculate expiration date for minutes', () => {
      // Call the function
      const result = (sessionService as any).getTokenExpirationDate('5m');
      
      // Assertions
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
      expect(result.getTime()).toBeLessThan(Date.now() + 301000);
    });
    
    it('should calculate expiration date for hours', () => {
      // Call the function
      const result = (sessionService as any).getTokenExpirationDate('1h');
      
      // Assertions
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
      expect(result.getTime()).toBeLessThan(Date.now() + 3601000);
    });
    
    it('should calculate expiration date for days', () => {
      // Call the function
      const result = (sessionService as any).getTokenExpirationDate('1d');
      
      // Assertions
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
      expect(result.getTime()).toBeLessThan(Date.now() + 86401000);
    });
    
    it('should default to hours for unknown unit', () => {
      // Call the function
      const result = (sessionService as any).getTokenExpirationDate('1x');
      
      // Assertions
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(Date.now());
      expect(result.getTime()).toBeLessThan(Date.now() + 3601000);
    });
  });
});
