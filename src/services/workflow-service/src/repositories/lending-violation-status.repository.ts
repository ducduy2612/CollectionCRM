import { LendingViolationStatus } from '../entities';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { PaginatedResponse } from '../utils/response';

/**
 * Repository for LendingViolationStatus entity
 */
export const LendingViolationStatusRepository = AppDataSource.getRepository(LendingViolationStatus).extend({
  /**
   * Find lending violation status records by CIF
   * @param cif Customer CIF
   * @param page Page number (default: 1)
   * @param pageSize Page size (default: 10)
   * @returns Paginated result of lending violation status records
   */
  async findByCif(cif: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<LendingViolationStatus>> {
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
   * Create a new lending violation status record
   * @param statusData Lending violation status data
   * @returns Created lending violation status record
   */
  async createStatus(statusData: {
    cif: string;
    agentId: string;
    statusId: string;
    actionDate: Date;
    notes?: string;
    createdBy: string;
    updatedBy: string;
  }): Promise<LendingViolationStatus> {
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