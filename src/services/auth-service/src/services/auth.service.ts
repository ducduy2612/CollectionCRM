import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { userService } from './user.service';
import { sessionService } from './session-service';
import { User } from '../models/user.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    name?: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  reason?: string;
}

/**
 * Device information interface
 */
export interface DeviceInfo {
  deviceId?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Authentication service for login, token validation, etc.
 */
export class AuthService {
  /**
   * Authenticate a user with username and password
   * @param username - Username
   * @param password - Password
   * @param deviceInfo - Device information
   */
  public async login(
    username: string,
    password: string,
    deviceInfo?: DeviceInfo
  ): Promise<AuthResult> {
    try {
      // Find user by username
      const user = await userRepository.findByUsername(username);
      
      if (!user) {
        return { success: false, reason: 'INVALID_CREDENTIALS' };
      }
      
      // Check if user is active
      if (!user.is_active) {
        return { success: false, reason: 'USER_INACTIVE' };
      }
      
      // Validate password
      const isValid = await userService.validatePassword(password, user.password_hash);
      
      if (!isValid) {
        return { success: false, reason: 'INVALID_CREDENTIALS' };
      }
      
      // Get user permissions
      const userWithPermissions = await userRepository.getUserWithPermissions(user.id);
      
      if (!userWithPermissions) {
        return { success: false, reason: 'USER_NOT_FOUND' };
      }
      
      // Create session
      const session = await this.createUserSession(user, userWithPermissions.permissions, deviceInfo);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
          email: user.email,
          roles: [user.role],
          permissions: userWithPermissions.permissions,
        },
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, reason: 'AUTHENTICATION_ERROR' };
    }
  }

  /**
   * Validate a JWT token
   * @param token - JWT token
   */
  public async validateToken(token: string): Promise<{
    valid: boolean;
    user?: {
      id: string;
      username: string;
      roles: string[];
      permissions: string[];
    };
    reason?: string;
  }> {
    try {
      // Verify JWT token
      const result = await sessionService.validateToken(token);
      
      return result;
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * Refresh a JWT token using a refresh token
   * @param refreshToken - Refresh token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Refresh token
      const result = await sessionService.refreshToken(refreshToken);
      
      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, reason: 'REFRESH_ERROR' };
    }
  }

  /**
   * Logout a user by revoking their session
   * @param sessionId - Session ID
   */
  public async logout(sessionId: string): Promise<boolean> {
    try {
      // Revoke session
      return await sessionService.revokeSession(sessionId);
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Create a user session
   * @param user - User
   * @param permissions - User permissions
   * @param deviceInfo - Device information
   */
  private async createUserSession(
    user: User,
    permissions: string[],
    deviceInfo?: DeviceInfo
  ) {
    // Create session data
    const sessionData = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: [user.role],
      permissions,
    };
    
    // Create device info
    const deviceData = {
      userAgent: deviceInfo?.userAgent || '',
      deviceType: deviceInfo?.deviceType || '',
      browser: deviceInfo?.browser || '',
      os: deviceInfo?.operatingSystem || '',
      ip: deviceInfo?.ipAddress || '',
    };
    
    // Create session
    return sessionService.createSession(sessionData, deviceData);
  }

  /**
   * Request a password reset for a user
   * @param username - Username
   * @param email - Email address
   */
  public async requestPasswordReset(username: string, email: string): Promise<{
    resetRequested: boolean;
    resetTokenExpiry?: Date;
    reason?: string;
  }> {
    try {
      // Find user by username and email
      const user = await userRepository.findByUsername(username);
      
      if (!user || user.email !== email) {
        return { resetRequested: false, reason: 'USER_NOT_FOUND' };
      }
      
      // Check if user is active
      if (!user.is_active) {
        return { resetRequested: false, reason: 'USER_INACTIVE' };
      }
      
      // Generate reset token (in a real implementation, this would be stored and sent via email)
      const resetToken = jwt.sign(
        { sub: user.id, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // Calculate expiry time
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);
      
      // In a real implementation, store the reset token and send an email
      // For now, just return success
      return {
        resetRequested: true,
        resetTokenExpiry: expiryTime,
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { resetRequested: false, reason: 'RESET_REQUEST_ERROR' };
    }
  }

  /**
   * Get user sessions
   * @param userId - User ID
   */
  public async getUserSessions(userId: string): Promise<any[]> {
    try {
      // Get session IDs
      const sessionIds = await sessionService.getUserSessions(userId);
      
      // Get session data for each ID
      const sessions = [];
      
      for (const sessionId of sessionIds) {
        const sessionData = await sessionService.getSessionData(sessionId);
        
        if (sessionData) {
          sessions.push({
            id: sessionId,
            userId: sessionData.userId,
            deviceInfo: sessionData.deviceInfo,
            createdAt: sessionData.createdAt,
            lastActivityAt: sessionData.lastActivityAt,
            expiresAt: sessionData.expiresAt,
          });
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Terminate all user sessions
   * @param userId - User ID
   */
  public async terminateUserSessions(userId: string): Promise<number> {
    try {
      // Revoke all user sessions
      const success = await sessionService.revokeUserSessions(userId);
      
      if (success) {
        // Get session count (this will be 0 after revocation, so we can't really count)
        // In a real implementation, we might want to count sessions before revoking
        return 1; // Placeholder
      }
      
      return 0;
    } catch (error) {
      console.error('Terminate user sessions error:', error);
      return 0;
    }
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      return await userService.changePassword(userId, currentPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();