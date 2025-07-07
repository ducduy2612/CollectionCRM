import { Router } from 'express';
import { AddressTypesController } from '../controllers/address-types.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const addressTypesController = new AddressTypesController();

// Note: Address types are reference data, no auth required for GET operations
// Authentication only required for POST/PUT/DELETE operations

/**
 * @swagger
 * components:
 *   schemas:
 *     AddressType:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: Unique identifier for the address type
 *           example: "home1"
 *         label:
 *           type: string
 *           description: Human-readable label for the address type
 *           example: "Home Address 1"
 *         description:
 *           type: string
 *           description: Detailed description of the address type
 *           example: "Primary home/residential address"
 *     AddressTypeRequest:
 *       type: object
 *       required:
 *         - value
 *         - label
 *       properties:
 *         value:
 *           type: string
 *           description: Unique identifier for the address type
 *           example: "home1"
 *         label:
 *           type: string
 *           description: Human-readable label for the address type
 *           example: "Home Address 1"
 *         description:
 *           type: string
 *           description: Detailed description of the address type
 *           example: "Primary home/residential address"
 *         sort_order:
 *           type: integer
 *           description: Display order for sorting
 *           example: 1
 */

/**
 * @swagger
 * /address-types:
 *   get:
 *     summary: Get all active address types
 *     tags: [Address Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AddressType'
 *                 message:
 *                   type: string
 *                   example: "Address types retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', addressTypesController.getAddressTypes);

/**
 * @swagger
 * /address-types/{value}:
 *   get:
 *     summary: Get address type by value
 *     tags: [Address Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Address type value
 *         example: "home1"
 *     responses:
 *       200:
 *         description: Address type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AddressType'
 *                 message:
 *                   type: string
 *                   example: "Address type retrieved successfully"
 *       404:
 *         description: Address type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:value', addressTypesController.getAddressTypeByValue);

/**
 * @swagger
 * /address-types:
 *   post:
 *     summary: Create new address type
 *     tags: [Address Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressTypeRequest'
 *     responses:
 *       201:
 *         description: Address type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AddressType'
 *                 message:
 *                   type: string
 *                   example: "Address type created successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAuth, addressTypesController.createAddressType);

/**
 * @swagger
 * /address-types/{id}:
 *   put:
 *     summary: Update address type
 *     tags: [Address Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Human-readable label for the address type
 *                 example: "Home Address 1"
 *               description:
 *                 type: string
 *                 description: Detailed description of the address type
 *                 example: "Primary home/residential address"
 *               sort_order:
 *                 type: integer
 *                 description: Display order for sorting
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 description: Whether the address type is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Address type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AddressType'
 *                 message:
 *                   type: string
 *                   example: "Address type updated successfully"
 *       404:
 *         description: Address type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', requireAuth, addressTypesController.updateAddressType);

/**
 * @swagger
 * /address-types/{id}:
 *   delete:
 *     summary: Deactivate address type
 *     tags: [Address Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address type ID
 *     responses:
 *       200:
 *         description: Address type deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address type deactivated successfully"
 *       404:
 *         description: Address type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requireAuth, addressTypesController.deactivateAddressType);

export default router;