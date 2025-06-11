import { Request, Response, NextFunction } from 'express';
import { CustomerAgentRepository } from '../repositories/customer-agent.repository';
import { AgentRepository } from '../repositories/agent.repository';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Assignment controller
 */
export class AssignmentController {
  /**
   * Get agent assignments
   * @route GET /assignments/agent/:agentId
   */
  async getAgentAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const { agentId } = req.params;
      const { cif, isCurrent, page = 1, pageSize = 10 } = req.query;
      
      // Verify agent exists
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Agent with ID ${agentId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const result = await CustomerAgentRepository.findByAgentId(agentId, {
        cif: cif as string,
        isCurrent: isCurrent === 'true' ? true : isCurrent === 'false' ? false : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          assignments: result.items,
          pagination: result.pagination
        },
        'Agent assignments retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting agent assignments');
      next(error);
    }
  }
  
  /**
   * Create assignment
   * @route POST /assignments
   */
  async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, assignedCallAgentId, assignedFieldAgentId } = req.body;
      
      // Validate required fields
      if (!cif || (!assignedCallAgentId && !assignedFieldAgentId)) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'CIF and at least one agent ID are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Verify call agent exists if provided
      if (assignedCallAgentId) {
        const callAgent = await AgentRepository.findById(assignedCallAgentId);
        
        if (!callAgent) {
          throw Errors.create(
            Errors.Database.RECORD_NOT_FOUND,
            `Call agent with ID ${assignedCallAgentId} not found`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // Verify field agent exists if provided
      if (assignedFieldAgentId) {
        const fieldAgent = await AgentRepository.findById(assignedFieldAgentId);
        
        if (!fieldAgent) {
          throw Errors.create(
            Errors.Database.RECORD_NOT_FOUND,
            `Field agent with ID ${assignedFieldAgentId} not found`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // Create assignment
      const assignment = await CustomerAgentRepository.createAssignment({
        cif,
        assignedCallAgentId,
        assignedFieldAgentId,
        createdBy: req.user?.userId || 'system',
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ assignmentId: assignment.id, cif }, 'Assignment created successfully');
      
      return ResponseUtil.success(
        res,
        assignment,
        'Assignment created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating assignment');
      next(error);
    }
  }
  
  /**
   * Update assignment
   * @route PUT /assignments/:id
   */
  async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { assignedCallAgentId, assignedFieldAgentId } = req.body;
      
      // Validate at least one agent ID is provided
      if (!assignedCallAgentId && !assignedFieldAgentId) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'At least one agent ID is required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Verify call agent exists if provided
      if (assignedCallAgentId) {
        const callAgent = await AgentRepository.findById(assignedCallAgentId);
        
        if (!callAgent) {
          throw Errors.create(
            Errors.Database.RECORD_NOT_FOUND,
            `Call agent with ID ${assignedCallAgentId} not found`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // Verify field agent exists if provided
      if (assignedFieldAgentId) {
        const fieldAgent = await AgentRepository.findById(assignedFieldAgentId);
        
        if (!fieldAgent) {
          throw Errors.create(
            Errors.Database.RECORD_NOT_FOUND,
            `Field agent with ID ${assignedFieldAgentId} not found`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // Update assignment
      const assignment = await CustomerAgentRepository.updateAssignment(id, {
        assignedCallAgentId,
        assignedFieldAgentId,
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ assignmentId: id }, 'Assignment updated successfully');
      
      return ResponseUtil.success(
        res,
        assignment,
        'Assignment updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating assignment');
      next(error);
    }
  }
  
  /**
   * Get assignment history
   * @route GET /assignments/history/:cif
   */
  async getAssignmentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const history = await CustomerAgentRepository.findHistoryByCif(cif);
      
      return ResponseUtil.success(
        res,
        { history },
        'Assignment history retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting assignment history');
      next(error);
    }
  }

  /**
   * Bulk assignment from CSV file
   * @route POST /assignments/bulk
   */
  async bulkAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'CSV file is required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const csvData: any[] = [];
      const errors: string[] = [];
      let lineNumber = 1; // Start from 1 to account for header

      // Parse CSV data
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(req.file!.buffer.toString());
        
        stream
          .pipe(csv({
            mapHeaders: ({ header }) => header.trim().toLowerCase()
          }))
          .on('data', (row) => {
            lineNumber++;
            
            // Validate required columns
            const cif = row.cif?.trim();
            const assignedCallAgentName = row.assignedcallagentname?.trim();
            const assignedFieldAgentName = row.assignedfieldagentname?.trim();

            if (!cif) {
              errors.push(`Line ${lineNumber}: CIF is required`);
              return;
            }

            if (!assignedCallAgentName && !assignedFieldAgentName) {
              errors.push(`Line ${lineNumber}: At least one agent name is required`);
              return;
            }

            csvData.push({
              cif,
              assignedCallAgentName,
              assignedFieldAgentName,
              lineNumber
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });

      if (errors.length > 0) {
        throw Errors.create(
          Errors.Validation.INVALID_FORMAT,
          `CSV validation errors: ${errors.join(', ')}`,
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      if (csvData.length === 0) {
        throw Errors.create(
          Errors.Validation.INVALID_FORMAT,
          'No valid data found in CSV file',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Process assignments
      const assignments = [];
      const processingErrors: string[] = [];

      for (const row of csvData) {
        try {
          let assignedCallAgentId = null;
          let assignedFieldAgentId = null;

          // Look up call agent by name if provided
          if (row.assignedCallAgentName) {
            const callAgent = await AgentRepository.findByName(row.assignedCallAgentName);
            if (!callAgent) {
              processingErrors.push(`Line ${row.lineNumber}: Call agent '${row.assignedCallAgentName}' not found`);
              continue;
            }
            assignedCallAgentId = callAgent.id;
          }

          // Look up field agent by name if provided
          if (row.assignedFieldAgentName) {
            const fieldAgent = await AgentRepository.findByName(row.assignedFieldAgentName);
            if (!fieldAgent) {
              processingErrors.push(`Line ${row.lineNumber}: Field agent '${row.assignedFieldAgentName}' not found`);
              continue;
            }
            assignedFieldAgentId = fieldAgent.id;
          }

          assignments.push({
            cif: row.cif,
            assignedCallAgentId,
            assignedFieldAgentId,
            createdBy: req.user?.userId || 'system',
            updatedBy: req.user?.userId || 'system'
          });
        } catch (error) {
          processingErrors.push(`Line ${row.lineNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (processingErrors.length > 0) {
        throw Errors.create(
          Errors.Validation.INVALID_FORMAT,
          `Processing errors: ${processingErrors.join(', ')}`,
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Create bulk assignments
      const createdAssignments = await CustomerAgentRepository.createBulkAssignments(assignments);

      logger.info({
        count: createdAssignments.length,
        userId: req.user?.userId
      }, 'Bulk assignments created successfully');

      return ResponseUtil.success(
        res,
        {
          assignments: createdAssignments,
          count: createdAssignments.length,
          processed: csvData.length
        },
        'Bulk assignments created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating bulk assignments');
      next(error);
    }
  }
}