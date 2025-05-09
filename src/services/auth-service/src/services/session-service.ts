import { createSessionStore, SessionStore, SessionData } from '../../../../common/redis/session';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

/**
 * User session interface
 */
export interface UserSession {
  id: string;
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
}

/**
 * Device information interface
 */
export interface DeviceInfo {
  userAgent: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ip?: string;
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    roles: string[];
  };
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  reason?: string;
}

/**
 * Token validation result interface
 */
export interface TokenValidationResult {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    roles: string[];
    permissions: string[];
  };
  reason?: string;
}

/**
 * Session service for authentication
 */
export class SessionService {
  private sessionStore: SessionStore;

  /**
   * Create a new SessionService instance
   */
  constructor() {
    this.sessionStore = createSessionStore({
      ttl: parseInt(process.env.SESSION_TTL || '86400', 10), // Default: 24 hours
      clientName: 'auth-session',
      prefix: 'auth:session:'
    });
  }

  /**
   * Create a new user session
   * @param user - User data
   * @param deviceInfo - Device information
   */
  public async createSession(
    user: { id: string; username: string; roles: string[]; permissions: string[] },
    deviceInfo?: DeviceInfo
  ): Promise<UserSession> {
    // Create session data
    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      deviceInfo,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };

    // Store session in Redis
    const sessionId = await this.sessionStore.createSession(sessionData);

    // Generate JWT token
    const tokenPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
      sessionId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    const refreshToken = this.generateRefreshToken(sessionId);
    const expiresAt = this.getTokenExpirationDate(JWT_EXPIRATION);

    // Create user session object
    const userSession: UserSession = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      token,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      deviceInfo,
      ipAddress: deviceInfo?.ip
    };

    // Update session with token information
    await this.sessionStore.updateSession(sessionId, {
      refreshToken,
      expiresAt: expiresAt.toISOString()
    });

    return userSession;
  }

  /**
   * Validate a JWT token
   * @param token - JWT token
   */
  public async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        username: string;
        roles: string[];
        sessionId: string;
      };

      // Check if session exists
      const sessionData = await this.sessionStore.getSession(decoded.sessionId, true);

      if (!sessionData) {
        return { valid: false, reason: 'SESSION_NOT_FOUND' };
      }

      // Return validation result
      return {
        valid: true,
        user: {
          id: sessionData.userId,
          username: sessionData.username,
          roles: sessionData.roles,
          permissions: sessionData.permissions || []
        }
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, reason: 'INVALID_TOKEN' };
    }
  }

  /**
   * Refresh a JWT token using a refresh token
   * @param refreshToken - Refresh token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Extract session ID from refresh token
      const sessionId = this.extractSessionIdFromRefreshToken(refreshToken);

      if (!sessionId) {
        return { success: false, reason: 'INVALID_REFRESH_TOKEN' };
      }

      // Get session data
      const sessionData = await this.sessionStore.getSession(sessionId, true);

      if (!sessionData) {
        return { success: false, reason: 'SESSION_NOT_FOUND' };
      }

      // Verify refresh token
      if (sessionData.refreshToken !== refreshToken) {
        return { success: false, reason: 'INVALID_REFRESH_TOKEN' };
      }

      // Generate new JWT token
      const tokenPayload = {
        sub: sessionData.userId,
        username: sessionData.username,
        roles: sessionData.roles,
        sessionId
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      const newRefreshToken = this.generateRefreshToken(sessionId);
      const expiresAt = this.getTokenExpirationDate(JWT_EXPIRATION);

      // Update session with new token information
      await this.sessionStore.updateSession(sessionId, {
        refreshToken: newRefreshToken,
        expiresAt: expiresAt.toISOString(),
        lastActivityAt: new Date().toISOString()
      });

      // Return authentication result
      return {
        success: true,
        user: {
          id: sessionData.userId,
          username: sessionData.username,
          roles: sessionData.roles
        },
        token,
        refreshToken: newRefreshToken,
        expiresAt
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, reason: 'TOKEN_REFRESH_ERROR' };
    }
  }

  /**
   * Revoke a user session
   * @param sessionId - Session ID
   */
  public async revokeSession(sessionId: string): Promise<boolean> {
    return await this.sessionStore.deleteSession(sessionId);
  }

  /**
   * Revoke all sessions for a user
   * @param userId - User ID
   */
  public async revokeUserSessions(userId: string): Promise<boolean> {
    return await this.sessionStore.deleteUserSessions(userId);
  }

  /**
   * Get all sessions for a user
   * @param userId - User ID
   */
  public async getUserSessions(userId: string): Promise<string[]> {
    return await this.sessionStore.getUserSessions(userId);
  }

  /**
   * Generate a refresh token
   * @param sessionId - Session ID
   */
  private generateRefreshToken(sessionId: string): string {
    // Simple implementation: encode session ID with a timestamp
    const timestamp = Date.now();
    const data = `${sessionId}:${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Extract session ID from refresh token
   * @param refreshToken - Refresh token
   */
  private extractSessionIdFromRefreshToken(refreshToken: string): string | null {
    try {
      const data = Buffer.from(refreshToken, 'base64').toString();
      const [sessionId] = data.split(':');
      return sessionId;
    } catch (error) {
      console.error('Error extracting session ID from refresh token:', error);
      return null;
    }
  }

  /**
   * Calculate token expiration date
   * @param expiration - Expiration string (e.g., '1h', '7d')
   */
  private getTokenExpirationDate(expiration: string): Date {
    const now = new Date();
    const unit = expiration.charAt(expiration.length - 1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      default:
        // Default to hours if unit is not recognized
        now.setHours(now.getHours() + value);
    }

    return now;
  }
}

// Export singleton instance
export const sessionService = new SessionService();