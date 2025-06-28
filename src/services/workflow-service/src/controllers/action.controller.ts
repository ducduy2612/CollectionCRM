import { Request, Response, NextFunction } from 'express';
import { EntityManager } from 'typeorm';
import { ActionRecordRepository } from '../repositories/action-record.repository';
import {
  ActionRecord,
  VisitLocation,
  ActionType,
  ActionSubtype,
  ActionResult
} from '../entities';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';
import { actionRecordPublisher } from '../kafka/publishers/action-record.publisher';

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
        actionTypeId,
        actionSubtypeId,
        actionResultId,
        actionDate,
        promiseDate,
        promiseAmount,
        dueAmount,
        dpd,
        fUpdate,
        notes,
        visitLocation
      } = req.body;
      
      // Validate required fields
      if (!cif || !loanAccountNumber || !actionTypeId || !actionSubtypeId || !actionResultId) {
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
        actionTypeId: actionTypeId,
        actionSubtypeId: actionSubtypeId,
        actionResultId: actionResultId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        promiseDate: promiseDate,
        promiseAmount: promiseAmount,
        dueAmount: dueAmount,
        dpd: dpd,
        fUpdate: fUpdate ? new Date(fUpdate) : new Date(), // Set fUpdate to current timestamp for now, in future needs more fUpdate logic handling
        notes,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });
      
      // Set visit location if provided
      if (visitLocation) {
        action.setVisitLocation(visitLocation as VisitLocation);
        await ActionRecordRepository.save(action);
      }

      // Publish Kafka event for customer case f_update (1 event per customer)
      try {
        await actionRecordPublisher.publishActionRecordCreated({
          actionIds: [action.id],
          cif: action.cif,
          loanAccountNumbers: [action.loanAccountNumber],
          agentId: action.agentId,
          agentName: req.user?.agentName || req.user?.username || 'system',
          fUpdate: action.fUpdate || new Date(),
          actionDate: action.actionDate
        });
        
        logger.debug({
          actionId: action.id,
          cif: action.cif
        }, 'Published action record created event for customer f_update');
      } catch (kafkaError) {
        logger.warn({ 
          kafkaError, 
          actionId: action.id, 
          cif 
        }, 'Failed to publish action record created event, but action was saved successfully');
        // Don't fail the request if Kafka publishing fails
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
   * Record multiple actions in bulk
   * @route POST /actions/bulk
   */
  async recordBulkActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { actions } = req.body;
      
      // Validate that actions array is provided and not empty
      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Actions array is required and must not be empty',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Validate each action has required fields
      const invalidActions: number[] = [];
      actions.forEach((action, index) => {
        const { cif, loanAccountNumber, actionTypeId, actionSubtypeId, actionResultId } = action;
        if (!cif || !loanAccountNumber || !actionTypeId || !actionSubtypeId || !actionResultId) {
          invalidActions.push(index);
        }
      });

      if (invalidActions.length > 0) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          `Missing required fields in actions at indices: ${invalidActions.join(', ')}`,
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const results = {
        successful: [] as any[],
        failed: [] as any[],
        summary: {
          total: actions.length,
          successful: 0,
          failed: 0
        }
      };

      // Use database transaction for consistency
      await ActionRecordRepository.manager.transaction(async (transactionalEntityManager: EntityManager) => {
        for (let i = 0; i < actions.length; i++) {
          try {
            const actionData = actions[i];
            const {
              cif,
              loanAccountNumber,
              actionTypeId,
              actionSubtypeId,
              actionResultId,
              actionDate,
              promiseDate,
              promiseAmount,
              dueAmount,
              dpd,
              fUpdate,
              notes,
              visitLocation
            } = actionData;

            // Create action record within transaction
            const action = transactionalEntityManager.create(ActionRecord, {
              cif,
              loanAccountNumber,
              agentId: req.user?.agentId,
              actionTypeId: actionTypeId,
              actionSubtypeId: actionSubtypeId,
              actionResultId: actionResultId,
              actionDate: actionDate ? new Date(actionDate) : new Date(),
              promiseDate: promiseDate,
              promiseAmount: promiseAmount,
              dueAmount: dueAmount,
              dpd: dpd,
              fUpdate: fUpdate ? new Date(fUpdate) : new Date(),
              notes,
              createdBy: req.user?.username || 'system',
              updatedBy: req.user?.username || 'system'
            });

            const savedAction = await transactionalEntityManager.save(ActionRecord, action);

            // Set visit location if provided
            if (visitLocation) {
              savedAction.setVisitLocation(visitLocation as VisitLocation);
              await transactionalEntityManager.save(ActionRecord, savedAction);
            }

            results.successful.push({
              index: i,
              actionId: savedAction.id,
              cif: savedAction.cif,
              loanAccountNumber: savedAction.loanAccountNumber
            });
            results.summary.successful++;

            logger.info({
              actionId: savedAction.id,
              cif: savedAction.cif,
              index: i
            }, 'Bulk action recorded successfully');

          } catch (error) {
            logger.error({
              error,
              index: i,
              actionData: actions[i]
            }, 'Error recording bulk action');

            results.failed.push({
              index: i,
              error: error instanceof Error ? error.message : 'Unknown error',
              actionData: actions[i]
            });
            results.summary.failed++;
          }
        }
      });

      // Publish Kafka events for successful actions - group by CIF to send only 1 event per customer
      if (results.successful.length > 0) {
        try {
          // Group successful actions by CIF and collect ALL action IDs and loan account numbers
          const customerUpdates = new Map<string, {
            actionIds: string[];
            loanAccountNumbers: string[];
            agentId: string;
            agentName: string;
            fUpdate: Date;
            actionDate: Date;
          }>();

          results.successful.forEach(successfulAction => {
            const originalAction = actions.find((_, index) => index === successfulAction.index);
            const fUpdate = originalAction?.fUpdate ? new Date(originalAction.fUpdate) : new Date();
            const actionDate = originalAction?.actionDate ? new Date(originalAction.actionDate) : new Date();
            
            const existing = customerUpdates.get(successfulAction.cif);
            
            if (!existing) {
              // First action for this customer
              customerUpdates.set(successfulAction.cif, {
                actionIds: [successfulAction.actionId],
                loanAccountNumbers: [successfulAction.loanAccountNumber],
                agentId: req.user?.agentId || 'system',
                agentName: req.user?.agentName || req.user?.username || 'system',
                fUpdate,
                actionDate
              });
            } else {
              // Add to existing customer data
              existing.actionIds.push(successfulAction.actionId);
              existing.loanAccountNumbers.push(successfulAction.loanAccountNumber);
              
              // Keep the latest f_update and actionDate
              if (fUpdate > existing.fUpdate) {
                existing.fUpdate = fUpdate;
                existing.actionDate = actionDate;
              }
            }
          });

          // Convert to array for batch publishing
          const kafkaPayloads = Array.from(customerUpdates.entries()).map(([cif, data]) => ({
            actionIds: data.actionIds,
            cif,
            loanAccountNumbers: data.loanAccountNumbers,
            agentId: data.agentId,
            agentName: data.agentName,
            fUpdate: data.fUpdate,
            actionDate: data.actionDate
          }));

          await actionRecordPublisher.publishBatchActionRecordCreated(kafkaPayloads);
          
          logger.info({
            totalActions: results.successful.length,
            uniqueCustomers: kafkaPayloads.length,
            publishedEvents: kafkaPayloads.length
          }, 'Published batch action record created events (1 per customer)');

        } catch (kafkaError) {
          logger.warn({ 
            kafkaError, 
            successfulCount: results.successful.length
          }, 'Failed to publish batch action record created events, but actions were saved successfully');
          // Don't fail the request if Kafka publishing fails
        }
      }

      logger.info({
        total: results.summary.total,
        successful: results.summary.successful,
        failed: results.summary.failed
      }, 'Bulk action recording completed');

      return ResponseUtil.success(
        res,
        results,
        `Bulk action recording completed. ${results.summary.successful} successful, ${results.summary.failed} failed.`,
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error in bulk action recording');
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
      const { agentName, loanAccountNumber, actionType, actionSubtype, actionResult ,startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const result = await ActionRecordRepository.findByCif(cif, {
        agentName: agentName as string,
        loanAccountNumber: loanAccountNumber as string,
        actionType: actionType as string,
        actionSubtype: actionSubtype as string,
        actionResult: actionResult as string,
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
      const { actionType, actionSubtype, actionResult ,startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const result = await ActionRecordRepository.findByLoanAccountNumber(accountNumber, {
        actionType: actionType as string,
        actionSubtype: actionSubtype as string,
        actionResult: actionResult as string,
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
   * Get agent actions
   * @route GET /actions/agent/:agentId
   */
  async getAgentActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      const { cif, loanAccountNumber, actionType, actionSubtype, actionResult, startDate, endDate, page = 1, pageSize = 10 } = req.query;
      
      const result = await ActionRecordRepository.findByAgentId(agentId, {
        cif: cif as string,
        loanAccountNumber: loanAccountNumber as string,
        actionType: actionType as string,
        actionSubtype: actionSubtype as string,
        actionResult: actionResult as string,
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
        'Agent actions retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting agent actions');
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
        actionResult as string,
        notes,
        req.user?.username || 'system'
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