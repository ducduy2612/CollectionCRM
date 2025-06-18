import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { FudAutoConfig, FudCalculationType } from '../entities/fud-auto-config.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';

export interface CreateFudConfigDto {
  action_result_id: string;
  calculation_type: FudCalculationType;
  days_offset: number;
  is_active?: boolean;
  priority?: number;
  createdBy: string;
}

export interface UpdateFudConfigDto {
  calculation_type?: FudCalculationType;
  days_offset?: number;
  is_active?: boolean;
  priority?: number;
  updatedBy: string;
}

export interface FudCalculationParams {
  action_result_id: string;
  action_date: Date;
  promise_date?: Date;
}

export class FudAutoConfigRepository {
  private repository: Repository<FudAutoConfig>;

  constructor() {
    this.repository = AppDataSource.getRepository(FudAutoConfig);
  }

  async findAll(includeInactive = false): Promise<FudAutoConfig[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.action_result', 'action_result')
      .orderBy('config.priority', 'DESC')
      .addOrderBy('action_result.name', 'ASC');

    if (!includeInactive) {
      queryBuilder.where('config.is_active = :isActive', { isActive: true });
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<FudAutoConfig | null> {
    return this.repository
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.action_result', 'action_result')
      .where('config.id = :id', { id })
      .getOne();
  }

  async findByActionResultId(actionResultId: string): Promise<FudAutoConfig | null> {
    return this.repository
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.action_result', 'action_result')
      .where('config.action_result_id = :actionResultId', { actionResultId })
      .andWhere('config.is_active = :isActive', { isActive: true })
      .getOne();
  }

  async create(data: CreateFudConfigDto): Promise<FudAutoConfig> {
    // Check if configuration already exists for this action result
    const existing = await this.repository.findOne({
      where: { action_result_id: data.action_result_id }
    });

    if (existing) {
      throw Errors.create(
        Errors.Database.DUPLICATE_RECORD,
        'FUD configuration already exists for this action result',
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    // Validate days_offset
    if (data.days_offset < -365 || data.days_offset > 365) {
      throw Errors.create(
        Errors.Validation.INVALID_VALUE,
        'days_offset must be between -365 and 365',
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    const config = this.repository.create({
      ...data,
      updatedBy: data.createdBy,
      is_active: data.is_active ?? true,
      priority: data.priority ?? 0
    });

    return this.repository.save(config);
  }

  async update(id: string, data: UpdateFudConfigDto): Promise<FudAutoConfig> {
    const config = await this.findById(id);
    if (!config) {
      throw Errors.create(
        Errors.Database.RECORD_NOT_FOUND,
        `FUD configuration with ID ${id} not found`,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    // Validate days_offset if provided
    if (data.days_offset !== undefined && (data.days_offset < -365 || data.days_offset > 365)) {
      throw Errors.create(
        Errors.Validation.INVALID_RANGE,
        'days_offset must be between -365 and 365',
        OperationType.VALIDATION,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    Object.assign(config, data);
    config.updated_at = new Date();

    return this.repository.save(config);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw Errors.create(
        Errors.Database.RECORD_NOT_FOUND,
        `FUD configuration with ID ${id} not found`,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }
  }

  async calculateFudDate(params: FudCalculationParams): Promise<Date | null> {
    const config = await this.findByActionResultId(params.action_result_id);
    console.log(config)
    if (!config) {
      return null; // No auto-calculation configured
    }

    let baseDate: Date;
    if (config.calculation_type === FudCalculationType.PROMISE_DATE) {
      baseDate = params.promise_date || params.action_date;
    } else {
      baseDate = params.action_date;
    }
    console.log(baseDate)
    // Calculate FUD by adding days offset
    const fudDate = new Date(baseDate);
    fudDate.setDate(fudDate.getDate() + config.days_offset);
    console.log(fudDate)
    return fudDate;
  }

  async getConfigurationStats(): Promise<any[]> {
    return this.repository
      .createQueryBuilder('config')
      .leftJoin('config.action_result', 'action_result')
      .select([
        'config.id as id',
        'config.action_result_id as action_result_id',
        'action_result.code as action_result_code',
        'action_result.name as action_result_name',
        'config.calculation_type as calculation_type',
        'config.days_offset as days_offset',
        'config.is_active as is_active',
        'config.priority as priority',
        'config.created_at as created_at',
        'config.updated_at as updated_at'
      ])
      .orderBy('config.priority', 'DESC')
      .addOrderBy('action_result.name', 'ASC')
      .getRawMany();
  }
}