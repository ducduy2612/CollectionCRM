import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppDataSource } from './config/data-source';
import { env } from './config/env.config';
import { logger } from './utils/logger';
import { AuditKafkaService } from './kafka/audit-kafka.service';
import auditRoutes from './routes/audit.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'audit-service',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use(env.API_PREFIX, auditRoutes);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ message: 'Unhandled error', error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize application
async function initialize() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // Initialize Kafka service
    const kafkaService = new AuditKafkaService();
    await kafkaService.initialize();
    logger.info('Kafka service initialized');

    // Start the server
    const server = app.listen(env.PORT, () => {
      logger.info(`Audit service listening on port ${env.PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      
      // Close server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close Kafka connections
      await kafkaService.disconnect();
      logger.info('Kafka connections closed');

      // Close database connection
      await AppDataSource.destroy();
      logger.info('Database connection closed');

      process.exit(0);
    });

  } catch (error) {
    logger.error({ message: 'Failed to initialize audit service', error });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ message: 'Uncaught exception', error });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error({ message: 'Unhandled rejection', error });
  process.exit(1);
});

// Start the application
initialize();