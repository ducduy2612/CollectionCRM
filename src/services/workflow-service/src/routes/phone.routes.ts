import { Router } from 'express';
import { PhoneController } from '../controllers/phone.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const phoneController = new PhoneController();

/**
 * @route GET /phones
 * @desc Get all phones with optional filtering
 * @access Private - Requires authentication
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  phoneController.getPhones
);

/**
 * @route GET /phones/by-cif/:cif
 * @desc Get phones by customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/by-cif/:cif',
  requireAuth,
  phoneController.getPhonesByCif
);

/**
 * @route GET /phones/:id
 * @desc Get phone by ID
 * @access Private - Requires authentication
 */
router.get(
  '/:id',
  requireAuth,
  phoneController.getPhoneById
);

/**
 * @route POST /phones
 * @desc Create a new phone
 * @access Private - Requires authentication
 */
router.post(
  '/',
  requireAuth,
  phoneController.createPhone
);

/**
 * @route PUT /phones/:id
 * @desc Update an existing phone
 * @access Private - Requires authentication
 */
router.put(
  '/:id',
  requireAuth,
  phoneController.updatePhone
);

/**
 * @route DELETE /phones/:id
 * @desc Delete a phone
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:id',
  requireAuth,
  requireRoles(['ADMIN', 'SUPERVISOR']),
  phoneController.deletePhone
);

export default router;