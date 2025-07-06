import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const customerController = new CustomerController();

/**
 * @route GET /customers/:cif
 * @desc Get customer by CIF
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/:cif',
  requireAuth,
  customerController.getCustomerByCif
);

/**
 * @route GET /customers
 * @desc Search customers
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  customerController.searchCustomers
);

/**
 * @route GET /customers/:cif/loans
 * @desc Get customer loans
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/:cif/loans',
  requireAuth,
  validatePagination,
  customerController.getCustomerLoans
);

/**
 * @route GET /customers/:cif/collaterals
 * @desc Get customer collaterals
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/:cif/collaterals',
  requireAuth,
  validatePagination,
  customerController.getCustomerCollaterals
);

/**
 * @route GET /customers/:cif/references
 * @desc Get customer references
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/:cif/references',
  requireAuth,
  validatePagination,
  customerController.getCustomerReferences
);

/**
 * @route GET /customers/:cif/references-with-contacts
 * @desc Get customer references with contact information
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/:cif/references-with-contacts',
  requireAuth,
  validatePagination,
  customerController.getCustomerReferencesWithContacts
);

export default router;