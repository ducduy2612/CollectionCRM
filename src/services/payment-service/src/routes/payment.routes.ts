import { Router } from 'express';

export function createPaymentRoutes(): Router {
  const router = Router();

  // TODO: Implement payment routes
  // GET /payments - List payments
  // GET /payments/:id - Get payment by ID
  // POST /payments - Create payment
  // PUT /payments/:id - Update payment
  // DELETE /payments/:id - Delete payment

  return router;
}

// Default export
export default { createPaymentRoutes };