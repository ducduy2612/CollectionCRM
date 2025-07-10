import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import db from './config/database';
import { campaignCache } from './services/cache.service';
import { KafkaService } from './services/kafka.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', async (_req, res) => {
  res.json({
    status: 'OK',
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/campaigns/health', async (_req, res) => {
  const healthChecks = {
    database: false,
    cache: false,
    kafka: false,
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString()
  };

  try {
    await db.raw('SELECT 1');
    healthChecks.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
  }

  try {
    await campaignCache.get('health-check');
    healthChecks.cache = true;
  } catch (error) {
    logger.error('Cache health check failed:', error);
  }

  try {
    const kafkaService = KafkaService.getInstance();
    healthChecks.kafka = kafkaService.isHealthy();
  } catch (error) {
    logger.error('Kafka health check failed:', error);
  }

  const isHealthy = healthChecks.database && healthChecks.cache && healthChecks.kafka;
  const status = isHealthy ? 200 : 503;

  res.status(status).json({
    success: isHealthy,
    data: healthChecks,
    message: isHealthy ? 'Service is healthy' : 'Service health check failed'
  });
});

// Routes
import { campaignRoutes } from './routes/campaign.routes';
import { processingRoutes } from './routes/processing.routes';
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/campaigns/processing', processingRoutes);

// Error handling middleware
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    data: null,
    message: error.message || 'Internal server error',
    errors: [{
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred'
    }]
  });
});

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    logger.info('Database connected');

    // Test cache connection
    await campaignCache.get('startup-test');
    logger.info('Cache service connected');

    // Initialize Kafka service with retry
    const kafkaService = KafkaService.getInstance();
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempting to connect to Kafka (attempt ${attempt}/${maxRetries})`);
        await kafkaService.connect();
        logger.info('Kafka service connected');
        break;
      } catch (error) {
        logger.error(`Failed to connect to Kafka (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt === maxRetries) {
          logger.error('Max Kafka retries reached - continuing without Kafka');
          break;
        }
        
        logger.info(`Retrying Kafka connection in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`${env.SERVICE_NAME} service started on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(async () => {
        try {
          // Disconnect Kafka
          const kafkaService = KafkaService.getInstance();
          await kafkaService.disconnect();
          logger.info('Kafka disconnected');
          
          // Close database connection
          await db.destroy();
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    // Also log to console for debugging
    console.error('Failed to start server - Full error:', error);
    process.exit(1);
  }
}

startServer();