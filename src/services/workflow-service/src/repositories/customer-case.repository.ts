import { CustomerCase } from '../entities/customer-case.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';

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
  }
});