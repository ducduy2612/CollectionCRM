import { Request, Response, NextFunction } from 'express';
import { CollateralRepository } from '../repositories/collateral.repository';
import { Errors, OperationType, SourceSystemType, ValidationErrorCodes } from '../errors';
import { AppDataSource } from '../config/data-source';

/**
 * Collateral controller
 */
export class CollateralController {
  /**
   * Get collateral by collateral number
   * @route GET /collaterals/:collateralNumber
   */
  async getCollateralByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { collateralNumber } = req.params;
      
      if (!collateralNumber) {
        throw Errors.create(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          'Collateral number is required',
          OperationType.VALIDATION,
          SourceSystemType.OTHER
        );
      }
      
      const collateral = await CollateralRepository.getCollateralWithDetails(collateralNumber);
      
      if (!collateral) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Collateral with number ${collateralNumber} not found`,
          OperationType.DATABASE,
          SourceSystemType.OTHER
        );
      }
      
      return res.status(200).json({
        success: true,
        data: collateral,
        message: 'Collateral retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
}