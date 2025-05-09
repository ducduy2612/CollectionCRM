import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

/**
 * Swagger/OpenAPI configuration
 */
export function getSwaggerOptions(serverUrl: string) {
  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Collection CRM API',
        version: version || '1.0.0',
        description: 'Collection CRM API Documentation',
        contact: {
          name: 'API Support',
          email: 'support@collectioncrm.com',
        },
        license: {
          name: 'Private',
          url: 'https://collectioncrm.com/license',
        },
      },
      servers: [
        {
          url: serverUrl,
          description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          sessionAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sessionId',
          },
        },
      },
      tags: [
        {
          name: 'Auth',
          description: 'Authentication and authorization endpoints',
        },
        {
          name: 'Bank',
          description: 'Bank synchronization endpoints',
        },
        {
          name: 'Payment',
          description: 'Payment processing endpoints',
        },
        {
          name: 'Workflow',
          description: 'Collection workflow endpoints',
        },
      ],
    },
    apis: ['./src/routes/*.ts', './src/middleware/*.ts'],
  };
}

/**
 * Create Swagger specification
 * @param serverUrl - Server URL for Swagger documentation
 */
export function createSwaggerSpec(serverUrl: string): object {
  const options = getSwaggerOptions(serverUrl);
  return swaggerJSDoc(options);
}