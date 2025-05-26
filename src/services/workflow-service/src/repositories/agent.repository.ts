import { Agent, AgentType } from '../entities/agent.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for agents
 */
export interface AgentSearchCriteria {
  type?: AgentType;
  team?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for Agent entity
 */
export const AgentRepository = AppDataSource.getRepository(Agent).extend({
  /**
   * Find an agent by ID
   * @param id Agent ID
   * @returns The agent if found, undefined otherwise
   */
  async findById(id: string): Promise<Agent | null> {
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
   * Find an agent by employee ID
   * @param employeeId Employee ID
   * @returns The agent if found, undefined otherwise
   */
  async findByEmployeeId(employeeId: string): Promise<Agent | null> {
    try {
      return await this.findOneBy({ employeeId });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { employeeId, operation: 'findByEmployeeId' }
      );
    }
  },

  /**
   * Find an agent by user ID
   * @param userId User ID
   * @returns The agent if found, undefined otherwise
   */
  async findByUserId(userId: string): Promise<Agent | null> {
    try {
      return await this.findOneBy({ userId });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { userId, operation: 'findByUserId' }
      );
    }
  },

  /**
   * Search agents based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of agents
   */
  async searchAgents(criteria: AgentSearchCriteria): Promise<PaginatedResponse<Agent>> {
    try {
      const queryBuilder = this.createQueryBuilder('agent');
      
      // Apply filters
      if (criteria.type) {
        queryBuilder.andWhere('agent.type = :type', { type: criteria.type });
      }
      
      if (criteria.team) {
        queryBuilder.andWhere('agent.team = :team', { team: criteria.team });
      }
      
      if (criteria.isActive !== undefined) {
        queryBuilder.andWhere('agent.is_active = :isActive', { isActive: criteria.isActive });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('agent.name', 'ASC');
      
      // Get paginated results
      const agents = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(agents, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchAgents' }
      );
    }
  },

  /**
   * Create a new agent
   * @param agent Agent data
   * @returns The created agent
   */
  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    try {
      const newAgent = this.create(agent);
      return await this.save(newAgent);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { agent, operation: 'createAgent' }
      );
    }
  },

  /**
   * Update an existing agent
   * @param id Agent ID
   * @param agentData Updated agent data
   * @returns The updated agent
   */
  async updateAgent(id: string, agentData: Partial<Agent>): Promise<Agent> {
    try {
      const agent = await this.findById(id);
      
      if (!agent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Agent with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Update agent properties
      Object.assign(agent, agentData);
      
      return await this.save(agent);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, agentData, operation: 'updateAgent' }
      );
    }
  },

  /**
   * Link an agent to a user
   * @param agentId Agent ID
   * @param userId User ID
   * @returns The updated agent
   */
  async linkAgentToUser(agentId: string, userId: string): Promise<Agent> {
    try {
      const agent = await this.findById(agentId);
      
      if (!agent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Agent with ID ${agentId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Check if another agent is already linked to this user
      const existingAgent = await this.findByUserId(userId);
      
      if (existingAgent && existingAgent.id !== agentId) {
        throw Errors.create(
          Errors.Database.DUPLICATE_RECORD,
          `User with ID ${userId} is already linked to another agent`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Link agent to user
      agent.userId = userId;
      
      return await this.save(agent);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { agentId, userId, operation: 'linkAgentToUser' }
      );
    }
  }
});