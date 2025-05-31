import { ActionType, ActionSubtype, ActionResult, ActionTypeSubtypeMapping, ActionSubtypeResultMapping } from '../entities';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';

/**
 * Repository for ActionType entity
 */
export const ActionTypeRepository = AppDataSource.getRepository(ActionType).extend({
  /**
   * Find all active action types
   */
  async findAllActive(): Promise<ActionType[]> {
    try {
      return await this.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'findAllActive' }
      );
    }
  },

  /**
   * Find action type by code
   */
  async findByCode(code: string): Promise<ActionType | null> {
    try {
      return await this.findOne({ where: { code, isActive: true } });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { code, operation: 'findByCode' }
      );
    }
  }
});

/**
 * Repository for ActionSubtype entity
 */
export const ActionSubtypeRepository = AppDataSource.getRepository(ActionSubtype).extend({
  /**
   * Find all active action subtypes
   */
  async findAllActive(): Promise<ActionSubtype[]> {
    try {
      return await this.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'findAllActive' }
      );
    }
  },

  /**
   * Find action subtype by code
   */
  async findByCode(code: string): Promise<ActionSubtype | null> {
    try {
      return await this.findOne({ where: { code, isActive: true } });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { code, operation: 'findByCode' }
      );
    }
  },
});

/**
 * Repository for ActionResult entity
 */
export const ActionResultRepository = AppDataSource.getRepository(ActionResult).extend({
  /**
   * Find all active action results
   */
  async findAllActive(): Promise<ActionResult[]> {
    try {
      return await this.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', name: 'ASC' }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'findAllActive' }
      );
    }
  },

  /**
   * Find action result by code
   */
  async findByCode(code: string): Promise<ActionResult | null> {
    try {
      return await this.findOne({ where: { code, isActive: true } });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { code, operation: 'findByCode' }
      );
    }
  },
});