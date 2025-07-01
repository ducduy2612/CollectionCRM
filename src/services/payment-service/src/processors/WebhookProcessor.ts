import { RedisClientType } from 'redis';
import { Knex } from 'knex';
import pino from 'pino';
import crypto from 'crypto';
import { PaymentModel } from '@/models/Payment';
import { DeduplicationService } from '@/services/DeduplicationService';
import { 
  WebhookPaymentData, 
  WebhookAuthConfig, 
  WebhookProcessingResult,
  RateLimitInfo,
  WebhookMetrics 
} from '@/types/webhook.types';
import { Payment } from '@/types/payment.types';

export interface WebhookProcessorConfig {
  timeout_ms: number;
  rate_limit: {
    enabled: boolean;
    max_requests: number;
    window_ms: number;
  };
  auth: WebhookAuthConfig;
  channels: Record<string, {
    auth: WebhookAuthConfig;
    rate_limit: {
      enabled: boolean;
      max_requests: number;
      window_ms: number;
    };
  }>;
}

export class WebhookProcessor {
  private redisClient: RedisClientType;
  private logger: pino.Logger;
  private config: WebhookProcessorConfig;
  
  private paymentModel: PaymentModel;
  private deduplicationService: DeduplicationService;
  private metrics: WebhookMetrics;

