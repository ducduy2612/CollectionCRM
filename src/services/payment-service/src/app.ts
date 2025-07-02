import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import pino from 'pino';
import { createDatabaseConfig, createDatabaseConnection } from './config/database';
import { getRedisClient } from 'collection-crm-common/redis';
import { PaymentService, PaymentServiceConfig } from './services/PaymentService';
import { JobManager, JobManagerConfig } from './jobs/JobManager';
import { WebhookController } from './controllers/WebhookController';
import { MonitoringController } from './controllers/MonitoringController';
import { PaymentController } from './controllers/PaymentController';
import { createWebhookRoutes } from './routes/webhook.routes';
import { createMonitoringRoutes } from './routes/monitoring.routes';
import { createPaymentRoutes } from './routes/payment.routes';
import { PaymentEventProducer, KafkaConfig } from './kafka/producer';
import { collectDefaultMetrics, register } from 'prom-client';

export class PaymentServiceApp {
  private app: express.Application;
  private logger: pino.Logger;
  private server: any;
  
  // Dependencies
  private knex!: any;
  private redisClient!: any;
  private paymentService!: PaymentService;
  private jobManager!: JobManager;
  private kafkaProducer!: PaymentEventProducer;
  
  // Controllers
  private webhookController!: WebhookController;
  private monitoringController!: MonitoringController;
  private paymentController!: PaymentController;

