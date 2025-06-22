import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { getRedisClient, closeAllRedisClients } from 'collection-crm-common';
import db from './config/database';
import { initializeKafka, shutdownKafka } from './kafka';

// Import routes
import paymentRoutes from './routes/payment.routes';
import paymentMethodRoutes from './routes/payment-method.routes';
import webhookRoutes from './routes/webhook.routes';
import reportRoutes from './routes/report.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

const apiBasePath = '/api/v1/payments';

// Health check endpoints
// Simple health check for Docker/K8s
app.get('/health', async (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Payment Service',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check at API prefix
app.get(`${apiBasePath}/health`, async (_req: express.Request, res: express.Response) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check Redis connection
    const redisClient = await getRedisClient('health-check');
    await redisClient.ping();
    
    res.status(200).json({
      status: 'ok',
      database: 'connected',
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
app.use(`${apiBasePath}`, paymentRoutes);
app.use(`${apiBasePath}/methods`, paymentMethodRoutes);
app.use(`${apiBasePath}/webhooks`, webhookRoutes);
app.use(`${apiBasePath}/reports`, reportRoutes);

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
      console.log(`Payment Service running on port ${PORT}`);
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