import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const loanController = new LoanController();

/**
 * @route GET /loans/:accountNumber
 * @desc Get loan by account number
 * @access Private - Requires authentication and appropriate roles
 */
router.get(
  '/:accountNumber',
  requireAuth,
  loanController.getLoanByAccountNumber
);

export default router;