import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const emailController = new EmailController();

/**
 * @route GET /emails
 * @desc Get all emails with optional filtering
 * @access Private - Requires authentication
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  emailController.getEmails
);

/**
 * @route GET /emails/by-cif/:cif
 * @desc Get emails by customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/by-cif/:cif',
  requireAuth,
  emailController.getEmailsByCif
);

/**
 * @route GET /emails/:id
 * @desc Get email by ID
 * @access Private - Requires authentication
 */
router.get(
  '/:id',
  requireAuth,
  emailController.getEmailById
);

/**
 * @route POST /emails
 * @desc Create a new email
 * @access Private - Requires authentication
 */
router.post(
  '/',
  requireAuth,
  emailController.createEmail
);

/**
 * @route PUT /emails/:id
 * @desc Update an existing email
 * @access Private - Requires authentication
 */
router.put(
  '/:id',
  requireAuth,
  emailController.updateEmail
);

/**
 * @route DELETE /emails/:id
 * @desc Delete an email
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:id',
  requireAuth,
  requireRoles(['ADMIN', 'SUPERVISOR']),
  emailController.deleteEmail
);

export default router;