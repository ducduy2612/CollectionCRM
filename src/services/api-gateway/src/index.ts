import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { redisRateLimiter, routeRateLimiter } from './middleware/rate-limiter';
import { getRedisClient } from 'collection-crm-common';
import { createServiceProxy } from './utils/proxy.utils';
import { serviceRoutes, rateLimitConfigs } from './config/routes.config';
import { logger, requestLogger } from './utils/logger.utils';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { getCorsOptions } from './config/cors.config';
import { createSwaggerSpec } from './config/swagger.config';
import { jwtAuth } from './middleware/jwt-auth.middleware';
import { methodOverride } from './middleware/method-override.middleware';
import { validateLicenseOnStartup, licenseWarningMiddleware, getLicenseStatus, licenseInfoMiddleware } from './middleware/license.middleware';

// Load environment variables
dotenv.config();

// Validate license on startup
validateLicenseOnStartup();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy configuration (important when behind nginx/load balancer)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', true);
  logger.info('Trust proxy enabled - will use X-Forwarded-* headers');
}

// Basic middleware
app.use(getCorsOptions());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger());

// Method override middleware (for cloud workstation CORS compatibility)
app.use(methodOverride);

// JWT authentication middleware
app.use(jwtAuth);

// License warning middleware (adds headers if license is expiring)
app.use(licenseWarningMiddleware);

// Redis-based rate limiting
app.use(redisRateLimiter({
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  windowSizeInSeconds: Math.floor(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 1000),
  includeUserId: true,
  includeRoute: true
}));

// Swagger documentation
const swaggerSpec = createSwaggerSpec(`http://localhost:${PORT}`);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// License status endpoint (admin only)
app.get('/license/status', licenseInfoMiddleware, getLicenseStatus);

// Redis health check endpoint
app.get('/health/redis', async (req, res) => {
  try {
    // Get a Redis client from the common module
    const redisClient = await getRedisClient('health-check');
    
    // Ping Redis to check connectivity
    const pingResult = await redisClient.ping();
    
    if (pingResult === 'PONG') {
      // Redis is responding correctly
      res.status(200).json({
        status: 'ok',
        redis: {
          connected: true,
          message: 'Redis connection successful'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Redis responded but with unexpected result
      res.status(500).json({
        status: 'error',
        redis: {
          connected: false,
          message: 'Redis connection error: Unexpected response'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // Redis connection failed
    logger.error('Redis health check failed:', error);
    res.status(503).json({
      status: 'error',
      redis: {
        connected: false,
        message: 'Redis connection failed',
        error: process.env.NODE_ENV === 'production' ? 'Service unavailable' : (error as Error).message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Service proxies using the enhanced proxy utility
Object.entries(serviceRoutes).forEach(([name, config]) => {
  logger.info(`Setting up proxy for ${config.serviceName} at ${config.path}`);
  
  // Add specific rate limiting for auth endpoints
  if (name === 'auth' && config.routes) {
    // Login rate limiting
    app.use(`${config.path}/login`, routeRateLimiter(rateLimitConfigs.auth.login));
    
    // Token refresh rate limiting
    app.use(`${config.path}/token/refresh`, routeRateLimiter(rateLimitConfigs.auth.tokenRefresh));
    
    // Password reset rate limiting
    app.use(`${config.path}/password/reset`, routeRateLimiter(rateLimitConfigs.auth.passwordReset));
  }
  
  // Add specific rate limiting for bank-sync endpoints
  if (name === 'bank' && config.routes) {
    // Customer search rate limiting
    app.use(`${config.path}/customers`, routeRateLimiter(rateLimitConfigs.bank.customerSearch));
    
    // Sync run rate limiting
    app.use(`${config.path}/sync/run`, routeRateLimiter(rateLimitConfigs.bank.syncRun));
  }
  
  // Add specific rate limiting for workflow endpoints
  if (name === 'workflow' && config.routes) {
    // Case creation rate limiting
    app.use(`${config.path}/cases`, routeRateLimiter(rateLimitConfigs.workflow.caseCreate));
    
    // Action recording rate limiting
    app.use(`${config.path}/actions`, routeRateLimiter(rateLimitConfigs.workflow.actionRecord));
    
  }
  
  // Add specific rate limiting for campaign endpoints
  if (name === 'campaign' && config.routes) {
    // Campaign creation rate limiting
    app.use(`${config.path}`, routeRateLimiter(rateLimitConfigs.campaign.campaignCreate));
    
    // Campaign update rate limiting
    app.use(`${config.path}/:id`, routeRateLimiter(rateLimitConfigs.campaign.campaignUpdate));
    
    // Custom field creation rate limiting
    app.use(`${config.path}/config/custom-fields`, routeRateLimiter(rateLimitConfigs.campaign.customFieldCreate));
  }
  
  // Set up the proxy
  app.use(config.path, createServiceProxy(config));
});

// Add 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Export app for testing
export default app;