import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getRedisClient, closeAllRedisClients } from 'collection-crm-common';
import db from './config/database';
import { initializeKafka, shutdownKafka } from './kafka';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

const apiBasePath = '/api/v1/auth';

// Health check endpoint
app.get(`${apiBasePath}/health`, async (req: express.Request, res: express.Response) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check Redis connection
    const redisClient = await getRedisClient('health-check');
    await redisClient.ping();
    
    res.status(200).json({
      status: 'ok',
      database: 'connected test',
      redis: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use(`${apiBasePath}`, authRoutes);
app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/roles`, roleRoutes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Not Found',
    errors: [{ code: 'NOT_FOUND', message: 'The requested resource was not found' }]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    data: null,
    message: 'Internal Server Error',
    errors: [{
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    }]
  });
});

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('Database connection established');
    
    // Initialize Kafka
    await initializeKafka();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Authentication Service running on port ${PORT}`);
      console.log(`API base path: ${apiBasePath}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connection
        await db.destroy();
        console.log('Database connection closed');
        
        // Close all Redis connections
        await closeAllRedisClients();
        console.log('Redis connections closed');
        
        // Close Kafka connections
        await shutdownKafka();
        
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Initialize the application
initializeApp();

export default app;