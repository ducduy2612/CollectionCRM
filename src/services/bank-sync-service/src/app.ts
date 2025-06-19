import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.config';
import routes from './routes';
import { AppDataSource } from './config/data-source';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';

// Create Express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan(env.isDevelopment() ? 'dev' : 'combined')); // Request logging
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Health check routes (no auth required)
// Simple health check for Docker/K8s
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Bank Sync Service',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check at API prefix
app.get(`${env.API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Bank Sync Service',
    timestamp: new Date().toISOString(),
    database: {
      connected: AppDataSource.isInitialized
    }
  });
});

// API routes
app.use(env.API_PREFIX, routes);

// Error handling
app.use(notFoundHandler); // Handle 404 errors
app.use(errorHandler); // Handle all other errors

export default app;