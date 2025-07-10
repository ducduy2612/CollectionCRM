import { Router } from 'express';
import { ReferenceCustomerController } from '../controllers/reference-customer.controller';
import { requireAuth, requirePermissions } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const referenceCustomerController = new ReferenceCustomerController();

/**
 * @route GET /reference-customers
 * @desc Get all reference customers with optional filtering
 * @access Private - Requires authentication
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  referenceCustomerController.getReferenceCustomers
);

/**
 * @route GET /reference-customers/by-primary-cif/:primaryCif
 * @desc Get reference customers by primary customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/by-primary-cif/:primaryCif',
  requireAuth,
  referenceCustomerController.getReferenceCustomersByPrimaryCif
);

/**
 * @route GET /reference-customers/by-primary-cif/:primaryCif/with-contacts
 * @desc Get reference customers by primary customer CIF with contact information
 * @access Private - Requires authentication
 */
router.get(
  '/by-primary-cif/:primaryCif/with-contacts',
  requireAuth,
  referenceCustomerController.getReferenceCustomersByPrimaryCifWithContacts
);

/**
 * @route GET /reference-customers/:id
 * @desc Get reference customer by ID
 * @access Private - Requires authentication
 */
router.get(
  '/:id',
  requireAuth,
  referenceCustomerController.getReferenceCustomerById
);

/**
 * @route GET /reference-customers/:id/with-contacts
 * @desc Get reference customer by ID with contact information
 * @access Private - Requires authentication
 */
router.get(
  '/:id/with-contacts',
  requireAuth,
  referenceCustomerController.getReferenceCustomerByIdWithContacts
);

/**
 * @route POST /reference-customers
 * @desc Create a new reference customer
 * @access Private - Requires authentication
 */
router.post(
  '/',
  requireAuth,
  referenceCustomerController.createReferenceCustomer
);

/**
 * @route PUT /reference-customers/:id
 * @desc Update an existing reference customer
 * @access Private - Requires authentication
 */
router.put(
  '/:id',
  requireAuth,
  referenceCustomerController.updateReferenceCustomer
);

/**
 * @route DELETE /reference-customers/:id
 * @desc Delete a reference customer
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:id',
  requireAuth,
  requirePermissions(['system_admin:all']),
  referenceCustomerController.deleteReferenceCustomer
);

export default router;