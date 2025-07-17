import { Router } from 'express';
import { CustomerContactController } from '../controllers/customer-contact.controller';
import { requireAuth, requirePermissions } from '../middleware/auth.middleware';

const router = Router();
const customerContactController = new CustomerContactController();

// =============================================
// CONSOLIDATED CONTACT ENDPOINTS
// =============================================

/**
 * @route GET /customers/:cif/contacts
 * @desc Get all contact information (phones, addresses, emails) for a customer
 * @access Private - Requires authentication
 */
router.get(
  '/:cif/contacts',
  requireAuth,
  customerContactController.getAllContactsByCif
);

// =============================================
// PHONE ENDPOINTS
// =============================================

/**
 * @route GET /customers/:cif/phones
 * @desc Get phones by customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/:cif/phones',
  requireAuth,
  customerContactController.getPhonesByCif
);

/**
 * @route POST /customers/:cif/phones
 * @desc Create a new phone for customer
 * @access Private - Requires authentication
 */
router.post(
  '/:cif/phones',
  requireAuth,
  requirePermissions(['customer_info:add']),
  customerContactController.createPhone
);

/**
 * @route PUT /customers/:cif/phones/:phoneId
 * @desc Update a phone
 * @access Private - Requires authentication
 */
router.put(
  '/:cif/phones/:phoneId',
  requireAuth,
  requirePermissions(['customer_info:update']),
  customerContactController.updatePhone
);

/**
 * @route DELETE /customers/:cif/phones/:phoneId
 * @desc Delete a phone
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:cif/phones/:phoneId',
  requireAuth,
  requirePermissions(['customer_info:delete']),
  customerContactController.deletePhone
);

// =============================================
// ADDRESS ENDPOINTS
// =============================================

/**
 * @route GET /customers/:cif/addresses
 * @desc Get addresses by customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/:cif/addresses',
  requireAuth,
  customerContactController.getAddressesByCif
);

/**
 * @route POST /customers/:cif/addresses
 * @desc Create a new address for customer
 * @access Private - Requires authentication
 */
router.post(
  '/:cif/addresses',
  requireAuth,
  requirePermissions(['customer_info:add']),
  customerContactController.createAddress
);

/**
 * @route PUT /customers/:cif/addresses/:addressId
 * @desc Update an address
 * @access Private - Requires authentication
 */
router.put(
  '/:cif/addresses/:addressId',
  requireAuth,
  requirePermissions(['customer_info:update']),
  customerContactController.updateAddress
);

/**
 * @route DELETE /customers/:cif/addresses/:addressId
 * @desc Delete an address
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:cif/addresses/:addressId',
  requireAuth,
  requirePermissions(['customer_info:delete']),
  customerContactController.deleteAddress
);

// =============================================
// EMAIL ENDPOINTS
// =============================================

/**
 * @route GET /customers/:cif/emails
 * @desc Get emails by customer CIF
 * @access Private - Requires authentication
 */
router.get(
  '/:cif/emails',
  requireAuth,
  customerContactController.getEmailsByCif
);

/**
 * @route POST /customers/:cif/emails
 * @desc Create a new email for customer
 * @access Private - Requires authentication
 */
router.post(
  '/:cif/emails',
  requireAuth,
  requirePermissions(['customer_info:add']),
  customerContactController.createEmail
);

/**
 * @route PUT /customers/:cif/emails/:emailId
 * @desc Update an email
 * @access Private - Requires authentication
 */
router.put(
  '/:cif/emails/:emailId',
  requireAuth,
  requirePermissions(['customer_info:update']),
  customerContactController.updateEmail
);

/**
 * @route DELETE /customers/:cif/emails/:emailId
 * @desc Delete an email
 * @access Private - Requires authentication and admin/supervisor role
 */
router.delete(
  '/:cif/emails/:emailId',
  requireAuth,
  requirePermissions(['customer_info:delete']),
  customerContactController.deleteEmail
);

export default router;