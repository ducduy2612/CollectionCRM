import { Router } from 'express';

export function createPaymentMethodRoutes(): Router {
  const router = Router();

  // TODO: Implement payment method routes
  // GET /payment-methods - List payment methods
  // GET /payment-methods/:id - Get payment method by ID
  // POST /payment-methods - Create payment method
  // PUT /payment-methods/:id - Update payment method
  // DELETE /payment-methods/:id - Delete payment method

  return router;
}

// Default export
export default { createPaymentMethodRoutes };