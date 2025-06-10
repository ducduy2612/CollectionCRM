import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const addressController = new AddressController();

/**
 * @route GET /addresses
 * @desc Get all addresses with optional filtering
 * @access Private - Requires authentication
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  addressController.getAddresses
);

/**
 * @route GET /addresses/by-cif/:cif
 * @desc Get addresses by customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/by-cif/:cif',
  requireAuth,
  addressController.getAddressesByCif
);

/**
 * @route GET /addresses/:id
 * @desc Get address by ID
 * @access Private - Requires authentication
 */
router.get(
  '/:id',
  requireAuth,
  addressController.getAddressById
);

/**
 * @route POST /addresses
 * @desc Create a new address
 * @access Private - Requires authentication
 */
router.post(
  '/',
  requireAuth,
  addressController.createAddress
);

/**
 * @route PUT /addresses/:id
 * @desc Update an existing address
 * @access Private - Requires authentication
 */
router.put(
  '/:id',
  requireAuth,
  addressController.updateAddress
);

/**
 * @route DELETE /addresses/:id
 * @desc Delete an address
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:id',
  requireAuth,
  requireRoles(['ADMIN', 'SUPERVISOR']),
  addressController.deleteAddress
);

export default router;