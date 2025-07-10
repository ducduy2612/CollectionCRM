import { Repository, FindOptionsWhere, Between, LessThan } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { AuditLog } from '../entities/audit-log.entity';
import { logger } from '../utils/logger';

export interface AuditLogFilters {
  userId?: string;
  agentId?: string;
  entityType?: string;
  entityId?: string;
  eventType?: string;
  serviceName?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class AuditLogRepository {
  private repository: Repository<AuditLog>;

  constructor() {
    this.repository = AppDataSource.getRepository(AuditLog);
  }

  /**
   * Create a new audit log entry
   */
  async create(auditLogData: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.repository.create(auditLogData);
    return await this.repository.save(auditLog);
  }

  /**
   * Create multiple audit log entries in batch
   */
  async createBatch(auditLogData: Partial<AuditLog>[]): Promise<AuditLog[]> {
    const auditLogs = this.repository.create(auditLogData);
    return await this.repository.save(auditLogs);
  }

  /**
   * Find audit logs with filters and pagination
   */
  async findWithFilters(
    filters: AuditLogFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ logs: AuditLog[], total: number }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = pagination;

    const where: FindOptionsWhere<AuditLog> = {};

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.serviceName) where.serviceName = filters.serviceName;
    if (filters.action) where.action = filters.action;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;

    // Date range filter
    if (filters.startDate && filters.endDate) {
      where.timestamp = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.timestamp = Between(filters.startDate, new Date());
    } else if (filters.endDate) {
      where.timestamp = LessThan(filters.endDate);
    }

    const [logs, total] = await this.repository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    });

    return { logs, total };
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    return await this.repository.findOne({ where: { id } });
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  /**
   * Find audit logs by entity
   */
  async findByEntity(entityType: string, entityId: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.repository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters: AuditLogFilters = {}): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByEventType: Record<string, number>;
    logsByService: Record<string, number>;
  }> {
    const where: FindOptionsWhere<AuditLog> = {};

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.startDate && filters.endDate) {
      where.timestamp = Between(filters.startDate, filters.endDate);
    }

    const totalLogs = await this.repository.count({ where });

    // Get logs by action
    const logsByActionQuery = await this.repository
      .createQueryBuilder('audit_log')
      .select('audit_log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('audit_log.action')
      .getRawMany();

    const logsByAction = logsByActionQuery.reduce((acc, row) => {
      acc[row.action] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get logs by event type
    const logsByEventTypeQuery = await this.repository
      .createQueryBuilder('audit_log')
      .select('audit_log.event_type', 'event_type')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('audit_log.event_type')
      .getRawMany();

    const logsByEventType = logsByEventTypeQuery.reduce((acc, row) => {
      acc[row.event_type] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get logs by service
    const logsByServiceQuery = await this.repository
      .createQueryBuilder('audit_log')
      .select('audit_log.service_name', 'service_name')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('audit_log.service_name')
      .getRawMany();

    const logsByService = logsByServiceQuery.reduce((acc, row) => {
      acc[row.service_name] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      logsByAction,
      logsByEventType,
      logsByService
    };
  }

  /**
   * Delete old audit logs based on retention policy
   */
  async deleteOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.repository.delete({
      createdAt: LessThan(cutoffDate)
    });

    logger.info({
      message: 'Deleted old audit logs',
      deletedCount: result.affected,
      cutoffDate: cutoffDate.toISOString()
    });

    return result.affected || 0;
  }
}