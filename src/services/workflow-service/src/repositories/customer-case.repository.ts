import { CustomerCase } from '../entities/customer-case.entity';
import { CustomerCaseAction } from '../entities/customer-case-action.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for customer case actions
 */
export interface CustomerCaseActionSearchCriteria {
  cif?: string;
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for CustomerCase entity
 */
export const CustomerCaseRepository = AppDataSource.getRepository(CustomerCase).extend({
  /**
   * Find a customer case by CIF
   * @param cif Customer CIF
   * @returns The customer case if found, undefined otherwise
   */
  async findByCif(cif: string): Promise<CustomerCase | null> {
    try {
      return await this.createQueryBuilder('case')
        .leftJoinAndSelect('case.assignedCallAgent', 'callAgent')
        .leftJoinAndSelect('case.assignedFieldAgent', 'fieldAgent')
        .where('case.cif = :cif', { cif })
        .getOne();
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, operation: 'findByCif' }
      );
    }
  },

  /**
   * Get customer case status by CIF
   * @param cif Customer CIF
   * @returns The customer case status with additional information
   */
  async getCustomerCaseStatus(cif: string): Promise<any> {
    try {
      // Get the customer case
      const customerCase = await this.findByCif(cif);
      
      if (!customerCase) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Customer case with CIF ${cif} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Get the latest action record
      const latestAction = await AppDataSource.getRepository(CustomerCaseAction)
        .createQueryBuilder('action')
        .where('action.cif = :cif', { cif })
        .orderBy('action.actionDate', 'DESC')
        .getOne();
      
      // Return combined status
      return {
        cif: customerCase.cif,
        assignedCallAgentId: customerCase.assignedCallAgentId,
        assignedCallAgentName: customerCase.assignedCallAgent?.name,
        assignedFieldAgentId: customerCase.assignedFieldAgentId,
        assignedFieldAgentName: customerCase.assignedFieldAgent?.name,
        lastUpdate: customerCase.fUpdate,
        customerStatus: customerCase.customerStatus,
        collateralStatus: customerCase.collateralStatus,
        processingStateStatus: customerCase.processingStateStatus,
        lendingViolationStatus: customerCase.lendingViolationStatus,
        recoveryAbilityStatus: customerCase.recoveryAbilityStatus,
        lastActionDate: latestAction?.actionDate,
        lastActionType: latestAction?.type,
        lastActionResult: latestAction?.actionResult
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, operation: 'getCustomerCaseStatus' }
      );
    }
  },

  /**
   * Create or update a customer case
   * @param caseData Customer case data
   * @returns The created or updated customer case
   */
  async createOrUpdateCase(caseData: Partial<CustomerCase>): Promise<CustomerCase> {
    try {
      // Check if case exists
      const existingCase = await this.findByCif(caseData.cif);
      
      if (existingCase) {
        // Update existing case
        Object.assign(existingCase, caseData);
        existingCase.fUpdate = new Date();
        return await this.save(existingCase);
      } else {
        // Create new case
        const newCase = this.create({
          ...caseData,
          fUpdate: new Date()
        });
        return await this.save(newCase);
      }
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { caseData, operation: 'createOrUpdateCase' }
      );
    }
  }
});

/**
 * Repository for CustomerCaseAction entity
 */
export const CustomerCaseActionRepository = AppDataSource.getRepository(CustomerCaseAction).extend({
  /**
   * Find a customer case action by ID
   * @param id Action ID
   * @returns The customer case action if found, undefined otherwise
   */
  async findById(id: string): Promise<CustomerCaseAction | null> {
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
   * Find customer case actions by CIF
   * @param cif Customer CIF
   * @param criteria Search criteria
   * @returns Paginated result of customer case actions
   */
  async findByCif(cif: string, criteria: Omit<CustomerCaseActionSearchCriteria, 'cif'>): Promise<PaginatedResponse<CustomerCaseAction>> {
    try {
      // Ensure we're using the correct repository and entity
      const queryBuilder = this.createQueryBuilder('action')
        .leftJoinAndSelect('action.agent', 'agent')
        .where('action.cif = :cif', { cif });
      
      // Apply filters
      if (criteria.agentId) {
        queryBuilder.andWhere('action.agent_id = :agentId', { agentId: criteria.agentId });
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
      
      // Fix the orderBy clause - use the actual column name instead of the property name
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('action.actionDate', 'DESC'); // Changed from 'action.action_date' to 'action.actionDate'
      
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
   * Create a new customer case action
   * @param action Customer case action data
   * @returns The created customer case action
   */
  async createCaseAction(action: Partial<CustomerCaseAction>): Promise<CustomerCaseAction> {
    try {
      // Start a transaction
      return await AppDataSource.transaction(async (transactionalEntityManager: any) => {
        // Create new case action
        const newAction = transactionalEntityManager.create(CustomerCaseAction, action);
        const savedAction = await transactionalEntityManager.save(CustomerCaseAction, newAction);
        
        // Update customer case with the latest status
        const customerCaseRepo = transactionalEntityManager.getRepository(CustomerCase);
        const existingCase = await customerCaseRepo.findOneBy({ cif: action.cif });
        
        const caseData: Partial<CustomerCase> = {
          cif: action.cif,
          fUpdate: action.actionDate || new Date(),
          assignedCallAgentId: existingCase?.assignedCallAgentId,
          assignedFieldAgentId: existingCase?.assignedFieldAgentId
        };
        
        // Only update statuses that are provided
        if (action.customerStatus) {
          caseData.customerStatus = action.customerStatus;
        }
        
        if (action.collateralStatus) {
          caseData.collateralStatus = action.collateralStatus;
        }
        
        if (action.processingStateStatus) {
          caseData.processingStateStatus = action.processingStateStatus;
        }
        
        if (action.lendingViolationStatus) {
          caseData.lendingViolationStatus = action.lendingViolationStatus;
        }
        
        if (action.recoveryAbilityStatus) {
          caseData.recoveryAbilityStatus = action.recoveryAbilityStatus;
        }
        
        if (existingCase) {
          // Update existing case
          Object.assign(existingCase, caseData);
          await transactionalEntityManager.save(CustomerCase, existingCase);
        } else {
          // Create new case
          const newCase = transactionalEntityManager.create(CustomerCase, caseData);
          await transactionalEntityManager.save(CustomerCase, newCase);
        }
        
        return savedAction;
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { action, operation: 'createCaseAction' }
      );
    }
  }
});