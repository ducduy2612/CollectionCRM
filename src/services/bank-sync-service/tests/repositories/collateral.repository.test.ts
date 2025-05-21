import { CollateralRepository } from '../../src/repositories/collateral.repository';
import { AppDataSource } from '../../src/config/data-source';
import { describe, expect, it } from '@jest/globals';

describe('CollateralRepository', () => {
  // No need for beforeAll and afterAll here as they are handled in jest-setup.ts

  describe('findByNaturalKey', () => {
    it('should find a collateral by collateral number', async () => {
      // Test using existing data in the test database
      const collateralNumber = 'COLL10000001'; // Assuming this collateral number exists in the test data
      const collateral = await CollateralRepository.findByNaturalKey(collateralNumber);
      
      expect(collateral).toBeDefined();
      expect(collateral?.collateralNumber).toBe(collateralNumber);
    });

    it('should return undefined for non-existent collateral number', async () => {
      const nonExistentCollateralNumber = 'non-existent-collateral';
      const collateral = await CollateralRepository.findByNaturalKey(nonExistentCollateralNumber);
      
      expect(collateral).toBeUndefined();
    });
  });

  describe('findByCif', () => {
    it('should find collaterals by customer CIF', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const result = await CollateralRepository.findByCif(cif, {
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
    });

    it('should filter collaterals by type', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const type = 'VEHICLE'; // Assuming there are VEHICLE collaterals in the test data
      
      const result = await CollateralRepository.findByCif(cif, {
        type: type as any,
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      
      if (result.items.length > 0) {
        expect(result.items[0].type).toBe(type);
      }
    });
  });

  describe('findBySourceSystem', () => {
    it('should find collaterals by source system', async () => {
      // Test using existing data in the test database
      const sourceSystem = 'T24'; // Assuming this source system exists in test data
      const collaterals = await CollateralRepository.findBySourceSystem(sourceSystem as any);
      
      expect(collaterals).toBeDefined();
      expect(collaterals).toBeInstanceOf(Array);
      
      if (collaterals.length > 0) {
        expect(collaterals[0].sourceSystem).toBe(sourceSystem);
      }
    });
  });
});