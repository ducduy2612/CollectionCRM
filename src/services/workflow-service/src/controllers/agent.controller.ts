import { Request, Response, NextFunction } from 'express';
import { AgentRepository } from '../repositories/agent.repository';
import { Agent, AgentType } from '../entities/agent.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Agent controller
 */
export class AgentController {
  /**
   * Get all agents with optional filtering
   * @route GET /agents
   */
  async getAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, team, isActive, page = 1, pageSize = 10 } = req.query;
      
      const result = await AgentRepository.searchAgents({
        type: type as AgentType,
        team: team as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          agents: result.items,
          pagination: result.pagination
        },
        'Agents retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting agents');
      next(error);
    }
  }
  
  /**
   * Create a new agent
   * @route POST /agents
   */
  async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, name, email, phone, type, team } = req.body;
      
      // Validate required fields
      if (!employeeId || !name || !email || !type || !team) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Check if agent with same employee ID or email already exists
      const existingAgentByEmployeeId = await AgentRepository.findByEmployeeId(employeeId);
      if (existingAgentByEmployeeId) {
        throw Errors.create(
          Errors.Database.DUPLICATE_RECORD,
          `Agent with employee ID ${employeeId} already exists`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create agent
      const agent = await AgentRepository.createAgent({
        employeeId,
        name,
        email,
        phone,
        type,
        team,
        isActive: true,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ agentId: agent.id }, 'Agent created successfully');
      
      return ResponseUtil.success(
        res,
        agent,
        'Agent created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating agent');
      next(error);
    }
  }
  
  /**
   * Update an existing agent
   * @route PUT /agents/:id
   */
  async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, phone, type, team, isActive } = req.body;
      
      // Find agent
      const agent = await AgentRepository.findById(id);
      
      if (!agent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Agent with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Update agent
      const updatedAgent = await AgentRepository.updateAgent(id, {
        name,
        email,
        phone,
        type,
        team,
        isActive,
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ agentId: id }, 'Agent updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedAgent,
        'Agent updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating agent');
      next(error);
    }
  }
  
  /**
   * Get agent performance metrics
   * @route GET /agents/:id/performance
   */
  async getAgentPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      // Find agent
      const agent = await AgentRepository.findById(id);
      
      if (!agent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Agent with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // TODO: Implement actual performance metrics calculation
      // For now, return mock data
      const performanceData = {
        agentId: agent.id,
        agentName: agent.name,
        period: {
          startDate: startDate || '2025-01-01',
          endDate: endDate || '2025-01-31'
        },
        metrics: {
          totalActions: 120,
          successfulActions: 95,
          callsPlaced: 80,
          callsConnected: 65,
          visitsCompleted: 40,
          paymentsCollected: 30,
          totalAmountCollected: 150000.00,
          averageCallDuration: 180,
          successRate: 79.17
        },
        trends: {
          daily: [
            {
              date: '2025-01-01',
              actions: 4,
              amountCollected: 5000.00
            }
          ],
          weekly: [
            {
              week: '2025-W01',
              actions: 28,
              amountCollected: 35000.00
            }
          ]
        }
      };
      
      return ResponseUtil.success(
        res,
        performanceData,
        'Agent performance retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting agent performance');
      next(error);
    }
  }
  
  /**
   * Get agent by user ID
   * @route GET /agents/by-user/:userId
   */
  async getAgentByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      const agent = await AgentRepository.findByUserId(userId);
      
      if (!agent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Agent with user ID ${userId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        agent,
        'Agent retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting agent by user ID');
      next(error);
    }
  }
  
  /**
   * Link agent to user
   * @route POST /agents/link-user
   */
  async linkAgentToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId, userId } = req.body;
      
      if (!agentId || !userId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Agent ID and User ID are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const agent = await AgentRepository.linkAgentToUser(agentId, userId);
      
      logger.info({ agentId, userId }, 'Agent linked to user successfully');
      
      return ResponseUtil.success(
        res,
        agent,
        'Agent linked to user successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error linking agent to user');
      next(error);
    }
  }
}