import { Request, Response, NextFunction } from 'express';
import { CustomerCaseRepository, CustomerCaseActionRepository } from '../repositories/customer-case.repository';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Case controller
 */
export class CaseController {
  /**
   * Get customer case history
   * @route GET /cases/customer/:cif
   */
  async getCustomerCaseHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const result = await CustomerCaseActionRepository.findByCif(cif, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          caseActions: result.items,
          pagination: result.pagination
        },
        'Customer case history retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting customer case history');
      next(error);
    }
  }
  
  /**
   * Record case action
   * @route POST /cases
   */
  async recordCaseAction(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        cif,
        actionDate,
        notes,
        customerStatus,
        collateralStatus,
        processingStateStatus,
        lendingViolationStatus,
        recoveryAbilityStatus
      } = req.body;
      
      // Validate required fields
      if (!cif) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'CIF is required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // At least one status field should be provided
      if (!customerStatus && !collateralStatus && !processingStateStatus && 
          !lendingViolationStatus && !recoveryAbilityStatus && !notes) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'At least one status field or notes is required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create case action
      const caseAction = await CustomerCaseActionRepository.createCaseAction({
        cif,
        agentId: req.user?.agentId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        customerStatus,
        collateralStatus,
        processingStateStatus,
        lendingViolationStatus,
        recoveryAbilityStatus,
        createdBy: req.user?.userId || 'system',
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ caseActionId: caseAction.id, cif }, 'Case action recorded successfully');
      
      return ResponseUtil.success(
        res,
        caseAction,
        'Case action recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording case action');
      next(error);
    }
  }
  
  /**
   * Get customer case status
   * @route GET /cases/status/:cif
   */
  async getCustomerCaseStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const status = await CustomerCaseRepository.getCustomerCaseStatus(cif);
      
      return ResponseUtil.success(
        res,
        status,
        'Customer case status retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting customer case status');
      next(error);
    }
  }
}