  constructor(
    knex: Knex,
    redisClient: RedisClientType,
    deduplicationService: DeduplicationService,
    logger: pino.Logger,
    config: WebhookProcessorConfig
  ) {
    this.redisClient = redisClient;
    this.deduplicationService = deduplicationService;
    this.logger = logger;
    this.config = config;

    this.paymentModel = new PaymentModel(knex);
    
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      duplicate_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
    };
  }

  async processWebhookPayment(
    paymentData: WebhookPaymentData,
    channel?: string,
    clientIp?: string,
    signature?: string
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    const requestId = crypto.randomBytes(16).toString('hex');

    this.logger.info({
      request_id: requestId,
      channel,
      client_ip: clientIp,
      reference_number: paymentData.reference_number
    }, 'Processing webhook payment');

    this.metrics.total_requests++;
    this.metrics.last_request_at = new Date();

    try {
      // 1. Validate authentication
      const authConfig = channel ? this.config.channels[channel]?.auth : this.config.auth;
      if (authConfig?.enabled) {
        const isValid = await this.validateAuth(paymentData, signature, authConfig);
        if (!isValid) {
          this.logger.warn({ request_id: requestId, channel }, 'Authentication failed');
          this.metrics.failed_requests++;
          return {
            success: false,
            duplicate: false,
            error: 'Authentication failed',
            processing_time_ms: Date.now() - startTime,
          };
        }
      }

      // 2. Check rate limiting
      const rateLimitConfig = channel ? this.config.channels[channel]?.rate_limit : this.config.rate_limit;
      if (rateLimitConfig?.enabled) {
        const rateLimitResult = await this.checkRateLimit(clientIp || 'unknown', channel, rateLimitConfig);
        if (!rateLimitResult.allowed) {
          this.logger.warn({ 
            request_id: requestId, 
            channel, 
            client_ip: clientIp,
            rate_limit: rateLimitResult 
          }, 'Rate limit exceeded');
          this.metrics.failed_requests++;
          return {
            success: false,
            duplicate: false,
            error: 'Rate limit exceeded',
            processing_time_ms: Date.now() - startTime,
          };
        }
      }

      // 3. Check for duplicate
      const isDuplicate = await this.deduplicationService.isDuplicate(paymentData.reference_number);
      
      if (isDuplicate) {
        this.logger.info({ 
          request_id: requestId, 
          reference_number: paymentData.reference_number 
        }, 'Duplicate payment detected');
        
        this.metrics.duplicate_requests++;
        
        // Get existing payment ID for response
        const existingPayment = await this.paymentModel.findByReference(paymentData.reference_number);
        
        return {
          success: true,
          payment_id: existingPayment?.id || 'unknown',
          duplicate: true,
          processing_time_ms: Date.now() - startTime,
        };
      }

      // 4. Process payment
      const paymentDate = typeof paymentData.payment_date === 'string' 
        ? new Date(paymentData.payment_date) 
        : paymentData.payment_date;

      const paymentCreateData: Omit<Payment, 'id' | 'created_at'> = {
        reference_number: paymentData.reference_number,
        loan_account_number: paymentData.loan_account_number,
        cif: paymentData.cif,
        amount: paymentData.amount,
        payment_date: paymentDate,
        source: 'webhook',
        metadata: {
          ...(paymentData.metadata || {}),
          ...(channel && { webhook_channel: channel }),
          ...(clientIp && { client_ip: clientIp }),
          request_id: requestId,
        },
      };

      // Add payment_channel if available
      const effectiveChannel = paymentData.payment_channel || channel;
      if (effectiveChannel) {
        paymentCreateData.payment_channel = effectiveChannel;
      }

      const payment = await this.paymentModel.create(paymentCreateData);

      // 5. Add to deduplication cache
      await this.deduplicationService.addReference(
        payment.reference_number,
        payment.id,
        payment.payment_date
      );

      this.logger.info({
        request_id: requestId,
        payment_id: payment.id,
        reference_number: payment.reference_number,
        amount: payment.amount
      }, 'Webhook payment processed successfully');

      this.metrics.successful_requests++;
      
      // Update average response time
      const processingTime = Date.now() - startTime;
      this.updateAverageResponseTime(processingTime);

      return {
        success: true,
        payment_id: payment.id,
        duplicate: false,
        processing_time_ms: processingTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({
        request_id: requestId,
        error: errorMessage,
        reference_number: paymentData.reference_number
      }, 'Error processing webhook payment');

      this.metrics.failed_requests++;

      return {
        success: false,
        duplicate: false,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  private async validateAuth(
    paymentData: WebhookPaymentData,
    signature?: string,
    authConfig?: WebhookAuthConfig
  ): Promise<boolean> {
    if (!authConfig || !authConfig.enabled) {
      return true;
    }

    if (!signature || !authConfig.secret) {
      return false;
    }

    try {
      // Create HMAC signature
      const payload = JSON.stringify(paymentData);
      const expectedSignature = crypto
        .createHmac('sha256', authConfig.secret)
        .update(payload)
        .digest('hex');

      // Compare signatures (timing-safe comparison)
      const providedSignature = signature.replace('sha256=', '');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error validating webhook signature');
      return false;
    }
  }

  private async checkRateLimit(
    clientKey: string,
    channel?: string,
    rateLimitConfig?: { max_requests: number; window_ms: number }
  ): Promise<RateLimitInfo> {
    if (!rateLimitConfig) {
      return {
        allowed: true,
        remaining: Infinity,
        reset_time: 0,
        total: Infinity,
      };
    }

    const key = `rate_limit:webhook:${channel || 'default'}:${clientKey}`;
    const windowStart = Math.floor(Date.now() / rateLimitConfig.window_ms) * rateLimitConfig.window_ms;
    const windowKey = `${key}:${windowStart}`;

    try {
      const current = await this.redisClient.get(windowKey);
      const currentCount = current ? parseInt(current) : 0;

      if (currentCount >= rateLimitConfig.max_requests) {
        return {
          allowed: false,
          remaining: 0,
          reset_time: windowStart + rateLimitConfig.window_ms,
          total: rateLimitConfig.max_requests,
        };
      }

      // Increment counter
      const multi = this.redisClient.multi();
      multi.incr(windowKey);
      multi.expire(windowKey, Math.ceil(rateLimitConfig.window_ms / 1000));
      await multi.exec();

      return {
        allowed: true,
        remaining: rateLimitConfig.max_requests - currentCount - 1,
        reset_time: windowStart + rateLimitConfig.window_ms,
        total: rateLimitConfig.max_requests,
      };

    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        key: windowKey 
      }, 'Error checking rate limit');
      
      // On error, allow the request
      return {
        allowed: true,
        remaining: rateLimitConfig.max_requests,
        reset_time: windowStart + rateLimitConfig.window_ms,
        total: rateLimitConfig.max_requests,
      };
    }
  }

  private updateAverageResponseTime(processingTime: number): void {
    if (this.metrics.successful_requests === 1) {
      this.metrics.average_response_time = processingTime;
    } else {
      // Calculate rolling average
      const totalRequests = this.metrics.successful_requests;
      this.metrics.average_response_time = 
        ((this.metrics.average_response_time * (totalRequests - 1)) + processingTime) / totalRequests;
    }
  }

  getMetrics(): WebhookMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      duplicate_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
    };
  }

  async getTodayStats(): Promise<{
    requests_today: number;
    success_rate: number;
    duplicate_rate: number;
    average_response_time: number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = await this.paymentModel.getTodayStats();

    const success_rate = this.metrics.total_requests > 0 
      ? (this.metrics.successful_requests / this.metrics.total_requests) * 100 
      : 0;

    const duplicate_rate = this.metrics.total_requests > 0 
      ? (this.metrics.duplicate_requests / this.metrics.total_requests) * 100 
      : 0;

    return {
      requests_today: stats.webhook_payments,
      success_rate: Math.round(success_rate * 100) / 100,
      duplicate_rate: Math.round(duplicate_rate * 100) / 100,
      average_response_time: Math.round(this.metrics.average_response_time * 100) / 100,
    };
  }
}