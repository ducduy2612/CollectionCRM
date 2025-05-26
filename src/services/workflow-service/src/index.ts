import 'reflect-metadata';
import app from './app';
import { env } from './config/env.config';
import { AppDataSource } from './config/data-source';
import { logger } from './utils/logger';
import { initializeKafka, shutdownKafka } from './kafka';

// Start the server
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    
    logger.info('Connected to database');
    
    // Initialize Kafka
    await initializeKafka();
    logger.info('Kafka initialized successfully');
    
    // Start Express server
    const PORT = parseInt(env.PORT, 10);
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API available at ${env.API_PREFIX}`);
    });
  } catch (error) {
    logger.error({ error }, 'Error starting server');
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error({ error: err }, 'Unhandled promise rejection');
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  // Shutdown Kafka connections
  try {
    await shutdownKafka();
    logger.info('Kafka connections closed');
  } catch (error) {
    logger.error({ error }, 'Error shutting down Kafka connections');
  }
  
  // Close database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
  
  process.exit(0);
});

// Start the server
startServer();