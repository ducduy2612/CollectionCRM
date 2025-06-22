import { Router } from 'express';
import { WebhookController } from '@/controllers/WebhookController';

export function createWebhookRoutes(webhookController: WebhookController): Router {
  const router = Router();

  // Generic webhook endpoint
  router.post(
    '/webhook',
    WebhookController.validateWebhookPayment,
    webhookController.processWebhookPayment
  );

  // Channel-specific webhook endpoint
  router.post(
    '/webhook/:channel',
    WebhookController.validateWebhookPayment,
    webhookController.processChannelWebhookPayment
  );

  // Webhook statistics
  router.get('/webhook/stats', webhookController.getWebhookStats);

  // Check for duplicate payment reference
  router.get('/webhook/duplicate/:reference_number', webhookController.checkDuplicate);

  // Get payment by reference number
  router.get('/webhook/payment/:reference_number', webhookController.getPaymentByReference);

  return router;
}