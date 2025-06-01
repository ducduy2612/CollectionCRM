import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ActionType, ActionSubtype, ActionResult } from '../entities';

/**
 * Configuration data types
 */
export interface ActionTypeConfig {
  code: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface ActionSubtypeConfig {
  code: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface ActionResultConfig {
  code: string;
  name: string;
  description?: string;
  display_order?: number;
}

export interface SubtypeForType {
  subtype_id: string;
  subtype_code: string;
  subtype_name: string;
  subtype_description: string;
  display_order: number;
}

export interface ResultForSubtype {
  result_id: string;
  result_code: string;
  result_name: string;
  result_description: string;
  display_order: number;
}

export interface ConfigUsageStats {
  config_type: string;
  config_code: string;
  config_name: string;
  is_active: boolean;
  usage_count: number;
  can_be_deactivated: boolean;
}

/**
 * Repository for configuration management
 */
export class ActionConfigRepository {
  /**
   * Add new action type
   */
  static async addActionType(
    config: ActionTypeConfig,
    createdBy: string = 'ADMIN'
  ): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_action_type($1, $2, $3, $4, $5) as id',
        [
          config.code,
          config.name,
          config.description || null,
          config.display_order || 0,
          createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { config, createdBy, operation: 'addActionType' }
      );
    }
  }

  /**
   * Add new action subtype
   */
  static async addActionSubtype(
    config: ActionSubtypeConfig,
    createdBy: string = 'ADMIN'
  ): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_action_subtype($1, $2, $3, $4, $5) as id',
        [
          config.code,
          config.name,
          config.description || null,
          config.display_order || 0,
          createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { config, createdBy, operation: 'addActionSubtype' }
      );
    }
  }

  /**
   * Add new action result
   */
  static async addActionResult(
    config: ActionResultConfig,
    createdBy: string = 'ADMIN'
  ): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_action_result($1, $2, $3, $4, $5) as id',
        [
          config.code,
          config.name,
          config.description || null,
          config.display_order || 0,
          createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { config, createdBy, operation: 'addActionResult' }
      );
    }
  }

  /**
   * Map action type to subtype
   */
  static async mapTypeToSubtype(
    typeCode: string,
    subtypeCode: string,
    createdBy: string = 'ADMIN'
  ): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.map_type_to_subtype($1, $2, $3) as id',
        [typeCode, subtypeCode, createdBy]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { typeCode, subtypeCode, createdBy, operation: 'mapTypeToSubtype' }
      );
    }
  }

  /**
   * Map action subtype to result
   */
  static async mapSubtypeToResult(
    subtypeCode: string,
    resultCode: string,
    createdBy: string = 'ADMIN'
  ): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.map_subtype_to_result($1, $2, $3) as id',
        [subtypeCode, resultCode, createdBy]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { subtypeCode, resultCode, createdBy, operation: 'mapSubtypeToResult' }
      );
    }
  }

  /**
   * Get available subtypes for a type
   */
  static async getSubtypesForType(typeCode: string): Promise<SubtypeForType[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT * FROM workflow_service.get_subtypes_for_type($1)',
        [typeCode]
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { typeCode, operation: 'getSubtypesForType' }
      );
    }
  }

  /**
   * Get available results for a subtype
   */
  static async getResultsForSubtype(subtypeCode: string): Promise<ResultForSubtype[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT * FROM workflow_service.get_results_for_subtype($1)',
        [subtypeCode]
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { subtypeCode, operation: 'getResultsForSubtype' }
      );
    }
  }

  /**
   * Validate action configuration
   */
  static async validateActionConfiguration(
    typeId: string,
    subtypeId: string,
    resultId: string
  ): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.validate_action_configuration($1, $2, $3) as is_valid',
        [typeId, subtypeId, resultId]
      );
      return result[0].is_valid;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { typeId, subtypeId, resultId, operation: 'validateActionConfiguration' }
      );
    }
  }

  /**
   * Deactivate action type
   */
  static async deactivateActionType(
    typeCode: string,
    updatedBy: string = 'ADMIN'
  ): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_action_type($1, $2) as success',
        [typeCode, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { typeCode, updatedBy, operation: 'deactivateActionType' }
      );
    }
  }

  /**
   * Deactivate action subtype
   */
  static async deactivateActionSubtype(
    subtypeCode: string,
    updatedBy: string = 'ADMIN'
  ): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_action_subtype($1, $2) as success',
        [subtypeCode, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { subtypeCode, updatedBy, operation: 'deactivateActionSubtype' }
      );
    }
  }

  /**
   * Deactivate action result
   */
  static async deactivateActionResult(
    resultCode: string,
    updatedBy: string = 'ADMIN'
  ): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_action_result($1, $2) as success',
        [resultCode, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { resultCode, updatedBy, operation: 'deactivateActionResult' }
      );
    }
  }

  /**
   * Remove type-subtype mapping
   */
  static async removeTypeSubtypeMapping(
    typeCode: string,
    subtypeCode: string,
    updatedBy: string = 'ADMIN'
  ): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.remove_type_subtype_mapping($1, $2, $3) as success',
        [typeCode, subtypeCode, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { typeCode, subtypeCode, updatedBy, operation: 'removeTypeSubtypeMapping' }
      );
    }
  }

  /**
   * Remove subtype-result mapping
   */
  static async removeSubtypeResultMapping(
    subtypeCode: string,
    resultCode: string,
    updatedBy: string = 'ADMIN'
  ): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.remove_subtype_result_mapping($1, $2, $3) as success',
        [subtypeCode, resultCode, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { subtypeCode, resultCode, updatedBy, operation: 'removeSubtypeResultMapping' }
      );
    }
  }

  /**
   * Get configuration usage statistics
   */
  static async getConfigurationUsageStats(): Promise<ConfigUsageStats[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT * FROM workflow_service.get_configuration_usage_stats()'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getConfigurationUsageStats' }
      );
    }
  }
}

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