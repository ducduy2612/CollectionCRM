import { Request, Response, NextFunction } from 'express';
import { getCustomRepository } from 'typeorm';
import { CollateralRepository } from '../repositories/collateral.repository';
import { ApiError } from '../middleware/error-handler.middleware';

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
        throw new ApiError(400, 'Collateral number is required');
      }
      
      const collateralRepository = getCustomRepository(CollateralRepository);
      const collateral = await collateralRepository.getCollateralWithDetails(collateralNumber);
      
      if (!collateral) {
        throw new ApiError(404, `Collateral with number ${collateralNumber} not found`);
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