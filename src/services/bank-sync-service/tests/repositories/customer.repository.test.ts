import { CustomerRepository } from '../../src/repositories/customer.repository';
import { AppDataSource } from '../../src/config/data-source';
import { Customer } from '../../src/models/customer.entity';
import { describe, expect, it } from '@jest/globals';

describe('CustomerRepository', () => {
  // No need for beforeAll and afterAll here as they are handled in jest-setup.ts

  describe('findByNaturalKey', () => {
    it('should find a customer by CIF', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const customer = await CustomerRepository.findByNaturalKey(cif);
      
      expect(customer).toBeDefined();
      expect(customer?.cif).toBe(cif);
    });

    it('should return undefined for non-existent CIF', async () => {
      const nonExistentCif = 'non-existent-cif';
      const customer = await CustomerRepository.findByNaturalKey(nonExistentCif);
      
      expect(customer).toBeUndefined();
    });
  });

  describe('getCustomerWithDetails', () => {
    it('should retrieve customer with all related entities', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const customer = await CustomerRepository.getCustomerWithDetails(cif);
      
      expect(customer).toBeDefined();
      expect(customer?.cif).toBe(cif);
      
      // Check that related entities are loaded
      expect(customer?.phones).toBeDefined();
      expect(customer?.addresses).toBeDefined();
      expect(customer?.emails).toBeDefined();
    });
  });

  describe('searchCustomers', () => {
    it('should search customers based on criteria', async () => {
      // Test searching by name
      const result = await CustomerRepository.searchCustomers({
        name: 'John Smith', // Assuming there's a customer with this name in test data
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
    });

    it('should return empty array when no customers match criteria', async () => {
      const result = await CustomerRepository.searchCustomers({
        name: 'NonExistentCustomerName',
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('findBySourceSystemWithRelations', () => {
    it('should find customers by source system with relations', async () => {
      // Test using existing data in the test database
      const sourceSystem = 'T24'; // Assuming this source system exists in test data
      const customers = await CustomerRepository.findBySourceSystemWithRelations(sourceSystem as any);
      
      expect(customers).toBeDefined();
      expect(customers).toBeInstanceOf(Array);
      
      if (customers.length > 0) {
        const customer = customers[0];
        expect(customer.sourceSystem).toBe(sourceSystem);
        expect(customer.phones).toBeDefined();
        expect(customer.addresses).toBeDefined();
        expect(customer.emails).toBeDefined();
      }
    });
  });
});