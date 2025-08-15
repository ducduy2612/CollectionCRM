import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import {
  authServiceSchemas,
  authServiceTags,
  authServicePaths,
  userManagementPaths,
  roleManagementPaths
} from './swagger-auth-service';
import {
  bankServiceSchemas,
  bankServiceTags,
  bankServicePaths
} from './swagger-bank-service';
import {
  workflowServiceSchemas,
  workflowServiceTags,
  workflowServicePaths
} from './swagger-workflow-service';

/**
 * Swagger/OpenAPI configuration
 */
export function getSwaggerOptions(serverUrl: string) {
  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Collexis API',
        version: version || '1.0.0',
        description: 'Collexis API Documentation',
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
        schemas: {
          ...authServiceSchemas,
          ...bankServiceSchemas,
          ...workflowServiceSchemas
        },
      },
      tags: [
        ...authServiceTags,
        ...bankServiceTags,
        ...workflowServiceTags,
        {
          name: 'Payment',
          description: 'Payment processing endpoints',
        },
      ],
      paths: {
        ...authServicePaths,
        ...userManagementPaths,
        ...roleManagementPaths,
        ...bankServicePaths,
        ...workflowServicePaths
      },
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