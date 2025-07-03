import { DocumentAccessLog } from '../entities/document-access-log.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for document access logs
 */
export interface DocumentAccessLogSearchCriteria {
  documentId?: string;
  agentId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for DocumentAccessLog entity
 */
export const DocumentAccessLogRepository = AppDataSource.getRepository(DocumentAccessLog).extend({
  /**
   * Find access logs by document ID
   * @param documentId Document ID
   * @returns Array of access logs
   */
  async findByDocumentId(documentId: string): Promise<DocumentAccessLog[]> {
    try {
      return await this.find({
        where: { documentId },
        relations: ['agent'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { documentId, operation: 'findByDocumentId' }
      );
    }
  },

  /**
   * Find access logs by agent ID
   * @param agentId Agent ID
   * @returns Array of access logs
   */
  async findByAgentId(agentId: string): Promise<DocumentAccessLog[]> {
    try {
      return await this.find({
        where: { agentId },
        relations: ['document', 'agent'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { agentId, operation: 'findByAgentId' }
      );
    }
  },

  /**
   * Search access logs based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of access logs
   */
  async searchAccessLogs(criteria: DocumentAccessLogSearchCriteria): Promise<PaginatedResponse<DocumentAccessLog>> {
    try {
      const queryBuilder = this.createQueryBuilder('log')
        .leftJoinAndSelect('log.document', 'document')
        .leftJoinAndSelect('log.agent', 'agent');

      // Apply filters
      if (criteria.documentId) {
        queryBuilder.andWhere('log.documentId = :documentId', { documentId: criteria.documentId });
      }

      if (criteria.agentId) {
        queryBuilder.andWhere('log.agentId = :agentId', { agentId: criteria.agentId });
      }

      if (criteria.action) {
        queryBuilder.andWhere('log.action = :action', { action: criteria.action });
      }

      if (criteria.startDate) {
        queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: criteria.startDate });
      }

      if (criteria.endDate) {
        queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: criteria.endDate });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;

      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('log.createdAt', 'DESC');

      // Get paginated results
      const logs = await queryBuilder.getMany();

      return ResponseUtil.paginate(logs, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchAccessLogs' }
      );
    }
  },

  /**
   * Create a new access log entry
   * @param log Access log data
   * @returns The created access log
   */
  async createAccessLog(log: Partial<DocumentAccessLog>): Promise<DocumentAccessLog> {
    try {
      const newLog = this.create(log);
      return await this.save(newLog);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { log, operation: 'createAccessLog' }
      );
    }
  },

  /**
   * Get access statistics for a document
   * @param documentId Document ID
   * @returns Access statistics
   */
  async getDocumentAccessStats(documentId: string): Promise<{
    totalAccesses: number;
    uniqueAgents: number;
    lastAccessed: Date | null;
    accessByAction: { action: string; count: number }[];
  }> {
    try {
      const basicStats = await this.createQueryBuilder('log')
        .select([
          'COUNT(*) as totalAccesses',
          'COUNT(DISTINCT log.agentId) as uniqueAgents',
          'MAX(log.createdAt) as lastAccessed'
        ])
        .where('log.documentId = :documentId', { documentId })
        .getRawOne();

      const actionStats = await this.createQueryBuilder('log')
        .select([
          'log.action as action',
          'COUNT(*) as count'
        ])
        .where('log.documentId = :documentId', { documentId })
        .groupBy('log.action')
        .getRawMany();

      return {
        totalAccesses: parseInt(basicStats.totalAccesses),
        uniqueAgents: parseInt(basicStats.uniqueAgents),
        lastAccessed: basicStats.lastAccessed ? new Date(basicStats.lastAccessed) : null,
        accessByAction: actionStats.map(stat => ({
          action: stat.action,
          count: parseInt(stat.count)
        }))
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { documentId, operation: 'getDocumentAccessStats' }
      );
    }
  },

  /**
   * Get agent activity statistics
   * @param agentId Agent ID
   * @param startDate Start date (optional)
   * @param endDate End date (optional)
   * @returns Agent activity statistics
   */
  async getAgentActivityStats(
    agentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActions: number;
    documentsAccessed: number;
    actionsByType: { action: string; count: number }[];
  }> {
    try {
      const queryBuilder = this.createQueryBuilder('log')
        .where('log.agentId = :agentId', { agentId });

      if (startDate) {
        queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
      }

      const basicStats = await queryBuilder
        .select([
          'COUNT(*) as totalActions',
          'COUNT(DISTINCT log.documentId) as documentsAccessed'
        ])
        .getRawOne();

      const actionStats = await queryBuilder
        .select([
          'log.action as action',
          'COUNT(*) as count'
        ])
        .groupBy('log.action')
        .getRawMany();

      return {
        totalActions: parseInt(basicStats.totalActions),
        documentsAccessed: parseInt(basicStats.documentsAccessed),
        actionsByType: actionStats.map(stat => ({
          action: stat.action,
          count: parseInt(stat.count)
        }))
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { agentId, startDate, endDate, operation: 'getAgentActivityStats' }
      );
    }
  }
});