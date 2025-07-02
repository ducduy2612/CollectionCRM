import { Router } from 'express';
import { PaymentController } from '@/controllers/PaymentController';

export function createPaymentRoutes(paymentController: PaymentController): Router {
  const router = Router();

  // Payment query routes - Get payments by CIF with optional filters
  router.get(
    '/cif/:cif',
    PaymentController.validatePaymentByCifQueries,
    paymentController.getPaymentsByCif
  );

  return router;
}

// Default export
export default { createPaymentRoutes };