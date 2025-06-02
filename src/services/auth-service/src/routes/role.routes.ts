import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { roleService } from '../services/role.service';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * List roles route
 * GET /roles
 */
router.get(
  '/',
  authenticate,
  authorizeRoles(['ADMIN']),
  async (req: express.Request, res: express.Response) => {
    try {
      // Get all roles
      const roles = await roleService.getAllRoles();

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          roles
        },
        message: 'Roles retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('List roles error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve roles',
        errors: [{ code: 'ROLE_LIST_ERROR', message: 'An error occurred while retrieving roles' }]
      });
    }
  }
);

/**
 * Create role route
 * POST /roles
 */
router.post(
  '/',
  authenticate,
  authorizeRoles(['ADMIN']),
  [
    body('name').notEmpty().withMessage('Role name is required'),
    body('description').optional(),
    body('permissions').isArray().withMessage('Permissions must be an array'),
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

      const { name, description, permissions } = req.body;

      // Create role
      try {
        const role = await roleService.createRole(
          { name, description },
          permissions || []
        );

        // Return successful response
        return res.status(201).json({
          success: true,
          data: role,
          message: 'Role created successfully',
          errors: []
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Role creation failed',
          errors: [{ code: 'ROLE_CREATION_FAILED', message: error.message || 'Failed to create role' }]
        });
      }
    } catch (error) {
      console.error('Create role error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Role creation error',
        errors: [{ code: 'ROLE_CREATION_ERROR', message: 'An error occurred during role creation' }]
      });
    }
  }
);

/**
 * Get role by ID route
 * GET /roles/:id
 */
router.get(
  '/:id',
  authenticate,
  authorizeRoles(['ADMIN']),
  async (req: express.Request, res: express.Response) => {
    try {
      const roleId = req.params.id;

      // Get role
      const role = await roleService.getRoleById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Role not found',
          errors: [{ code: 'ROLE_NOT_FOUND', message: 'Role not found' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: role,
        message: 'Role retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('Get role error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve role',
        errors: [{ code: 'ROLE_RETRIEVAL_ERROR', message: 'An error occurred while retrieving role' }]
      });
    }
  }
);

/**
 * Update role route
 * PUT /roles/:id
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles(['ADMIN']),
  [
    body('description').optional(),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
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

      const roleId = req.params.id;
      const { description, permissions } = req.body;

      // Update role
      try {
        const role = await roleService.updateRole(
          roleId,
          { description },
          permissions
        );

        if (!role) {
          return res.status(404).json({
            success: false,
            data: null,
            message: 'Role not found',
            errors: [{ code: 'ROLE_NOT_FOUND', message: 'Role not found' }]
          });
        }

        // Return successful response
        return res.status(200).json({
          success: true,
          data: role,
          message: 'Role updated successfully',
          errors: []
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Role update failed',
          errors: [{ code: 'ROLE_UPDATE_FAILED', message: error.message || 'Failed to update role' }]
        });
      }
    } catch (error) {
      console.error('Update role error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Role update error',
        errors: [{ code: 'ROLE_UPDATE_ERROR', message: 'An error occurred during role update' }]
      });
    }
  }
);

/**
 * Delete role route
 * DELETE /roles/:id
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(['ADMIN']),
  async (req: express.Request, res: express.Response) => {
    try {
      const roleId = req.params.id;

      // Delete role
      const deleted = await roleService.deleteRole(roleId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Role not found',
          errors: [{ code: 'ROLE_NOT_FOUND', message: 'Role not found' }]
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: {
          id: roleId,
          deleted: true
        },
        message: 'Role deleted successfully',
        errors: []
      });
    } catch (error) {
      console.error('Delete role error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to delete role',
        errors: [{ code: 'ROLE_DELETION_ERROR', message: 'An error occurred while deleting role' }]
      });
    }
  }
);

/**
 * Get users with role route
 * GET /roles/:id/users
 */
router.get(
  '/:id/users',
  authenticate,
  authorizeRoles(['ADMIN']),
  async (req: express.Request, res: express.Response) => {
    try {
      const roleId = req.params.id;
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = Math.min(
        parseInt(req.query.pageSize as string || '10', 10),
        100 // Maximum page size
      );

      // Get users with role
      const { users, total, totalPages } = await roleService.getUsersWithRole(
        roleId,
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
        message: 'Users with role retrieved successfully',
        errors: []
      });
    } catch (error) {
      console.error('Get users with role error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Failed to retrieve users with role',
        errors: [{ code: 'USER_ROLE_RETRIEVAL_ERROR', message: 'An error occurred while retrieving users with role' }]
      });
    }
  }
);

/**
 * Assign role to users route
 * POST /roles/:id/users
 */
router.post(
  '/:id/users',
  authenticate,
  authorizeRoles(['ADMIN']),
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
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

      const roleId = req.params.id;
      const { userIds } = req.body;

      // Assign role to users
      try {
        const assignedUsers = await roleService.assignRoleToUsers(roleId, userIds);

        // Return successful response
        return res.status(200).json({
          success: true,
          data: {
            roleId,
            assignedUsers
          },
          message: 'Role assigned to users successfully',
          errors: []
        });
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Role assignment failed',
          errors: [{ code: 'ROLE_ASSIGNMENT_FAILED', message: error.message || 'Failed to assign role to users' }]
        });
      }
    } catch (error) {
      console.error('Assign role to users error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'Role assignment error',
        errors: [{ code: 'ROLE_ASSIGNMENT_ERROR', message: 'An error occurred during role assignment' }]
      });
    }
  }
);

/**
 * Remove users from role route
 * DELETE /roles/:id/users
 */
router.delete(
  '/:id/users',
  authenticate,
  authorizeRoles(['ADMIN']),
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Debug logging
      console.log('DELETE /roles/:id/users - Request body:', req.body);
      console.log('DELETE /roles/:id/users - Content-Type:', req.headers['content-type']);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
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

      const roleId = req.params.id;
      const { userIds } = req.body;
      
      console.log('Role ID:', roleId);
      console.log('User IDs:', userIds);

      // Remove users from role
      try {
        console.log('Calling roleService.removeUsersFromRole...');
        const removedUsers = await roleService.removeUsersFromRole(roleId, userIds);
        console.log('Service call successful, removed users:', removedUsers);

        // Return successful response
        return res.status(200).json({
          success: true,
          data: {
            roleId,
            assignedUsers: removedUsers // Keep consistent with assignRoleToUsers response structure
          },
          message: 'Users removed from role successfully',
          errors: []
        });
      } catch (error: any) {
        console.log('Service call failed with error:', error.message);
        console.log('Error stack:', error.stack);
        return res.status(400).json({
          success: false,
          data: null,
          message: 'User removal from role failed',
          errors: [{ code: 'ROLE_REMOVAL_FAILED', message: error.message || 'Failed to remove users from role' }]
        });
      }
    } catch (error) {
      console.error('Remove users from role error:', error);
      return res.status(500).json({
        success: false,
        data: null,
        message: 'User removal from role error',
        errors: [{ code: 'ROLE_REMOVAL_ERROR', message: 'An error occurred during user removal from role' }]
      });
    }
  }
);

export default router;