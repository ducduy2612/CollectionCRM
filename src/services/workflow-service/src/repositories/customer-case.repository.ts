import { CustomerCase } from '../entities/customer-case.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { In } from 'typeorm';

/**
 * Repository for CustomerCase entity
 */
export const CustomerCaseRepository = AppDataSource.getRepository(CustomerCase).extend({
  /**
   * Update master notes for a customer case by CIF
   */
  async updateMasterNotes(cif: string, masterNotes: string, updatedBy: string): Promise<CustomerCase> {
    const customerCase = await this.findOne({ where: { cif } });
    
    if (!customerCase) {
      throw Errors.create(
        Errors.Validation.REQUIRED_FIELD_MISSING,
        `Customer case not found for CIF: ${cif}`,
        OperationType.READ,
        SourceSystemType.WORKFLOW_SERVICE
      );
    }

    customerCase.masterNotes = masterNotes;
    customerCase.updatedBy = updatedBy;

    return await this.save(customerCase);
  },

  /**
   * Update f_update field for a customer case by CIF
   */
  async updateFUpdate(cif: string, fUpdate: Date, updatedBy: string): Promise<void> {
    try {
      const result = await this.update(
        { cif },
        { 
          fUpdate,
          updatedBy,
          updatedAt: new Date()
        }
      );

      if (result.affected === 0) {
        // Create customer case if it doesn't exist
        const newCustomerCase = this.create({
          cif,
          fUpdate,
          createdBy: updatedBy,
          updatedBy,
          assignedCallAgentId: null,
          assignedFieldAgentId: null,
          masterNotes: null
        });
        
        await this.save(newCustomerCase);
      }
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, fUpdate, updatedBy, operation: 'updateFUpdate' }
      );
    }
  },

  /**
   * Bulk update f_update field for multiple customer cases
   */
  async bulkUpdateFUpdate(updates: Array<{ cif: string; fUpdate: Date; updatedBy: string }>): Promise<void> {
    try {
      // Group updates by unique values to optimize queries
      const updateGroups = new Map<string, { cif: string; fUpdate: Date; updatedBy: string }[]>();
      
      updates.forEach(update => {
        const key = `${update.fUpdate.toISOString()}_${update.updatedBy}`;
        if (!updateGroups.has(key)) {
          updateGroups.set(key, []);
        }
        updateGroups.get(key)!.push(update);
      });

      // Process each group
      for (const [, group] of updateGroups) {
        const cifs = group.map(u => u.cif);
        const { fUpdate, updatedBy } = group[0];

        // Update existing records
        const result = await this.update(
          { cif: In(cifs) },
          { 
            fUpdate,
            updatedBy,
            updatedAt: new Date()
          }
        );

        // If some records were not updated (don't exist), create them
        if (result.affected !== cifs.length) {
          const existingRecords = await this.find({
            where: { cif: In(cifs) },
            select: ['cif']
          });
          
          const existingCifs = new Set(existingRecords.map(r => r.cif));
          const missingCifs = cifs.filter(cif => !existingCifs.has(cif));

          if (missingCifs.length > 0) {
            const newRecords = missingCifs.map(cif => this.create({
              cif,
              fUpdate,
              createdBy: updatedBy,
              updatedBy,
              assignedCallAgentId: null,
              assignedFieldAgentId: null,
              masterNotes: null
            }));

            await this.save(newRecords);
          }
        }
      }
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { updates, operation: 'bulkUpdateFUpdate' }
      );
    }
  }
});