import { Router } from 'express';
import { PhoneTypesController } from '../controllers/phone-types.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const phoneTypesController = new PhoneTypesController();

// Note: Phone types are reference data, no auth required for GET operations
// Authentication only required for POST/PUT/DELETE operations

/**
 * @swagger
 * components:
 *   schemas:
 *     PhoneType:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: Unique identifier for the phone type
 *           example: "mobile1"
 *         label:
 *           type: string
 *           description: Human-readable label for the phone type
 *           example: "Mobile Phone 1"
 *         description:
 *           type: string
 *           description: Detailed description of the phone type
 *           example: "Primary mobile/cellular phone number"
 *     PhoneTypeRequest:
 *       type: object
 *       required:
 *         - value
 *         - label
 *       properties:
 *         value:
 *           type: string
 *           description: Unique identifier for the phone type
 *           example: "mobile1"
 *         label:
 *           type: string
 *           description: Human-readable label for the phone type
 *           example: "Mobile Phone 1"
 *         description:
 *           type: string
 *           description: Detailed description of the phone type
 *           example: "Primary mobile/cellular phone number"
 *         sort_order:
 *           type: integer
 *           description: Display order for sorting
 *           example: 1
 */

/**
 * @swagger
 * /phone-types:
 *   get:
 *     summary: Get all active phone types
 *     tags: [Phone Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Phone types retrieved successfully
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
 *                     $ref: '#/components/schemas/PhoneType'
 *                 message:
 *                   type: string
 *                   example: "Phone types retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', phoneTypesController.getPhoneTypes);

/**
 * @swagger
 * /phone-types/{value}:
 *   get:
 *     summary: Get phone type by value
 *     tags: [Phone Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone type value
 *         example: "mobile1"
 *     responses:
 *       200:
 *         description: Phone type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PhoneType'
 *                 message:
 *                   type: string
 *                   example: "Phone type retrieved successfully"
 *       404:
 *         description: Phone type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:value', phoneTypesController.getPhoneTypeByValue);

/**
 * @swagger
 * /phone-types:
 *   post:
 *     summary: Create new phone type
 *     tags: [Phone Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PhoneTypeRequest'
 *     responses:
 *       201:
 *         description: Phone type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PhoneType'
 *                 message:
 *                   type: string
 *                   example: "Phone type created successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAuth, phoneTypesController.createPhoneType);

/**
 * @swagger
 * /phone-types/{id}:
 *   put:
 *     summary: Update phone type
 *     tags: [Phone Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Human-readable label for the phone type
 *                 example: "Mobile Phone 1"
 *               description:
 *                 type: string
 *                 description: Detailed description of the phone type
 *                 example: "Primary mobile/cellular phone number"
 *               sort_order:
 *                 type: integer
 *                 description: Display order for sorting
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 description: Whether the phone type is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Phone type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PhoneType'
 *                 message:
 *                   type: string
 *                   example: "Phone type updated successfully"
 *       404:
 *         description: Phone type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', requireAuth, phoneTypesController.updatePhoneType);

/**
 * @swagger
 * /phone-types/{id}:
 *   delete:
 *     summary: Deactivate phone type
 *     tags: [Phone Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone type ID
 *     responses:
 *       200:
 *         description: Phone type deactivated successfully
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
 *                   example: "Phone type deactivated successfully"
 *       404:
 *         description: Phone type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requireAuth, phoneTypesController.deactivatePhoneType);

export default router;