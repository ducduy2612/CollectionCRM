import * as path from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

// Load environment variables from .env.test file
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Force NODE_ENV to be 'test'
process.env.NODE_ENV = 'test';

// Import AppDataSource after environment variables are loaded
import { AppDataSource } from '../../src/config/data-source';

// Import all entity classes directly
import { Customer } from '../../src/models/customer.entity';
import { Loan, DueSegmentation } from '../../src/models/loan.entity';
import { Collateral } from '../../src/models/collateral.entity';
import { Email } from '../../src/models/email.entity';
import { Phone } from '../../src/models/phone.entity';
import { Address } from '../../src/models/address.entity';
import { ReferenceCustomer } from '../../src/models/reference-customer.entity';
import { SyncStatus } from '../../src/models/sync-status.entity';

// Initialize the AppDataSource for tests
export const initializeTestDataSource = async (): Promise<DataSource> => {
  // Override the AppDataSource options for testing
  Object.assign(AppDataSource.options, {
    schema: 'bank_sync_service',
    entities: [
      Customer,
      Loan,
      DueSegmentation,
      Collateral,
      Email,
      Phone,
      Address,
      ReferenceCustomer,
      SyncStatus
    ],
    synchronize: false,
    logging: false
  });
  
  // Initialize if not already initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  return AppDataSource;
};

// Close the AppDataSource
export const closeTestDataSource = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
};