import express from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * Login route
 * POST /login
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('deviceInfo').optional().isObject(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          errors: errors.array().map((err: any) => ({
            code: 'VALIDATION_ERROR',
            message: err.msg,
            field: err.param
          }))
        });
      }

      const { username, password, deviceInfo } = req.body;

      // Authenticate user
      const result = await authService.login(username, password, deviceInfo);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Authentication failed',
          errors: [{ code: result.reason || 'AUTH_FAILED', message: 'Invalid credentials' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt
        },
        message: 'Login successful',
        errors: []
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Authentication error',
        errors: [{ code: 'AUTH_ERROR', message: 'An error occurred during authentication' }]
      });
    }
  }
);

/**
 * Logout route
 * POST /logout
 */
router.post(
  '/logout',
  authenticate,
  async (req: express.Request, res: express.Response) => {
    try {
      // Get session ID from token
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Token is required',
          errors: [{ code: 'TOKEN_REQUIRED', message: 'Authentication token is required' }]
        });
      }

      // Decode token to get session ID (without verification)
      const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const sessionId = decodedToken.sessionId;

      // Get user info from authenticated request
      const user = (req as any).user;

      // Revoke session
      const success = await authService.logout(sessionId, user?.id, user?.username, 'user_logout');

      if (!success) {
        return res.status(500).json({
          success: false,
          data: null,
          message: 'Logout failed',
          errors: [{ code: 'LOGOUT_FAILED', message: 'Failed to terminate session' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          sessionTerminated: true
        },
        message: 'Logout successful',
        errors: []
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Logout error',
        errors: [{ code: 'LOGOUT_ERROR', message: 'An error occurred during logout' }]
      });
    }
  }
);

/**
 * Refresh token route
 * POST /token/refresh
 */
router.post(
  '/token/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          errors: errors.array().map((err: any) => ({
            code: 'VALIDATION_ERROR',
            message: err.msg,
            field: err.param
          }))
        });
      }

      const { refreshToken } = req.body;

      // Refresh token
      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Token refresh failed',
          errors: [{ code: result.reason || 'REFRESH_FAILED', message: 'Invalid or expired refresh token' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          token: result.token,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt
        },
        message: 'Token refreshed successfully',
        errors: []
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Token refresh error',
        errors: [{ code: 'REFRESH_ERROR', message: 'An error occurred during token refresh' }]
      });
    }
  }
);

/**
 * Validate token route
 * POST /token/validate
 */
router.post(
  '/token/validate',
  [
    body('token').notEmpty().withMessage('Token is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          errors: errors.array().map((err: any) => ({
            code: 'VALIDATION_ERROR',
            message: err.msg,
            field: err.param
          }))
        });
      }

      const { token } = req.body;

      // Validate token
      const result = await authService.validateToken(token);

      if (!result.valid || !result.user) {
        return res.status(401).json({
          success: false,
          data: {
            valid: false
          },
          message: 'Token is invalid',
          errors: [{ code: result.reason || 'INVALID_TOKEN', message: 'Invalid or expired token' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          valid: true,
          user: result.user
        },
        message: 'Token is valid',
        errors: []
      });
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Token validation error',
        errors: [{ code: 'VALIDATION_ERROR', message: 'An error occurred during token validation' }]
      });
    }
  }
);

/**
 * Request password reset route
 * POST /password/reset
 */
router.post(
  '/password/reset',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          errors: errors.array().map((err: any) => ({
            code: 'VALIDATION_ERROR',
            message: err.msg,
            field: err.param
          }))
        });
      }

      const { username, email } = req.body;

      // Request password reset
      const result = await authService.requestPasswordReset(username, email);

      if (!result.resetRequested) {
        // Don't reveal if user exists or not for security reasons
        return res.status(200).json({
          success: true,
          data: {
            resetRequested: true,
            resetTokenExpiry: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
          },
          message: 'Password reset requested successfully',
          errors: []
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          resetRequested: true,
          resetTokenExpiry: result.resetTokenExpiry?.toISOString()
        },
        message: 'Password reset requested successfully',
        errors: []
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Password reset request error',
        errors: [{ code: 'RESET_ERROR', message: 'An error occurred during password reset request' }]
      });
    }
  }
);

/**
 * Change password route
 * POST /password/change
 */
router.post(
  '/password/change',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').custom((value: any, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Validation error',
          errors: errors.array().map((err: any) => ({
            code: 'VALIDATION_ERROR',
            message: err.msg,
            field: err.param
          }))
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      // Change password
      try {
        const success = await authService.changePassword(userId, currentPassword, newPassword);

        if (!success) {
          return res.status(400).json({
            success: false,
            data: null,
            message: 'Password change failed',
            errors: [{ code: 'PASSWORD_CHANGE_FAILED', message: 'Failed to change password' }]
          });
        }

        // Return successful response
        return res.status(200).json({
          success: true,
          data: {
            passwordChanged: true
          },
          message: 'Password changed successfully',
          errors: []
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Password change failed',
          errors: [{ code: 'PASSWORD_CHANGE_FAILED', message: error.message || 'Failed to change password' }]
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Password change error',
        errors: [{ code: 'PASSWORD_CHANGE_ERROR', message: 'An error occurred during password change' }]
      });
    }
  }
);

export default router;