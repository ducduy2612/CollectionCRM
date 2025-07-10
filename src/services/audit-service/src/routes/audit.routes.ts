import { Router } from 'express';
import { query, param } from 'express-validator';
import { auditController } from '../controllers/audit.controller';

const router = Router();

/**
 * Validation middleware for audit log queries
 */
const validateAuditQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('sortBy').optional().isIn(['createdAt', 'timestamp', 'eventType', 'serviceName', 'action'])
    .withMessage('sortBy must be one of: createdAt, timestamp, eventType, serviceName, action'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('sortOrder must be ASC or DESC'),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  query('userId').optional().isUUID().withMessage('userId must be a valid UUID'),
  query('agentId').optional().isUUID().withMessage('agentId must be a valid UUID'),
  query('entityType').optional().isString().withMessage('entityType must be a string'),
  query('entityId').optional().isString().withMessage('entityId must be a string'),
  query('eventType').optional().isString().withMessage('eventType must be a string'),
  query('serviceName').optional().isString().withMessage('serviceName must be a string'),
  query('action').optional().isString().withMessage('action must be a string'),
  query('ipAddress').optional().isIP().withMessage('ipAddress must be a valid IP address'),
];

/**
 * Validation middleware for UUID parameters
 */
const validateUUIDParam = [
  param('id').isUUID().withMessage('ID must be a valid UUID'),
];

const validateUserIdParam = [
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
];

const validateEntityParams = [
  param('entityType').isString().withMessage('Entity type must be a string'),
  param('entityId').isString().withMessage('Entity ID must be a string'),
];

/**
 * @swagger
 * /api/v1/audit/logs:
 *   get:
 *     summary: Get audit logs with filters and pagination
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, timestamp, eventType, serviceName, action]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by agent ID
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filter by entity ID
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *         description: Filter by service name
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *       - in: query
 *         name: ipAddress
 *         schema:
 *           type: string
 *           format: ipv4
 *         description: Filter by IP address
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/logs', validateAuditQuery, auditController.getLogs.bind(auditController));

/**
 * @swagger
 * /api/v1/audit/logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Audit log not found
 *       500:
 *         description: Internal server error
 */
router.get('/logs/:id', validateUUIDParam, auditController.getLogById.bind(auditController));

/**
 * @swagger
 * /api/v1/audit/user/{userId}:
 *   get:
 *     summary: Get audit logs for a specific user
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId', validateUserIdParam, auditController.getUserLogs.bind(auditController));

/**
 * @swagger
 * /api/v1/audit/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get audit logs for a specific entity
 *     tags: [Audit]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
router.get('/entity/:entityType/:entityId', validateEntityParams, auditController.getEntityLogs.bind(auditController));

/**
 * @swagger
 * /api/v1/audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by agent ID
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', auditController.getStatistics.bind(auditController));

export default router;