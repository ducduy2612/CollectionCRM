import { Router } from 'express';
import { WebhookController } from '@/controllers/WebhookController';

export function createWebhookRoutes(webhookController: WebhookController): Router {
  const router = Router();

  // Generic webhook endpoint
  router.post(
    '/',
    WebhookController.validateWebhookPayment,
    webhookController.processWebhookPayment
  );

  // Channel-specific webhook endpoint
  router.post(
    '/:channel',
    WebhookController.validateWebhookPayment,
    webhookController.processChannelWebhookPayment
  );

  // Webhook statistics
  router.get('/stats', webhookController.getWebhookStats);

  // Check for duplicate payment reference
  router.get('/duplicate/:reference_number', webhookController.checkDuplicate);

  // Get payment by reference number
  router.get('/payment/:reference_number', webhookController.getPaymentByReference);

  return router;
}

// Default export for backward compatibility
export default { createWebhookRoutes };