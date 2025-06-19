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
    return this.getAllCustomerStatuses(false);
  },

  /**
   * Get all active collateral status entries
   */
  async getActiveCollateralStatuses(): Promise<any[]> {
    return this.getAllCollateralStatuses(false);
  },

  /**
   * Get all active processing states
   */
  async getActiveProcessingStates(): Promise<any[]> {
    return this.getAllProcessingStates(false);
  },

  /**
   * Get all active processing substates
   */
  async getActiveProcessingSubstates(): Promise<any[]> {
    return this.getAllProcessingSubstates(false);
  },

  /**
   * Get all active lending violation statuses
   */
  async getActiveLendingViolationStatuses(): Promise<any[]> {
    return this.getAllLendingViolationStatuses(false);
  },

  /**
   * Get all active recovery ability statuses
   */
  async getActiveRecoveryAbilityStatuses(): Promise<any[]> {
    return this.getAllRecoveryAbilityStatuses(false);
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
  // UPDATE FUNCTIONS
  // =============================================

  /**
   * Update customer status
   */
  async updateCustomerStatus(code: string, data: {
    name?: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    updatedBy: string;
  }): Promise<any> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      setClauses.push(`is_active = TRUE`);
      if (data.name !== undefined) {
        setClauses.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.color !== undefined) {
        setClauses.push(`color = $${paramCount++}`);
        values.push(data.color);
      }
      if (data.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramCount++}`);
        values.push(data.displayOrder);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
      values.push(code);

      const result = await AppDataSource.query(
        `UPDATE workflow_service.customer_status_dict 
         SET ${setClauses.join(', ')} 
         WHERE code = $${paramCount} 
         RETURNING id, code, name, description, color, display_order, is_active`,
        values
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'updateCustomerStatus', code, data }
      );
    }
  },

  /**
   * Update collateral status
   */
  async updateCollateralStatus(code: string, data: {
    name?: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    updatedBy: string;
  }): Promise<any> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      setClauses.push(`is_active = TRUE`);
      if (data.name !== undefined) {
        setClauses.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.color !== undefined) {
        setClauses.push(`color = $${paramCount++}`);
        values.push(data.color);
      }
      if (data.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramCount++}`);
        values.push(data.displayOrder);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
      values.push(code);

      const result = await AppDataSource.query(
        `UPDATE workflow_service.collateral_status_dict 
         SET ${setClauses.join(', ')} 
         WHERE code = $${paramCount} 
         RETURNING id, code, name, description, color, display_order, is_active`,
        values
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'updateCollateralStatus', code, data }
      );
    }
  },

  /**
   * Update processing state
   */
  async updateProcessingState(code: string, data: {
    name?: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    updatedBy: string;
  }): Promise<any> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      setClauses.push(`is_active = TRUE`);
      if (data.name !== undefined) {
        setClauses.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.color !== undefined) {
        setClauses.push(`color = $${paramCount++}`);
        values.push(data.color);
      }
      if (data.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramCount++}`);
        values.push(data.displayOrder);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
      values.push(code);

      const result = await AppDataSource.query(
        `UPDATE workflow_service.processing_state_dict 
         SET ${setClauses.join(', ')} 
         WHERE code = $${paramCount} 
         RETURNING id, code, name, description, color, display_order, is_active`,
        values
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'updateProcessingState', code, data }
      );
    }
  },

  /**
   * Update processing substate
   */
  async updateProcessingSubstate(code: string, data: {
    name?: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    updatedBy: string;
  }): Promise<any> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      setClauses.push(`is_active = TRUE`);
      if (data.name !== undefined) {
        setClauses.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.color !== undefined) {
        setClauses.push(`color = $${paramCount++}`);
        values.push(data.color);
      }
      if (data.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramCount++}`);
        values.push(data.displayOrder);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
      values.push(code);

      const result = await AppDataSource.query(
        `UPDATE workflow_service.processing_substate_dict 
         SET ${setClauses.join(', ')} 
         WHERE code = $${paramCount} 
         RETURNING id, code, name, description, color, display_order, is_active`,
        values
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'updateProcessingSubstate', code, data }
      );
    }
  },

  /**
   * Update lending violation status
   */
  async updateLendingViolationStatus(code: string, data: {
    name?: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    updatedBy: string;
  }): Promise<any> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      setClauses.push(`is_active = TRUE`);
      if (data.name !== undefined) {
        setClauses.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.color !== undefined) {
        setClauses.push(`color = $${paramCount++}`);
        values.push(data.color);
      }
      if (data.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramCount++}`);
        values.push(data.displayOrder);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
      values.push(code);

      const result = await AppDataSource.query(
        `UPDATE workflow_service.lending_violation_status_dict 
         SET ${setClauses.join(', ')} 
         WHERE code = $${paramCount} 
         RETURNING id, code, name, description, color, display_order, is_active`,
        values
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'updateLendingViolationStatus', code, data }
      );
    }
  },

  /**
   * Update recovery ability status
   */
  async updateRecoveryAbilityStatus(code: string, data: {
    name?: string;
    description?: string;
    color?: string;
    displayOrder?: number;
    updatedBy: string;
  }): Promise<any> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      setClauses.push(`is_active = TRUE`);
      if (data.name !== undefined) {
        setClauses.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        setClauses.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.color !== undefined) {
        setClauses.push(`color = $${paramCount++}`);
        values.push(data.color);
      }
      if (data.displayOrder !== undefined) {
        setClauses.push(`display_order = $${paramCount++}`);
        values.push(data.displayOrder);
      }

      setClauses.push(`updated_at = NOW()`);
      setClauses.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
      values.push(code);

      const result = await AppDataSource.query(
        `UPDATE workflow_service.recovery_ability_status_dict 
         SET ${setClauses.join(', ')} 
         WHERE code = $${paramCount} 
         RETURNING id, code, name, description, color, display_order, is_active`,
        values
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'updateRecoveryAbilityStatus', code, data }
      );
    }
  },

  // =============================================
  // GET ALL FUNCTIONS (INCLUDING INACTIVE)
  // =============================================

  /**
   * Get all customer statuses (optionally including inactive)
   */
  async getAllCustomerStatuses(includeInactive: boolean = false): Promise<any[]> {
    try {
      const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active 
         FROM workflow_service.customer_status_dict 
         ${whereClause} 
         ORDER BY display_order, name`
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getAllCustomerStatuses', includeInactive }
      );
    }
  },

  /**
   * Get all collateral statuses (optionally including inactive)
   */
  async getAllCollateralStatuses(includeInactive: boolean = false): Promise<any[]> {
    try {
      const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active 
         FROM workflow_service.collateral_status_dict 
         ${whereClause} 
         ORDER BY display_order, name`
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getAllCollateralStatuses', includeInactive }
      );
    }
  },

  /**
   * Get all processing states (optionally including inactive)
   */
  async getAllProcessingStates(includeInactive: boolean = false): Promise<any[]> {
    try {
      const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active 
         FROM workflow_service.processing_state_dict 
         ${whereClause} 
         ORDER BY display_order, name`
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getAllProcessingStates', includeInactive }
      );
    }
  },

  /**
   * Get all processing substates (optionally including inactive)
   */
  async getAllProcessingSubstates(includeInactive: boolean = false): Promise<any[]> {
    try {
      const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active 
         FROM workflow_service.processing_substate_dict 
         ${whereClause} 
         ORDER BY display_order, name`
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getAllProcessingSubstates', includeInactive }
      );
    }
  },

  /**
   * Get all lending violation statuses (optionally including inactive)
   */
  async getAllLendingViolationStatuses(includeInactive: boolean = false): Promise<any[]> {
    try {
      const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active 
         FROM workflow_service.lending_violation_status_dict 
         ${whereClause} 
         ORDER BY display_order, name`
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getAllLendingViolationStatuses', includeInactive }
      );
    }
  },

  /**
   * Get all recovery ability statuses (optionally including inactive)
   */
  async getAllRecoveryAbilityStatuses(includeInactive: boolean = false): Promise<any[]> {
    try {
      const whereClause = includeInactive ? '' : 'WHERE is_active = TRUE';
      const result = await AppDataSource.query(
        `SELECT id, code, name, description, color, display_order, is_active 
         FROM workflow_service.recovery_ability_status_dict 
         ${whereClause} 
         ORDER BY display_order, name`
      );
      return result;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { operation: 'getAllRecoveryAbilityStatuses', includeInactive }
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