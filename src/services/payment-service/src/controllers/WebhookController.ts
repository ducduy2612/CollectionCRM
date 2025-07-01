import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pino from 'pino';
import { PaymentService } from '@/services/PaymentService';
import { WebhookPaymentSchema, WebhookPaymentData } from '@/types/webhook.types';

export class WebhookController {
  private paymentService: PaymentService;
  private logger: pino.Logger;

  constructor(paymentService: PaymentService, logger: pino.Logger) {
    this.paymentService = paymentService;
    this.logger = logger;
  }

  // Validation middleware for webhook payments
  static validateWebhookPayment = [
    body('reference_number')
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('Reference number must be a string between 1-255 characters'),
    
    body('loan_account_number')
      .isString()
      .isLength({ min: 1, max: 20 })
      .withMessage('Loan account number must be a string between 1-20 characters'),
    
    body('cif')
      .isString()
      .isLength({ min: 1, max: 20 })
      .withMessage('CIF must be a string between 1-20 characters'),
    
    body('amount')
      .isNumeric()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    
    body('payment_date')
      .isISO8601()
      .withMessage('Payment date must be a valid ISO 8601 date'),
    
    body('payment_channel')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('Payment channel must be a string up to 100 characters'),
    
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ];

  // Generic webhook endpoint
  processWebhookPayment = async (req: Request, res: Response): Promise<void> => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const signature = req.headers['x-signature'] as string;

    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        this.logger.warn({
          request_id: requestId,
          client_ip: clientIp,
          errors: errors.array()
        }, 'Webhook validation failed');

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      // Parse and validate payment data with Zod
      const parseResult = WebhookPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        this.logger.warn({
          request_id: requestId,
          client_ip: clientIp,
          zodErrors: parseResult.error.errors
        }, 'Webhook Zod validation failed');

        res.status(400).json({
          success: false,
          error: 'Invalid payment data',
          details: parseResult.error.errors,
        });
        return;
      }

      const paymentData: WebhookPaymentData = parseResult.data;

      this.logger.info({
        request_id: requestId,
        client_ip: clientIp,
        reference_number: paymentData.reference_number
      }, 'Processing webhook payment');

      // Process the payment
      const result = await this.paymentService.processWebhookPayment(
        paymentData,
        undefined, // No specific channel for generic endpoint
        clientIp,
        signature
      );

      this.logger.info({
        request_id: requestId,
        payment_id: result.payment_id,
        duplicate: result.duplicate
      }, 'Webhook payment processed successfully');

      res.status(result.duplicate ? 200 : 201).json({
        success: true,
        data: result,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({
        request_id: requestId,
        client_ip: clientIp,
        error: errorMessage
      }, 'Error processing webhook payment');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Channel-specific webhook endpoint
  processChannelWebhookPayment = async (req: Request, res: Response): Promise<void> => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const signature = req.headers['x-signature'] as string;
    const channel = req.params.channel;

    if (!channel) {
      res.status(400).json({
        success: false,
        error: 'Channel parameter is required',
      });
      return;
    }

    try {
      // Validate request body
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        this.logger.warn({
          request_id: requestId,
          client_ip: clientIp,
          channel,
          errors: errors.array()
        }, 'Channel webhook validation failed');

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      // Parse and validate payment data with Zod
      const parseResult = WebhookPaymentSchema.safeParse(req.body);
      if (!parseResult.success) {
        this.logger.warn({
          request_id: requestId,
          client_ip: clientIp,
          channel,
          zodErrors: parseResult.error.errors
        }, 'Channel webhook Zod validation failed');

        res.status(400).json({
          success: false,
          error: 'Invalid payment data',
          details: parseResult.error.errors,
        });
        return;
      }

      const paymentData: WebhookPaymentData = parseResult.data;

      this.logger.info({
        request_id: requestId,
        client_ip: clientIp,
        channel,
        reference_number: paymentData.reference_number
      }, 'Processing channel webhook payment');

      // Process the payment with channel-specific configuration
      const result = await this.paymentService.processWebhookPayment(
        paymentData,
        channel,
        clientIp,
        signature
      );

      this.logger.info({
        request_id: requestId,
        channel,
        payment_id: result.payment_id,
        duplicate: result.duplicate
      }, 'Channel webhook payment processed successfully');

      res.status(result.duplicate ? 200 : 201).json({
        success: true,
        data: result,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({
        request_id: requestId,
        client_ip: clientIp,
        channel,
        error: errorMessage
      }, 'Error processing channel webhook payment');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Get webhook statistics
  getWebhookStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.paymentService.getStats();

      res.json({
        success: true,
        data: {
          webhooks: stats.webhooks,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error getting webhook stats');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Check if payment reference exists (duplicate check)
  checkDuplicate = async (req: Request, res: Response): Promise<void> => {
    const { reference_number } = req.params;

    if (!reference_number) {
      res.status(400).json({
        success: false,
        error: 'Reference number is required',
      });
      return;
    }

    try {
      const isDuplicate = await this.paymentService.isDuplicate(reference_number);

      res.json({
        success: true,
        data: {
          reference_number,
          is_duplicate: isDuplicate,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ 
        error: errorMessage, 
        reference_number 
      }, 'Error checking duplicate');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Get payment by reference number
  getPaymentByReference = async (req: Request, res: Response): Promise<void> => {
    const { reference_number } = req.params;

    if (!reference_number) {
      res.status(400).json({
        success: false,
        error: 'Reference number is required',
      });
      return;
    }

    try {
      const payment = await this.paymentService.getPaymentByReference(reference_number);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ 
        error: errorMessage, 
        reference_number 
      }, 'Error getting payment by reference');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };
}