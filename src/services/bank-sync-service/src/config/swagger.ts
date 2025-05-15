import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * OpenAPI/Swagger configuration for the Bank Synchronization Microservice
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bank Synchronization Microservice API',
      version: '1.0.0',
      description: 'API documentation for the Bank Synchronization Microservice',
      contact: {
        name: 'CollectionCRM Support',
        email: 'support@collectioncrm.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://collectioncrm.com/license'
      }
    },
    servers: [
      {
        url: '/api/v1/bank-sync',
        description: 'Bank Synchronization Microservice API'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Error code'
            },
            message: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        CommonResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            errors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Error'
              },
              description: 'List of errors if any'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

const specs = swaggerJsdoc(swaggerOptions);

/**
 * Initialize Swagger documentation
 * @param app Express application
 */
export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

export default swaggerOptions;