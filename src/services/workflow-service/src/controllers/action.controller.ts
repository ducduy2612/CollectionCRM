import { Request, Response, NextFunction } from 'express';
import { ActionRecordRepository } from '../repositories/action-record.repository';
import { ActionRecord, ActionType, ActionSubtype, ActionResult, VisitLocation } from '../entities/action-record.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Action controller
 */
export class ActionController {
  /**
   * Record a new action
   * @route POST /actions
   */
  async recordAction(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        cif,
        loanAccountNumber,
        type,
        subtype,
        actionResult,
        actionDate,
        notes,
        callTraceId,
        visitLocation
      } = req.body;
      
      // Validate required fields
      if (!cif || !loanAccountNumber || !type || !subtype || !actionResult) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create action record
      const action = await ActionRecordRepository.createAction({
        cif,
        loanAccountNumber,
        agentId: req.user?.agentId,
        type,
        subtype,
        actionResult,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        callTraceId,
        createdBy: req.user?.userId || 'system',
        updatedBy: req.user?.userId || 'system'
      });
      
      // Set visit location if provided
      if (visitLocation) {
        action.setVisitLocation(visitLocation as VisitLocation);
        await ActionRecordRepository.save(action);
      }
      
      logger.info({ actionId: action.id, cif }, 'Action recorded successfully');
      
      return ResponseUtil.success(
        res,
        action,
        'Action recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording action');
      next(error);
    }
  }
  
  /**
   * Get customer actions
   * @route GET /actions/customer/:cif
   */
  async getCustomerActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { type, startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const result = await ActionRecordRepository.findByCif(cif, {
        type: type as ActionType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          actions: result.items,
          pagination: result.pagination
        },
        'Customer actions retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting customer actions');
      next(error);
    }
  }
  
  /**
   * Get loan actions
   * @route GET /actions/loan/:accountNumber
   */
  async getLoanActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNumber } = req.params;
      const { type, startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const result = await ActionRecordRepository.findByLoanAccountNumber(accountNumber, {
        type: type as ActionType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          actions: result.items,
          pagination: result.pagination
        },
        'Loan actions retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting loan actions');
      next(error);
    }
  }
  
  /**
   * Update action result
   * @route PUT /actions/:id/result
   */
  async updateActionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { actionResult, notes } = req.body;
      
      if (!actionResult) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Action result is required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const action = await ActionRecordRepository.updateActionResult(
        id,
        actionResult as ActionResult,
        notes,
        req.user?.userId || 'system'
      );
      
      logger.info({ actionId: id }, 'Action result updated successfully');
      
      return ResponseUtil.success(
        res,
        action,
        'Action result updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating action result');
      next(error);
    }
  }
}