  constructor() {
    this.app = express();
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      timestamp: true,
    });

    // Initialize Prometheus metrics collection
    if (process.env.ENABLE_METRICS === 'true') {
      collectDefaultMetrics({ register });
    }
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Payment Service');

      // Initialize dependencies
      await this.initializeDependencies();
      
      // Initialize services
      await this.initializeServices();
      
      // Initialize controllers
      this.initializeControllers();
      
      // Setup Express middleware and routes
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();

      this.logger.info('Payment Service initialized successfully');

    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Payment Service');
      throw error;
    }
  }

  private async initializeDependencies(): Promise<void> {
    // Database connection
    const dbConfig = createDatabaseConfig();
    this.knex = await createDatabaseConnection(dbConfig);
    
    // Redis connection
    this.redisClient = await getRedisClient('payment-service', {
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    // Kafka producer
    const kafkaConfig: KafkaConfig = {
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
      topic: process.env.KAFKA_TOPIC || 'payment.events',
      batchSize: parseInt(process.env.KAFKA_BATCH_SIZE || '100'),
      compression: process.env.KAFKA_COMPRESSION as any || 'gzip',
      retries: parseInt(process.env.KAFKA_RETRIES || '5'),
      acks: parseInt(process.env.KAFKA_ACKS || '-1') as any,
      timeout: parseInt(process.env.KAFKA_TIMEOUT || '30000'),
    };

    this.kafkaProducer = new PaymentEventProducer(kafkaConfig, this.logger.child({ component: 'kafka' }));
    await this.kafkaProducer.connect();

    this.logger.info('Dependencies initialized');
  }

  private async initializeServices(): Promise<void> {
    // Payment Service configuration
    const paymentServiceConfig: PaymentServiceConfig = {
      staging: {
        batchSize: parseInt(process.env.STAGING_BATCH_SIZE || '1000'),
        maxRetries: parseInt(process.env.STAGING_MAX_RETRIES || '3'),
        retryDelayMs: parseInt(process.env.STAGING_RETRY_DELAY || '5000'),
        enableParallelProcessing: process.env.STAGING_PARALLEL === 'true',
        workerCount: parseInt(process.env.STAGING_WORKERS || '2'),
      },
      webhook: {
        timeout_ms: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000'),
        rate_limit: {
          enabled: process.env.WEBHOOK_RATE_LIMIT_ENABLED === 'true',
          max_requests: parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX || '1000'),
          window_ms: parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW || '60000'),
        },
        auth: {
          enabled: process.env.WEBHOOK_AUTH_ENABLED === 'true',
          ...(process.env.WEBHOOK_AUTH_SECRET && { secret: process.env.WEBHOOK_AUTH_SECRET }),
          ...(process.env.WEBHOOK_AUTH_HEADER && { header_name: process.env.WEBHOOK_AUTH_HEADER }),
          ...(process.env.WEBHOOK_IP_WHITELIST && { ip_whitelist: process.env.WEBHOOK_IP_WHITELIST.split(',') }),
        },
        channels: {
          // Channel-specific configurations would be loaded here
        },
      },
      deduplication: {
        memoryCache: {
          maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE || '10000'),
        },
        redis: {
          ttlSeconds: parseInt(process.env.REDIS_TTL_SECONDS || '86400'),
        },
      },
    };

    // Initialize Payment Service
    this.paymentService = new PaymentService(
      this.knex,
      this.redisClient,
      this.logger.child({ component: 'payment-service' }),
      paymentServiceConfig
    );

    await this.paymentService.initialize();

    // Job Manager configuration
    const jobManagerConfig: JobManagerConfig = {
      stagingIngestion: {
        schedule: process.env.STAGING_SCHEDULE || '*/30 * * * * *', // Every 30 seconds
        enabled: process.env.STAGING_JOB_ENABLED !== 'false',
        maxConsecutiveFailures: parseInt(process.env.STAGING_MAX_FAILURES || '5'),
        batchProcessingTimeout: parseInt(process.env.STAGING_TIMEOUT || '300000'), // 5 minutes
      },
      partitionMaintenance: {
        schedule: process.env.PARTITION_SCHEDULE || '0 2 * * *', // Daily at 2 AM
        enabled: process.env.PARTITION_JOB_ENABLED !== 'false',
        retentionMonths: parseInt(process.env.PARTITION_RETENTION_MONTHS || '12'),
        futureMonths: parseInt(process.env.PARTITION_FUTURE_MONTHS || '3'),
      },
      cacheCleanup: {
        schedule: process.env.CACHE_CLEANUP_SCHEDULE || '0 3 * * *', // Daily at 3 AM
        enabled: process.env.CACHE_CLEANUP_ENABLED !== 'false',
        referenceCacheRetentionDays: parseInt(process.env.REFERENCE_CACHE_TTL_DAYS || '90'),
        processLogRetentionDays: parseInt(process.env.PROCESS_LOG_TTL_DAYS || '30'),
        enableCacheWarming: process.env.ENABLE_CACHE_WARMING !== 'false',
        cacheWarmingLimit: parseInt(process.env.CACHE_WARMING_LIMIT || '10000'),
      },
    };

    // Initialize Job Manager
    this.jobManager = new JobManager(
      this.paymentService,
      this.knex,
      this.logger.child({ component: 'job-manager' }),
      jobManagerConfig
    );

    await this.jobManager.initialize();

    this.logger.info('Services initialized');
  }

  private initializeControllers(): void {
    this.webhookController = new WebhookController(
      this.paymentService,
      this.logger.child({ component: 'webhook-controller' })
    );

    this.monitoringController = new MonitoringController(
      this.paymentService,
      this.jobManager,
      this.logger.child({ component: 'monitoring-controller' })
    );

    this.paymentController = new PaymentController(
      this.paymentService,
      this.logger.child({ component: 'payment-controller' })
    );

    this.logger.info('Controllers initialized');
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          this.logger.info(message.trim(), 'HTTP Request');
        },
      },
    }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random()}`;
      res.setHeader('x-request-id', req.headers['x-request-id']);
      next();
    });

    this.logger.info('Middleware setup completed');
  }

  private setupRoutes(): void {
    // Health check (lightweight, no auth required)
    this.app.get('/health', this.monitoringController.healthCheck);

    // API routes
    this.app.use('/api/v1/payment/webhook', createWebhookRoutes(this.webhookController));
    this.app.use('/api/v1/payment/monitoring', createMonitoringRoutes(this.monitoringController));
    this.app.use('/api/v1/payment/payments', createPaymentRoutes(this.paymentController));

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        service: 'payment-service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });

    this.logger.info('Routes setup completed');
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const requestId = req.headers['x-request-id'];
      
      this.logger.error({
        error: error.message,
        stack: error.stack,
        request_id: requestId,
        method: req.method,
        url: req.originalUrl,
      }, 'Unhandled error');

      // Don't expose stack traces in production
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(error.status || 500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        request_id: requestId,
        ...(isDevelopment && { stack: error.stack }),
      });
    });

    this.logger.info('Error handling setup completed');
  }

  async start(): Promise<void> {
    const port = parseInt(process.env.PORT || '3004', 10);
    const host = process.env.HOST || '0.0.0.0';

    this.server = this.app.listen(port, host, () => {
      this.logger.info(`Payment Service started on ${host}:${port}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private async shutdown(): Promise<void> {
    this.logger.info('Received shutdown signal, starting graceful shutdown');

    try {
      // Stop accepting new requests
      if (this.server) {
        this.server.close();
      }

      // Shutdown services
      if (this.jobManager) {
        await this.jobManager.shutdown();
      }

      if (this.paymentService) {
        await this.paymentService.shutdown();
      }

      // Close connections
      if (this.kafkaProducer) {
        await this.kafkaProducer.disconnect();
      }

      if (this.redisClient) {
        await this.redisClient.quit();
      }

      if (this.knex) {
        await this.knex.destroy();
      }

      this.logger.info('Payment Service shutdown completed');
      process.exit(0);

    } catch (error) {
      this.logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new PaymentServiceApp();
  
  app.initialize()
    .then(() => app.start())
    .catch((error) => {
      console.error('Failed to start Payment Service:', error);
      process.exit(1);
    });
}

export default PaymentServiceApp;