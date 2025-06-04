import { CustomerCase } from '../entities/customer-case.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';

/**
 * Repository for CustomerCase entity
 */
export const CustomerCaseRepository = AppDataSource.getRepository(CustomerCase).extend({
 
});