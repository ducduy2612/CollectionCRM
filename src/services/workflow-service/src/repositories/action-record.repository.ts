import { ActionRecord, ActionType, ActionResult } from '../entities/action-record.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for action records
 */
export interface ActionRecordSearchCriteria {
  cif?: string;
  loanAccountNumber?: string;
  agentId?: string;
  type?: ActionType;
  actionResult?: ActionResult;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for ActionRecord entity
 */
export const ActionRecordRepository = AppDataSource.getRepository(ActionRecord).extend({
  /**
   * Find an action record by ID
   * @param id Action record ID
   * @returns The action record if found, undefined otherwise
   */
  async findById(id: string): Promise<ActionRecord | null> {
    try {
      return await this.findOneBy({ id });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'findById' }
      );
    }
  },

  /**
   * Find action records by customer CIF
   * @param cif Customer CIF
   * @param criteria Search criteria
   * @returns Paginated result of action records
   */
  async findByCif(cif: string, criteria: Omit<ActionRecordSearchCriteria, 'cif'>): Promise<PaginatedResponse<ActionRecord>> {
    try {
      const queryBuilder = this.createQueryBuilder('action')
        .leftJoinAndSelect('action.agent', 'agent')
        .where('action.cif = :cif', { cif });
      
      // Apply filters
      if (criteria.loanAccountNumber) {
        queryBuilder.andWhere('action.loan_account_number = :loanAccountNumber', { loanAccountNumber: criteria.loanAccountNumber });
      }
      
      if (criteria.agentId) {
        queryBuilder.andWhere('action.agent_id = :agentId', { agentId: criteria.agentId });
      }
      
      if (criteria.type) {
        queryBuilder.andWhere('action.type = :type', { type: criteria.type });
      }
      
      if (criteria.actionResult) {
        queryBuilder.andWhere('action.action_result = :actionResult', { actionResult: criteria.actionResult });
      }
      
      if (criteria.startDate) {
        queryBuilder.andWhere('action.action_date >= :startDate', { startDate: criteria.startDate });
      }
      
      if (criteria.endDate) {
        queryBuilder.andWhere('action.action_date <= :endDate', { endDate: criteria.endDate });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('action.action_date', 'DESC');
      
      // Get paginated results
      const actions = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(actions, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, criteria, operation: 'findByCif' }
      );
    }
  },

  /**
   * Find action records by loan account number
   * @param loanAccountNumber Loan account number
   * @param criteria Search criteria
   * @returns Paginated result of action records
   */
  async findByLoanAccountNumber(loanAccountNumber: string, criteria: Omit<ActionRecordSearchCriteria, 'loanAccountNumber'>): Promise<PaginatedResponse<ActionRecord>> {
    try {
      const queryBuilder = this.createQueryBuilder('action')
        .leftJoinAndSelect('action.agent', 'agent')
        .where('action.loan_account_number = :loanAccountNumber', { loanAccountNumber });
      
      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('action.cif = :cif', { cif: criteria.cif });
      }
      
      if (criteria.agentId) {
        queryBuilder.andWhere('action.agent_id = :agentId', { agentId: criteria.agentId });
      }
      
      if (criteria.type) {
        queryBuilder.andWhere('action.type = :type', { type: criteria.type });
      }
      
      if (criteria.actionResult) {
        queryBuilder.andWhere('action.action_result = :actionResult', { actionResult: criteria.actionResult });
      }
      
      if (criteria.startDate) {
        queryBuilder.andWhere('action.action_date >= :startDate', { startDate: criteria.startDate });
      }
      
      if (criteria.endDate) {
        queryBuilder.andWhere('action.action_date <= :endDate', { endDate: criteria.endDate });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('action.action_date', 'DESC');
      
      // Get paginated results
      const actions = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(actions, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { loanAccountNumber, criteria, operation: 'findByLoanAccountNumber' }
      );
    }
  },

  /**
   * Create a new action record
   * @param action Action record data
   * @returns The created action record
   */
  async createAction(action: Partial<ActionRecord>): Promise<ActionRecord> {
    try {
      const newAction = this.create(action);
      return await this.save(newAction);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { action, operation: 'createAction' }
      );
    }
  },

  /**
   * Update an action record's result
   * @param id Action record ID
   * @param actionResult New action result
   * @param notes Updated notes
   * @param updatedBy User who updated the record
   * @returns The updated action record
   */
  async updateActionResult(id: string, actionResult: ActionResult, notes: string | null, updatedBy: string): Promise<ActionRecord> {
    try {
      const action = await this.findById(id);
      
      if (!action) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Action record with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Update action properties
      action.actionResult = actionResult;
      
      if (notes) {
        action.notes = notes;
      }
      
      action.updatedBy = updatedBy;
      
      return await this.save(action);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, actionResult, notes, updatedBy, operation: 'updateActionResult' }
      );
    }
  }
});