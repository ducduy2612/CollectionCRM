import { Router } from 'express';
import { RelationshipTypesController } from '../controllers/relationship-types.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const relationshipTypesController = new RelationshipTypesController();

// Note: Relationship types are reference data, no auth required for GET operations
// Authentication only required for POST/PUT/DELETE operations

/**
 * @swagger
 * components:
 *   schemas:
 *     RelationshipType:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: Unique identifier for the relationship type
 *           example: "spouse"
 *         label:
 *           type: string
 *           description: Human-readable label for the relationship type
 *           example: "Spouse"
 *         description:
 *           type: string
 *           description: Detailed description of the relationship type
 *           example: "Husband or wife"
 *     RelationshipTypeRequest:
 *       type: object
 *       required:
 *         - value
 *         - label
 *       properties:
 *         value:
 *           type: string
 *           description: Unique identifier for the relationship type
 *           example: "spouse"
 *         label:
 *           type: string
 *           description: Human-readable label for the relationship type
 *           example: "Spouse"
 *         description:
 *           type: string
 *           description: Detailed description of the relationship type
 *           example: "Husband or wife"
 *         sort_order:
 *           type: integer
 *           description: Display order for sorting
 *           example: 1
 */

/**
 * @swagger
 * /relationship-types:
 *   get:
 *     summary: Get all active relationship types
 *     tags: [Relationship Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Relationship types retrieved successfully
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
 *                     $ref: '#/components/schemas/RelationshipType'
 *                 message:
 *                   type: string
 *                   example: "Relationship types retrieved successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', relationshipTypesController.getRelationshipTypes);

/**
 * @swagger
 * /relationship-types/{value}:
 *   get:
 *     summary: Get relationship type by value
 *     tags: [Relationship Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Relationship type value
 *         example: "spouse"
 *     responses:
 *       200:
 *         description: Relationship type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RelationshipType'
 *                 message:
 *                   type: string
 *                   example: "Relationship type retrieved successfully"
 *       404:
 *         description: Relationship type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:value', relationshipTypesController.getRelationshipTypeByValue);

/**
 * @swagger
 * /relationship-types:
 *   post:
 *     summary: Create new relationship type
 *     tags: [Relationship Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RelationshipTypeRequest'
 *     responses:
 *       201:
 *         description: Relationship type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RelationshipType'
 *                 message:
 *                   type: string
 *                   example: "Relationship type created successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAuth, relationshipTypesController.createRelationshipType);

/**
 * @swagger
 * /relationship-types/{id}:
 *   put:
 *     summary: Update relationship type
 *     tags: [Relationship Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Relationship type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 description: Human-readable label for the relationship type
 *                 example: "Spouse"
 *               description:
 *                 type: string
 *                 description: Detailed description of the relationship type
 *                 example: "Husband or wife"
 *               sort_order:
 *                 type: integer
 *                 description: Display order for sorting
 *                 example: 1
 *               is_active:
 *                 type: boolean
 *                 description: Whether the relationship type is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Relationship type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RelationshipType'
 *                 message:
 *                   type: string
 *                   example: "Relationship type updated successfully"
 *       404:
 *         description: Relationship type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', requireAuth, relationshipTypesController.updateRelationshipType);

/**
 * @swagger
 * /relationship-types/{id}:
 *   delete:
 *     summary: Deactivate relationship type
 *     tags: [Relationship Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Relationship type ID
 *     responses:
 *       200:
 *         description: Relationship type deactivated successfully
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
 *                   example: "Relationship type deactivated successfully"
 *       404:
 *         description: Relationship type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requireAuth, relationshipTypesController.deactivateRelationshipType);

export default router;