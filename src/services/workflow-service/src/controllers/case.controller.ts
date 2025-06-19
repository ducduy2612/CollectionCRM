import { Request, Response, NextFunction } from 'express';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';
import {
  CustomerStatusRepository,
  LendingViolationStatusRepository,
  RecoveryAbilityStatusRepository,
  ProcessingStateStatusRepository,
  CollateralStatusRepository,
  CustomerCaseRepository
} from '../repositories';

/**
 * Case controller
 */
export class CaseController {
  /**
   * Get customer status list by CIF
   * @route GET /customer-status/:cif
   */
  async getCustomerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { page = 1, pageSize = 100 } = req.query;

      const result = await CustomerStatusRepository.findByCif(
        cif,
        Number(page),
        Number(pageSize)
      );

      logger.info({ cif, page, pageSize }, 'Customer status retrieved successfully');

      return ResponseUtil.success(
        res,
        result,
        'Customer status retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving customer status');
      next(error);
    }
  }

  /**
   * Record new customer status
   * @route POST /customer-status
   */
  async recordCustomerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, statusId, actionDate, notes } = req.body;

      // Validate required fields
      if (!cif || !statusId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, statusId',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const status = await CustomerStatusRepository.createStatus({
        cif,
        agentId: req.user?.agentId,
        statusId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });

      logger.info({ statusId: status.id, cif }, 'Customer status recorded successfully');

      return ResponseUtil.success(
        res,
        status,
        'Customer status recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording customer status');
      next(error);
    }
  }

  /**
   * Get lending violation status list by CIF
   * @route GET /lending-violation-status/:cif
   */
  async getLendingViolationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { page = 1, pageSize = 100 } = req.query;

      const result = await LendingViolationStatusRepository.findByCif(
        cif,
        Number(page),
        Number(pageSize)
      );

      logger.info({ cif, page, pageSize }, 'Lending violation status retrieved successfully');

      return ResponseUtil.success(
        res,
        result,
        'Lending violation status retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving lending violation status');
      next(error);
    }
  }

  /**
   * Record new lending violation status
   * @route POST /lending-violation-status
   */
  async recordLendingViolationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, statusId, actionDate, notes } = req.body;

      // Validate required fields
      if (!cif || !statusId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, statusId',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const status = await LendingViolationStatusRepository.createStatus({
        cif,
        agentId: req.user?.agentId,
        statusId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });

      logger.info({ statusId: status.id, cif }, 'Lending violation status recorded successfully');

      return ResponseUtil.success(
        res,
        status,
        'Lending violation status recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording lending violation status');
      next(error);
    }
  }

  /**
   * Get recovery ability status list by CIF
   * @route GET /recovery-ability-status/:cif
   */
  async getRecoveryAbilityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { page = 1, pageSize = 100 } = req.query;

      const result = await RecoveryAbilityStatusRepository.findByCif(
        cif,
        Number(page),
        Number(pageSize)
      );

      logger.info({ cif, page, pageSize }, 'Recovery ability status retrieved successfully');

      return ResponseUtil.success(
        res,
        result,
        'Recovery ability status retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving recovery ability status');
      next(error);
    }
  }

  /**
   * Record new recovery ability status
   * @route POST /recovery-ability-status
   */
  async recordRecoveryAbilityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, statusId, actionDate, notes } = req.body;

      // Validate required fields
      if (!cif || !statusId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, statusId',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const status = await RecoveryAbilityStatusRepository.createStatus({
        cif,
        agentId: req.user?.agentId,
        statusId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });

      logger.info({ statusId: status.id, cif }, 'Recovery ability status recorded successfully');

      return ResponseUtil.success(
        res,
        status,
        'Recovery ability status recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording recovery ability status');
      next(error);
    }
  }

  /**
   * Get processing state status list by CIF
   * @route GET /processing-state-status/:cif
   */
  async getProcessingStateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { page = 1, pageSize = 100 } = req.query;

      const result = await ProcessingStateStatusRepository.findByCif(
        cif,
        Number(page),
        Number(pageSize)
      );

      logger.info({ cif, page, pageSize }, 'Processing state status retrieved successfully');

      return ResponseUtil.success(
        res,
        result,
        'Processing state status retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving processing state status');
      next(error);
    }
  }

  /**
   * Record new processing state status
   * @route POST /processing-state-status
   */
  async recordProcessingStateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, stateId, substateId, actionDate, notes } = req.body;

      // Validate required fields
      if (!cif || !stateId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, stateId',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const status = await ProcessingStateStatusRepository.createStatus({
        cif,
        agentId: req.user?.agentId,
        stateId,
        substateId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });

      logger.info({ statusId: status.id, cif }, 'Processing state status recorded successfully');

      return ResponseUtil.success(
        res,
        status,
        'Processing state status recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording processing state status');
      next(error);
    }
  }

  /**
   * Get collateral status list by CIF
   * @route GET /collateral-status/:cif
   */
  async getCollateralStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { page = 1, pageSize = 100 } = req.query;

      const result = await CollateralStatusRepository.findByCif(
        cif,
        Number(page),
        Number(pageSize)
      );

      logger.info({ cif, page, pageSize }, 'Collateral status retrieved successfully');

      return ResponseUtil.success(
        res,
        result,
        'Collateral status retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving collateral status');
      next(error);
    }
  }

  /**
   * Record new collateral status
   * @route POST /collateral-status
   */
  async recordCollateralStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, collateralNumber, statusId, actionDate, notes } = req.body;

      // Validate required fields
      if (!cif || !statusId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, statusId',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const status = await CollateralStatusRepository.createStatus({
        cif,
        collateralNumber,
        agentId: req.user?.agentId,
        statusId,
        actionDate: actionDate ? new Date(actionDate) : new Date(),
        notes,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });

      logger.info({ statusId: status.id, cif }, 'Collateral status recorded successfully');

      return ResponseUtil.success(
        res,
        status,
        'Collateral status recorded successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error recording collateral status');
      next(error);
    }
  }

  /**
   * Get customer case data
   * @route GET /customer-case/:cif
   */
  async getCustomerCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;

      // Validate required fields
      if (!cif) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required field: cif',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const customerCase = await CustomerCaseRepository.findOne({ where: { cif } });

      if (!customerCase) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          `Customer case not found for CIF: ${cif}`,
          OperationType.READ,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      logger.info({ cif }, 'Customer case retrieved successfully');

      return ResponseUtil.success(
        res,
        { masterNotes: customerCase.masterNotes },
        'Customer case retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving customer case');
      next(error);
    }
  }

  /**
   * Update master notes for customer case
   * @route PUT /master-notes/:cif
   */
  async updateMasterNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { masterNotes } = req.body;

      // Validate required fields
      if (!cif || masterNotes === undefined) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, masterNotes',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const customerCase = await CustomerCaseRepository.updateMasterNotes(
        cif,
        masterNotes,
        req.user?.username || 'system'
      );

      logger.info({ cif, masterNotes: masterNotes?.length }, 'Master notes updated successfully');

      return ResponseUtil.success(
        res,
        customerCase,
        'Master notes updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating master notes');
      next(error);
    }
  }
}