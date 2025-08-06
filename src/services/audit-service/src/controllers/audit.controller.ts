import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuditLogRepository, AuditLogFilters, PaginationOptions } from '../repositories/audit-log.repository';
import { logger } from '../utils/logger';

/**
 * Audit controller for handling audit log queries
 */
export class AuditController {
  private auditLogRepository: AuditLogRepository;

  constructor() {
    this.auditLogRepository = new AuditLogRepository();
  }

  /**
   * Get audit logs with filters and pagination
   */
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
        return;
      }

      const filters: AuditLogFilters = {
        userId: req.query.userId as string,
        agentId: req.query.agentId as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        eventType: req.query.eventType as string,
        serviceName: req.query.serviceName as string,
        action: req.query.action as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const pagination: PaginationOptions = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: req.query.sortBy as string || 'createdAt',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC'
      };

      const result = await this.auditLogRepository.findWithFilters(filters, pagination);

      res.json({
        success: true,
        data: {
          data: result.logs,
          total: result.total,
          page: pagination.page!,
          limit: pagination.limit!,
          totalPages: Math.ceil(result.total / pagination.limit!)
        }
      });
    } catch (error) {
      logger.error({ message: 'Error fetching audit logs', error });
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch audit logs'
      });
    }
  }

  /**
   * Get audit log by ID
   */
  async getLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const auditLog = await this.auditLogRepository.findById(id);
      
      if (!auditLog) {
        res.status(404).json({ 
          error: 'Not found',
          message: 'Audit log not found'
        });
        return;
      }

      res.json({
        success: true,
        data: auditLog
      });
    } catch (error) {
      logger.error({ message: 'Error fetching audit log by ID', error });
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch audit log'
      });
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const auditLogs = await this.auditLogRepository.findByUserId(userId, limit);

      res.json({
        success: true,
        data: auditLogs,
        count: auditLogs.length
      });
    } catch (error) {
      logger.error({ message: 'Error fetching user audit logs', error });
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch user audit logs'
      });
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const auditLogs = await this.auditLogRepository.findByEntity(entityType, entityId, limit);

      res.json({
        success: true,
        data: auditLogs,
        count: auditLogs.length
      });
    } catch (error) {
      logger.error({ message: 'Error fetching entity audit logs', error });
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch entity audit logs'
      });
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const filters: AuditLogFilters = {
        userId: req.query.userId as string,
        agentId: req.query.agentId as string,
        entityType: req.query.entityType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const statistics = await this.auditLogRepository.getStatistics(filters);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error({ message: 'Error fetching audit statistics', error });
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch audit statistics'
      });
    }
  }
}

// Create a singleton instance
export const auditController = new AuditController();