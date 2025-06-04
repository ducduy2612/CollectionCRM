import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';

/**
 * Status Dictionary Configuration Repository
 * Handles all status dictionary management operations using stored procedures
 */
export const StatusDictRepository = {
  // =============================================
  // CUSTOMER STATUS FUNCTIONS
  // =============================================
  
  /**
   * Add new customer status
   */
  async addCustomerStatus(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    createdBy: string;
  }): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_customer_status($1, $2, $3, $4, $5, $6) as id',
        [
          data.code,
          data.name,
          data.description || null,
          data.color || null,
          data.displayOrder || 0,
          data.createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'addCustomerStatus', data }
      );
    }
  },

  /**
   * Deactivate customer status
   */
  async deactivateCustomerStatus(code: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_customer_status($1, $2) as success',
        [code, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'deactivateCustomerStatus', code, updatedBy }
      );
    }
  },

  // =============================================
  // COLLATERAL STATUS FUNCTIONS
  // =============================================
  
  /**
   * Add new collateral status
   */
  async addCollateralStatus(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    createdBy: string;
  }): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_collateral_status($1, $2, $3, $4, $5, $6) as id',
        [
          data.code,
          data.name,
          data.description || null,
          data.color || null,
          data.displayOrder || 0,
          data.createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'addCollateralStatus', data }
      );
    }
  },

  /**
   * Deactivate collateral status
   */
  async deactivateCollateralStatus(code: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_collateral_status($1, $2) as success',
        [code, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'deactivateCollateralStatus', code, updatedBy }
      );
    }
  },

  // =============================================
  // PROCESSING STATE FUNCTIONS
  // =============================================
  
  /**
   * Add new processing state
   */
  async addProcessingState(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    createdBy: string;
  }): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_processing_state($1, $2, $3, $4, $5, $6) as id',
        [
          data.code,
          data.name,
          data.description || null,
          data.color || null,
          data.displayOrder || 0,
          data.createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'addProcessingState', data }
      );
    }
  },

  /**
   * Add new processing substate
   */
  async addProcessingSubstate(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    createdBy: string;
  }): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_processing_substate($1, $2, $3, $4, $5, $6) as id',
        [
          data.code,
          data.name,
          data.description || null,
          data.color || null,
          data.displayOrder || 0,
          data.createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'addProcessingSubstate', data }
      );
    }
  },

  /**
   * Map processing state to substate
   */
  async mapStateToSubstate(stateCode: string, substateCode: string, createdBy: string): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.map_state_to_substate($1, $2, $3) as id',
        [stateCode, substateCode, createdBy]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'mapStateToSubstate', stateCode, substateCode, createdBy }
      );
    }
  },

  /**
   * Get available substates for a processing state
   */
  async getSubstatesForState(stateCode: string): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT * FROM workflow_service.get_substates_for_state($1)',
        [stateCode]
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getSubstatesForState', stateCode }
      );
    }
  },

  /**
   * Deactivate processing state
   */
  async deactivateProcessingState(code: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_processing_state($1, $2) as success',
        [code, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'deactivateProcessingState', code, updatedBy }
      );
    }
  },

  /**
   * Deactivate processing substate
   */
  async deactivateProcessingSubstate(code: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_processing_substate($1, $2) as success',
        [code, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'deactivateProcessingSubstate', code, updatedBy }
      );
    }
  },

  /**
   * Remove state-substate mapping
   */
  async removeStateSubstateMapping(stateCode: string, substateCode: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.remove_state_substate_mapping($1, $2, $3) as success',
        [stateCode, substateCode, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'removeStateSubstateMapping', stateCode, substateCode, updatedBy }
      );
    }
  },

  // =============================================
  // LENDING VIOLATION STATUS FUNCTIONS
  // =============================================
  
  /**
   * Add new lending violation status
   */
  async addLendingViolationStatus(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    createdBy: string;
  }): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_lending_violation_status($1, $2, $3, $4, $5, $6) as id',
        [
          data.code,
          data.name,
          data.description || null,
          data.color || null,
          data.displayOrder || 0,
          data.createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'addLendingViolationStatus', data }
      );
    }
  },

  /**
   * Deactivate lending violation status
   */
  async deactivateLendingViolationStatus(code: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_lending_violation_status($1, $2) as success',
        [code, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'deactivateLendingViolationStatus', code, updatedBy }
      );
    }
  },

  // =============================================
  // RECOVERY ABILITY STATUS FUNCTIONS
  // =============================================
  
  /**
   * Add new recovery ability status
   */
  async addRecoveryAbilityStatus(data: {
    code: string;
    name: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    createdBy: string;
  }): Promise<string> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.add_recovery_ability_status($1, $2, $3, $4, $5, $6) as id',
        [
          data.code,
          data.name,
          data.description || null,
          data.color || null,
          data.displayOrder || 0,
          data.createdBy
        ]
      );
      return result[0].id;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'addRecoveryAbilityStatus', data }
      );
    }
  },

  /**
   * Deactivate recovery ability status
   */
  async deactivateRecoveryAbilityStatus(code: string, updatedBy: string): Promise<boolean> {
    try {
      const result = await AppDataSource.query(
        'SELECT workflow_service.deactivate_recovery_ability_status($1, $2) as success',
        [code, updatedBy]
      );
      return result[0].success;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'deactivateRecoveryAbilityStatus', code, updatedBy }
      );
    }
  },

  // =============================================
  // FINDING ACTIVE STATUS DICTIONARY ENTRIES
  // =============================================
  
  /**
   * Get all active customer status entries
   */
  async getActiveCustomerStatuses(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT id, code, name, description, color, display_order FROM workflow_service.customer_status_dict WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getActiveCustomerStatuses' }
      );
    }
  },

  /**
   * Get all active collateral status entries
   */
  async getActiveCollateralStatuses(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT id, code, name, description, color, display_order FROM workflow_service.collateral_status_dict WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getActiveCollateralStatuses' }
      );
    }
  },

  /**
   * Get all active processing states
   */
  async getActiveProcessingStates(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT id, code, name, description, color, display_order FROM workflow_service.processing_state_dict WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getActiveProcessingStates' }
      );
    }
  },

  /**
   * Get all active processing substates
   */
  async getActiveProcessingSubstates(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT id, code, name, description, color, display_order FROM workflow_service.processing_substate_dict WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getActiveProcessingSubstates' }
      );
    }
  },

  /**
   * Get all active lending violation statuses
   */
  async getActiveLendingViolationStatuses(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT id, code, name, description, color, display_order FROM workflow_service.lending_violation_status_dict WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getActiveLendingViolationStatuses' }
      );
    }
  },

  /**
   * Get all active recovery ability statuses
   */
  async getActiveRecoveryAbilityStatuses(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT id, code, name, description, color, display_order FROM workflow_service.recovery_ability_status_dict WHERE is_active = TRUE ORDER BY display_order, name'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getActiveRecoveryAbilityStatuses' }
      );
    }
  },

  /**
   * Find status by code and type
   */
  async findStatusByCode(statusType: string, code: string): Promise<any | null> {
    try {
      let tableName: string;
      switch (statusType.toLowerCase()) {
        case 'customer':
          tableName = 'customer_status_dict';
          break;
        case 'collateral':
          tableName = 'collateral_status_dict';
          break;
        case 'processing_state':
          tableName = 'processing_state_dict';
          break;
        case 'processing_substate':
          tableName = 'processing_substate_dict';
          break;
        case 'lending_violation':
          tableName = 'lending_violation_status_dict';
          break;
        case 'recovery_ability':
          tableName = 'recovery_ability_status_dict';
          break;
        default:
          throw new Error(`Invalid status type: ${statusType}`);
      }

      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active FROM workflow_service.${tableName} WHERE code = $1`,
        [code]
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'findStatusByCode', statusType, code }
      );
    }
  },

  // =============================================
  // USAGE STATISTICS FUNCTIONS
  // =============================================
  
  /**
   * Get status usage statistics
   */
  async getStatusUsageStats(): Promise<any[]> {
    try {
      const result = await AppDataSource.query(
        'SELECT * FROM workflow_service.get_status_usage_stats()'
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getStatusUsageStats' }
      );
    }
  }
};