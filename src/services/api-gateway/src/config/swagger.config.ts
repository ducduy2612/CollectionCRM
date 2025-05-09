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
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              roles: { type: 'array', items: { type: 'string' } },
              permissions: { type: 'array', items: { type: 'string' } },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          Role: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          LoginRequest: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string' },
              password: { type: 'string', format: 'password' },
              deviceInfo: {
                type: 'object',
                properties: {
                  deviceId: { type: 'string' },
                  deviceType: { type: 'string' },
                  browser: { type: 'string' },
                  operatingSystem: { type: 'string' },
                  ipAddress: { type: 'string' },
                  userAgent: { type: 'string' }
                }
              }
            }
          },
          LoginResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  user: { $ref: '#/components/schemas/User' },
                  token: { type: 'string' },
                  refreshToken: { type: 'string' },
                  expiresAt: { type: 'string', format: 'date-time' }
                }
              },
              message: { type: 'string' },
              errors: { type: 'array', items: { type: 'object' } }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              data: { type: 'null', example: null },
              message: { type: 'string' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    code: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        },
      },
      tags: [
        {
          name: 'Auth',
          description: 'Authentication and authorization endpoints',
        },
        {
          name: 'Users',
          description: 'User management endpoints',
        },
        {
          name: 'Roles',
          description: 'Role management endpoints',
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
      paths: {
        '/api/auth/login': {
          post: {
            tags: ['Auth'],
            summary: 'Login to the system',
            description: 'Authenticates a user and returns a JWT token',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Login successful',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/LoginResponse'
                    }
                  }
                }
              },
              '401': {
                description: 'Authentication failed',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          }
        },
        '/api/auth/logout': {
          post: {
            tags: ['Auth'],
            summary: 'Logout from the system',
            description: 'Logs out a user and invalidates their session',
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'Logout successful',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                          type: 'object',
                          properties: {
                            sessionTerminated: { type: 'boolean', example: true }
                          }
                        },
                        message: { type: 'string', example: 'Logout successful' },
                        errors: { type: 'array', items: { type: 'object' }, example: [] }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/api/auth/token/refresh': {
          post: {
            tags: ['Auth'],
            summary: 'Refresh authentication token',
            description: 'Refreshes an expired JWT token using a refresh token',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                      refreshToken: { type: 'string' }
                    }
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Token refreshed successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string' },
                            refreshToken: { type: 'string' },
                            expiresAt: { type: 'string', format: 'date-time' }
                          }
                        },
                        message: { type: 'string', example: 'Token refreshed successfully' },
                        errors: { type: 'array', items: { type: 'object' }, example: [] }
                      }
                    }
                  }
                }
              },
              '401': {
                description: 'Token refresh failed',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse'
                    }
                  }
                }
              }
            }
          }
        }
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