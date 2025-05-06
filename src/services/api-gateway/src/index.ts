import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Collection CRM API',
      version: '1.0.0',
      description: 'Collection CRM API Documentation',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Service proxies
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '',
    },
  })
);

app.use(
  '/api/bank',
  createProxyMiddleware({
    target: process.env.BANK_SERVICE_URL || 'http://bank-sync-service:3000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/bank': '',
    },
  })
);

app.use(
  '/api/payment',
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/payment': '',
    },
  })
);

app.use(
  '/api/workflow',
  createProxyMiddleware({
    target: process.env.WORKFLOW_SERVICE_URL || 'http://workflow-service:3000',
    changeOrigin: true,
    pathRewrite: {
      '^/api/workflow': '',
    },
  })
);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;