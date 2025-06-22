import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import pino from 'pino';
import { PaymentService } from '@/services/PaymentService';
import { JobManager } from '@/jobs/JobManager';
import { register } from 'prom-client';

export class MonitoringController {
  private paymentService: PaymentService;
  private jobManager: JobManager;
  private logger: pino.Logger;

  constructor(
    paymentService: PaymentService,
    jobManager: JobManager,
    logger: pino.Logger
  ) {
    this.paymentService = paymentService;
    this.jobManager = jobManager;
    this.logger = logger;
  }

  // Health check endpoint
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.paymentService.getHealthCheck();

      const statusCode = health.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error in health check');

      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Readiness check endpoint
  readinessCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await this.paymentService.getHealthCheck();
      const jobsHealth = await this.jobManager.getJobsHealth();

      const isReady = health.status === 'healthy' && 
                     health.checks.database === 'ok' && 
                     health.checks.redis === 'ok';

      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        success: isReady,
        data: {
          ready: isReady,
          health: health.status,
          database: health.checks.database,
          redis: health.checks.redis,
          kafka: health.checks.kafka,
          jobs: jobsHealth.overall_health,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error in readiness check');

      res.status(503).json({
        success: false,
        ready: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Prometheus metrics endpoint
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const metrics = await register.metrics();
      res.set('Content-Type', register.contentType);
      res.end(metrics);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error getting metrics');

      res.status(500).json({
        success: false,
        error: 'Failed to get metrics',
        message: errorMessage,
      });
    }
  };

  // Payment service statistics
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.paymentService.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error getting stats');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Jobs status and health
  getJobsStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const [status, health] = await Promise.all([
        this.jobManager.getJobsStatus(),
        this.jobManager.getJobsHealth(),
      ]);

      res.json({
        success: true,
        data: {
          status,
          health,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error getting jobs status');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Partition information
  getPartitionInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const partitionInfo = await this.jobManager.getPartitionInfo();

      res.json({
        success: true,
        data: partitionInfo,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error getting partition info');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Manual job execution endpoints
  runStagingIngestion = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Manual staging ingestion triggered');
      
      // Run asynchronously and return immediately
      this.jobManager.runStagingIngestionOnce().catch(error => {
        this.logger.error({ error }, 'Manual staging ingestion failed');
      });

      res.json({
        success: true,
        message: 'Staging ingestion job triggered',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error triggering staging ingestion');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  runPartitionMaintenance = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Manual partition maintenance triggered');
      
      // Run asynchronously and return immediately
      this.jobManager.runPartitionMaintenanceOnce().catch(error => {
        this.logger.error({ error }, 'Manual partition maintenance failed');
      });

      res.json({
        success: true,
        message: 'Partition maintenance job triggered',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error triggering partition maintenance');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  runCacheCleanup = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Manual cache cleanup triggered');
      
      // Run asynchronously and return immediately
      this.jobManager.runCacheCleanupOnce().catch(error => {
        this.logger.error({ error }, 'Manual cache cleanup failed');
      });

      res.json({
        success: true,
        message: 'Cache cleanup job triggered',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error triggering cache cleanup');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Cache management endpoints
  warmCache = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    try {
      const limit = parseInt(req.query.limit as string) || 10000;
      
      this.logger.info({ limit }, 'Manual cache warming triggered');
      
      await this.paymentService.warmCache(limit);

      res.json({
        success: true,
        message: 'Cache warming completed',
        limit,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error warming cache');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  clearCache = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Manual cache clear triggered');
      
      await this.jobManager.clearAllCaches();

      res.json({
        success: true,
        message: 'All caches cleared',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ error: errorMessage }, 'Error clearing cache');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Validation middleware for cache warming
  static validateCacheWarm = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100000 })
      .withMessage('Limit must be an integer between 1 and 100000'),
  ];

  // Get payment queries with pagination
  static validatePaymentQueries = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be an integer between 1 and 1000'),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
  ];

  // Get payments by loan account
  getPaymentsByLoanAccount = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { loan_account_number } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!loan_account_number) {
      res.status(400).json({
        success: false,
        error: 'Loan account number is required',
      });
      return;
    }

    try {
      const payments = await this.paymentService.getPaymentsByLoanAccount(
        loan_account_number,
        limit,
        offset
      );

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            limit,
            offset,
            count: payments.length,
          },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ 
        error: errorMessage, 
        loan_account_number 
      }, 'Error getting payments by loan account');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };

  // Get payment summary for loan account
  getPaymentSummary = async (req: Request, res: Response): Promise<void> => {
    const { loan_account_number } = req.params;

    if (!loan_account_number) {
      res.status(400).json({
        success: false,
        error: 'Loan account number is required',
      });
      return;
    }

    try {
      const summary = await this.paymentService.getPaymentSummary(loan_account_number);

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ 
        error: errorMessage, 
        loan_account_number 
      }, 'Error getting payment summary');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };
}