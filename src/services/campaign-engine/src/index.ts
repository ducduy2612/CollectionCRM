import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import db from './config/database';
import { campaignCache } from './services/cache.service';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', async (req, res) => {
  res.json({
    status: 'OK',
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/campaigns/health', async (req, res) => {
  const healthChecks = {
    database: false,
    cache: false,
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

  const isHealthy = healthChecks.database && healthChecks.cache;
  const status = isHealthy ? 200 : 503;

  res.status(status).json({
    success: isHealthy,
    data: healthChecks,
    message: isHealthy ? 'Service is healthy' : 'Service health check failed'
  });
});

// Routes
import { campaignRoutes } from './routes/campaign.routes';
app.use('/api/v1/campaigns', campaignRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

    const server = app.listen(env.PORT, () => {
      logger.info(`${env.SERVICE_NAME} service started on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(async () => {
        try {
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
    process.exit(1);
  }
}

startServer();