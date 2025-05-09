# API Gateway Service

The API Gateway serves as the entry point for all client requests to the Collection CRM microservices. It handles routing, authentication, rate limiting, and provides a unified API interface.

## Features

- **Routing and Proxying**: Routes requests to appropriate microservices
- **Authentication**: Validates user sessions and tokens
- **Rate Limiting**: Prevents abuse with Redis-based rate limiting
- **API Documentation**: Swagger/OpenAPI documentation
- **Error Handling**: Consistent error responses
- **Logging**: Structured logging with Pino
- **Health Checks**: Endpoints to verify service health

## Architecture

The API Gateway is built with Express.js and follows a modular architecture:

```
src/
├── config/             # Configuration files
│   ├── cors.config.ts  # CORS configuration
│   ├── routes.config.ts # Service route definitions
│   └── swagger.config.ts # API documentation config
├── middleware/         # Express middleware
│   ├── error-handler.middleware.ts # Error handling
│   └── rate-limiter.ts # Rate limiting
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── logger.utils.ts # Logging utilities
│   └── proxy.utils.ts  # Proxy configuration
└── index.ts            # Main application entry point
```

## Service Proxies

The API Gateway proxies requests to the following microservices:

- **Authentication Service**: `/api/auth/*`
- **Bank Sync Service**: `/api/bank/*`
- **Payment Service**: `/api/payment/*`
- **Workflow Service**: `/api/workflow/*`

## Getting Started

### Prerequisites

- Node.js 16+
- Redis server
- Access to microservices

### Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Adjust the variables as needed:

```
# API Gateway Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3000
BANK_SERVICE_URL=http://bank-sync-service:3000
PAYMENT_SERVICE_URL=http://payment-service:3000
WORKFLOW_SERVICE_URL=http://workflow-service:3000
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Documentation

When the service is running, access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Health Checks

- **API Gateway Health**: `GET /health`
- **Redis Health**: `GET /health/redis`