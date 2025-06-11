import { CustomerAgent } from '../entities/customer-agent.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for customer agents
 */
export interface CustomerAgentSearchCriteria {
  cif?: string;
  assignedCallAgentId?: string;
  assignedFieldAgentId?: string;
  isCurrent?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for CustomerAgent entity
 */
export const CustomerAgentRepository = AppDataSource.getRepository(CustomerAgent).extend({
  /**
   * Find a customer agent assignment by ID
   * @param id Assignment ID
   * @returns The assignment if found, undefined otherwise
   */
  async findById(id: string): Promise<CustomerAgent | null> {
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
   * Find current customer agent assignment by CIF
   * @param cif Customer CIF
   * @returns The current assignment if found, undefined otherwise
   */
  async findCurrentByCif(cif: string): Promise<CustomerAgent | null> {
    try {
      return await this.findOneBy({ cif, isCurrent: true });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, operation: 'findCurrentByCif' }
      );
    }
  },

  /**
   * Find customer agent assignments by agent ID
   * @param agentId Agent ID
   * @param criteria Search criteria
   * @returns Paginated result of assignments
   */
  async findByAgentId(agentId: string, criteria: Omit<CustomerAgentSearchCriteria, 'assignedCallAgentId' | 'assignedFieldAgentId'>): Promise<PaginatedResponse<CustomerAgent>> {
    try {
      const queryBuilder = this.createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.assignedCallAgent', 'callAgent')
        .leftJoinAndSelect('assignment.assignedFieldAgent', 'fieldAgent')
        .where('assignment.assigned_call_agent_id = :agentId OR assignment.assigned_field_agent_id = :agentId', { agentId });
      
      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('assignment.cif = :cif', { cif: criteria.cif });
      }
      
      if (criteria.isCurrent !== undefined) {
        queryBuilder.andWhere('assignment.is_current = :isCurrent', { isCurrent: criteria.isCurrent });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('assignment.startDate', 'DESC');
      
      // Get paginated results
      const assignments = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(assignments, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { agentId, criteria, operation: 'findByAgentId' }
      );
    }
  },

  /**
   * Find customer agent assignment history by CIF
   * @param cif Customer CIF
   * @returns Array of assignments
   */
  async findHistoryByCif(cif: string): Promise<CustomerAgent[]> {
    try {
      return await this.createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.assignedCallAgent', 'callAgent')
        .leftJoinAndSelect('assignment.assignedFieldAgent', 'fieldAgent')
        .where('assignment.cif = :cif', { cif })
        .orderBy('assignment.startDate', 'DESC')
        .getMany();
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, operation: 'findHistoryByCif' }
      );
    }
  },

  /**
   * Create a new customer agent assignment
   * @param assignment Assignment data
   * @returns The created assignment
   */
  async createAssignment(assignment: Partial<CustomerAgent>): Promise<CustomerAgent> {
    try {
      // Start a transaction
      return await AppDataSource.transaction(async (transactionalEntityManager: any) => {
        // Find current assignment if exists
        const currentAssignment = await transactionalEntityManager.findOneBy(CustomerAgent, {
          cif: assignment.cif,
          isCurrent: true
        });
        
        // If there's a current assignment, mark it as not current
        if (currentAssignment) {
          currentAssignment.isCurrent = false;
          currentAssignment.endDate = new Date();
          await transactionalEntityManager.save(CustomerAgent, currentAssignment);
        }
        
        // Create new assignment
        const newAssignment = transactionalEntityManager.create(CustomerAgent, {
          ...assignment,
          startDate: new Date(),
          isCurrent: true
        });
        
        return await transactionalEntityManager.save(CustomerAgent, newAssignment);
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { assignment, operation: 'createAssignment' }
      );
    }
  },

  /**
   * Update an existing customer agent assignment
   * @param id Assignment ID
   * @param assignmentData Updated assignment data
   * @returns The updated assignment
   */
  async updateAssignment(id: string, assignmentData: Partial<CustomerAgent>): Promise<CustomerAgent> {
    try {
      const assignment = await this.findById(id);
      
      if (!assignment) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Assignment with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Only allow updating agent IDs
      if (assignmentData.assignedCallAgentId !== undefined) {
        assignment.assignedCallAgentId = assignmentData.assignedCallAgentId;
      }
      
      if (assignmentData.assignedFieldAgentId !== undefined) {
        assignment.assignedFieldAgentId = assignmentData.assignedFieldAgentId;
      }
      
      return await this.save(assignment);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, assignmentData, operation: 'updateAssignment' }
      );
    }
  },

  /**
   * Create multiple customer agent assignments in bulk
   * @param assignments Array of assignment data
   * @returns Array of created assignments
   */
  async createBulkAssignments(assignments: Partial<CustomerAgent>[]): Promise<CustomerAgent[]> {
    try {
      // Start a transaction
      return await AppDataSource.transaction(async (transactionalEntityManager: any) => {
        const createdAssignments: CustomerAgent[] = [];
        
        for (const assignment of assignments) {
          // Find current assignment if exists
          const currentAssignment = await transactionalEntityManager.findOneBy(CustomerAgent, {
            cif: assignment.cif,
            isCurrent: true
          });
          
          // If there's a current assignment, mark it as not current
          if (currentAssignment) {
            currentAssignment.isCurrent = false;
            currentAssignment.endDate = new Date();
            await transactionalEntityManager.save(CustomerAgent, currentAssignment);
          }
          
          // Create new assignment
          const newAssignment = transactionalEntityManager.create(CustomerAgent, {
            ...assignment,
            startDate: new Date(),
            isCurrent: true
          });
          
          const savedAssignment = await transactionalEntityManager.save(CustomerAgent, newAssignment);
          createdAssignments.push(savedAssignment);
        }
        
        return createdAssignments;
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { assignments, operation: 'createBulkAssignments' }
      );
    }
  }
});