import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { userService } from '../services/user.service';
import { authService } from '../services/auth.service';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * List users route
 * GET /users
 */
router.get(
  '/',
  authenticate,
  authorize(['user_management:user']),
  async (req: express.Request, res: express.Response) => {
    try {
      // Get query parameters
      const username = req.query.username as string | undefined;
      const email = req.query.email as string | undefined;
      const role = req.query.role as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : 
                      req.query.isActive === 'false' ? false : undefined;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = Math.min(
        parseInt(req.query.pageSize as string || '10', 10),
        100 // Maximum page size
      );

      // Get users
      const { users, total, totalPages } = await userService.getUsers(
        { username, email, role, is_active: isActive },
        page,
        pageSize
      );

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            pageSize,
            totalPages,
            totalItems: total
          }
        },
        message: 'Users retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('List users error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve users',
        errors: [{ code: 'USER_LIST_ERROR', message: 'An error occurred while retrieving users' }]
      });
    }
  }
);

/**
 * Create user route
 * POST /users
 */
router.post(
  '/',
  authenticate,
  authorize(['user_management:user']),
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('first_name').optional(),
    body('last_name').optional(),
    body('role').notEmpty().withMessage('Role is required'),
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

      const { username, email, password, first_name, last_name, role } = req.body;

      // Create user
      try {
        const currentUser = {
          userId: (req as any).user.id,
          username: (req as any).user.username
        };
        
        const user = await userService.createUser({
          username,
          email,
          password,
          first_name,
          last_name,
          role,
        }, currentUser);

        // Return successful response
        return res.status(201).json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            roles: [user.role],
            is_active: user.is_active,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
          },
          message: 'User created successfully',
          errors: []
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'User creation failed',
          errors: [{ code: 'USER_CREATION_FAILED', message: error.message || 'Failed to create user' }]
        });
      }
    } catch (error) {
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'User creation error',
        errors: [{ code: 'USER_CREATION_ERROR', message: 'An error occurred during user creation' }]
      });
    }
  }
);

/**
 * Get user by ID route
 * GET /users/:id
 */
router.get(
  '/:id',
  authenticate,
  authorize(['user_management:user']),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.params.id;

      // Get user
      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
          errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve user',
        errors: [{ code: 'USER_RETRIEVAL_ERROR', message: 'An error occurred while retrieving user' }]
      });
    }
  }
);

/**
 * Update user route
 * PUT /users/:id
 */
router.put(
  '/:id',
  authenticate,
  authorize(['user_management:user']),
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('first_name').optional(),
    body('last_name').optional(),
    body('role').optional(),
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

      const userId = req.params.id;
      const { email, first_name, last_name, role } = req.body;

      // Update user
      try {
        const currentUser = {
          userId: (req as any).user.id,
          username: (req as any).user.username
        };
        
        const user = await userService.updateUser(userId, {
          email,
          first_name,
          last_name,
          role,
        }, currentUser);

        if (!user) {
          return res.status(404).json({
            success: false,
            data: null,
            message: 'User not found',
            errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }]
          });
        }

        // Return successful response
        return res.status(200).json({
          success: true,
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            roles: [user.role],
            is_active: user.is_active,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
          },
          message: 'User updated successfully',
          errors: []
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'User update failed',
          errors: [{ code: 'USER_UPDATE_FAILED', message: error.message || 'Failed to update user' }]
        });
      }
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'User update error',
        errors: [{ code: 'USER_UPDATE_ERROR', message: 'An error occurred during user update' }]
      });
    }
  }
);

/**
 * Activate user route
 * PUT /users/:id/activate
 */
router.put(
  '/:id/activate',
  authenticate,
  authorize(['user_management:user']),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.params.id;

      // Activate user
      const currentUser = {
        userId: (req as any).user.id,
        username: (req as any).user.username
      };
      
      const user = await userService.activateUser(userId, currentUser);

      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
          errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          is_active: user.is_active,
          updated_at: user.updated_at
        },
        message: 'User activated successfully',
        errors: []
      });
    } catch (error) {
      console.error('Activate user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to activate user',
        errors: [{ code: 'USER_ACTIVATION_ERROR', message: 'An error occurred while activating user' }]
      });
    }
  }
);

/**
 * Deactivate user route
 * PUT /users/:id/deactivate
 */
router.put(
  '/:id/deactivate',
  authenticate,
  authorize(['user_management:user']),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.params.id;

      // Deactivate user
      const currentUser = {
        userId: (req as any).user.id,
        username: (req as any).user.username
      };
      
      const user = await userService.deactivateUser(userId, currentUser);

      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'User not found',
          errors: [{ code: 'USER_NOT_FOUND', message: 'User not found' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          is_active: user.is_active,
          updated_at: user.updated_at
        },
        message: 'User deactivated successfully',
        errors: []
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to deactivate user',
        errors: [{ code: 'USER_DEACTIVATION_ERROR', message: 'An error occurred while deactivating user' }]
      });
    }
  }
);

/**
 * Get user sessions route
 * GET /users/:id/sessions
 */
router.get(
  '/:id/sessions',
  authenticate,
  authorize(['user_management:user']),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.params.id;

      // Get user sessions
      const sessions = await authService.getUserSessions(userId);

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          sessions
        },
        message: 'User sessions retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('Get user sessions error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve user sessions',
        errors: [{ code: 'SESSION_RETRIEVAL_ERROR', message: 'An error occurred while retrieving user sessions' }]
      });
    }
  }
);

/**
 * Terminate user sessions route
 * DELETE /users/:id/sessions
 */
router.delete(
  '/:id/sessions',
  authenticate,
  authorize(['user_management:user']),
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.params.id;

      // Terminate user sessions
      const terminatedSessions = await authService.terminateUserSessions(userId);

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          terminatedSessions
        },
        message: 'User sessions terminated successfully',
        errors: []
      });
    } catch (error) {
      console.error('Terminate user sessions error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to terminate user sessions',
        errors: [{ code: 'SESSION_TERMINATION_ERROR', message: 'An error occurred while terminating user sessions' }]
      });
    }
  }
);

export default router;