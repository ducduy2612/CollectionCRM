import { RecoveryAbilityStatus } from '../entities';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { PaginatedResponse } from '../utils/response';

/**
 * Repository for RecoveryAbilityStatus entity
 */
export const RecoveryAbilityStatusRepository = AppDataSource.getRepository(RecoveryAbilityStatus).extend({
  /**
   * Find recovery ability status records by CIF
   * @param cif Customer CIF
   * @param page Page number (default: 1)
   * @param pageSize Page size (default: 10)
   * @returns Paginated result of recovery ability status records
   */
  async findByCif(cif: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<RecoveryAbilityStatus>> {
    try {
      const [records, total] = await this.findAndCount({
        where: { cif },
        relations: ['agent', 'status'],
        order: { actionDate: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      return {
        items: records,
        pagination: {
          page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, page, pageSize, operation: 'findByCif' }
      );
    }
  },

  /**
   * Create a new recovery ability status record
   * @param statusData Recovery ability status data
   * @returns Created recovery ability status record
   */
  async createStatus(statusData: {
    cif: string;
    agentId: string;
    statusId: string;
    actionDate: Date;
    notes?: string;
    createdBy: string;
    updatedBy: string;
  }): Promise<RecoveryAbilityStatus> {
    try {
      const status = this.create({
        ...statusData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return await this.save(status);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { statusData, operation: 'createStatus' }
      );
    }
  }
});