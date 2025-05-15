/**
 * Auth Service Swagger/OpenAPI configuration
 */

// Auth service schemas
export const authServiceSchemas = {
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
      updatedAt: { type: 'string', format: 'date-time' },
      lastLogin: { type: 'string', format: 'date-time' }
    }
  },
  UserCreate: {
    type: 'object',
    required: ['username', 'email', 'password', 'role'],
    properties: {
      username: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', format: 'password' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      role: { type: 'string' }
    }
  },
  UserUpdate: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      role: { type: 'string' }
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
  RoleCreate: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            resource: { type: 'string' },
            action: { type: 'string' }
          },
          required: ['resource', 'action']
        }
      }
    }
  },
  RoleUpdate: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      permissions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            resource: { type: 'string' },
            action: { type: 'string' }
          },
          required: ['resource', 'action']
        }
      }
    }
  },
  Session: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
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
      },
      createdAt: { type: 'string', format: 'date-time' },
      lastActivityAt: { type: 'string', format: 'date-time' },
      expiresAt: { type: 'string', format: 'date-time' }
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
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' }
    }
  },
  ValidateTokenRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  PasswordResetRequest: {
    type: 'object',
    required: ['username', 'email'],
    properties: {
      username: { type: 'string' },
      email: { type: 'string', format: 'email' }
    }
  },
  PasswordChangeRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword', 'confirmPassword'],
    properties: {
      currentPassword: { type: 'string', format: 'password' },
      newPassword: { type: 'string', format: 'password' },
      confirmPassword: { type: 'string', format: 'password' }
    }
  },
  AssignRoleRequest: {
    type: 'object',
    required: ['userIds'],
    properties: {
      userIds: { type: 'array', items: { type: 'string' } }
    }
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: { type: 'object' },
      message: { type: 'string' },
      errors: { type: 'array', items: { type: 'object' }, example: [] }
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
};

// Auth service tags
export const authServiceTags = [
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
  }
];
// Auth service paths
export const authServicePaths = {
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
              $ref: '#/components/schemas/RefreshTokenRequest'
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
  },
  '/api/auth/token/validate': {
    post: {
      tags: ['Auth'],
      summary: 'Validate authentication token',
      description: 'Validates a JWT token and returns user information',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidateTokenRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Token is valid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean', example: true },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          username: { type: 'string' },
                          roles: { type: 'array', items: { type: 'string' } },
                          permissions: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Token is valid' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '401': {
          description: 'Token is invalid',
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
  '/api/auth/password/reset': {
    post: {
      tags: ['Auth'],
      summary: 'Request password reset',
      description: 'Requests a password reset for a user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PasswordResetRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Password reset requested successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      resetRequested: { type: 'boolean', example: true },
                      resetTokenExpiry: { type: 'string', format: 'date-time' }
                    }
                  },
                  message: { type: 'string', example: 'Password reset requested successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
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
  '/api/auth/password/change': {
    post: {
      tags: ['Auth'],
      summary: 'Change password',
      description: 'Changes a user\'s password',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/PasswordChangeRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Password changed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      passwordChanged: { type: 'boolean', example: true }
                    }
                  },
                  message: { type: 'string', example: 'Password changed successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Password change failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
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
  }
};
// User management paths
export const userManagementPaths = {
  '/api/auth/users': {
    get: {
      tags: ['Users'],
      summary: 'List users',
      description: 'Retrieves a list of users with optional filtering',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'username',
          in: 'query',
          description: 'Filter by username (partial match)',
          schema: { type: 'string' }
        },
        {
          name: 'email',
          in: 'query',
          description: 'Filter by email (partial match)',
          schema: { type: 'string' }
        },
        {
          name: 'role',
          in: 'query',
          description: 'Filter by role',
          schema: { type: 'string' }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filter by active status',
          schema: { type: 'boolean' }
        },
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1 }
        },
        {
          name: 'pageSize',
          in: 'query',
          description: 'Page size (max: 100)',
          schema: { type: 'integer', default: 10, maximum: 100 }
        }
      ],
      responses: {
        '200': {
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          pageSize: { type: 'integer' },
                          totalPages: { type: 'integer' },
                          totalItems: { type: 'integer' }
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Users retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Users'],
      summary: 'Create user',
      description: 'Creates a new user',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserCreate'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                  message: { type: 'string', example: 'User created successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Username or email already exists',
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
  '/api/auth/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Retrieves a user by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'User retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                  message: { type: 'string', example: 'User retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Users'],
      summary: 'Update user',
      description: 'Updates an existing user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserUpdate'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'User updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                  message: { type: 'string', example: 'User updated successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Email already exists',
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
  '/api/auth/users/{id}/activate': {
    put: {
      tags: ['Users'],
      summary: 'Activate user',
      description: 'Activates a deactivated user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'User activated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      isActive: { type: 'boolean', example: true },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  },
                  message: { type: 'string', example: 'User activated successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
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
  '/api/auth/users/{id}/deactivate': {
    put: {
      tags: ['Users'],
      summary: 'Deactivate user',
      description: 'Deactivates an active user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'User deactivated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      username: { type: 'string' },
                      isActive: { type: 'boolean', example: false },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  },
                  message: { type: 'string', example: 'User deactivated successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
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
  '/api/auth/users/{id}/sessions': {
    get: {
      tags: ['Users'],
      summary: 'Get user sessions',
      description: 'Retrieves active sessions for a user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'User sessions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      sessions: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Session' }
                      }
                    }
                  },
                  message: { type: 'string', example: 'User sessions retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Users'],
      summary: 'Terminate user sessions',
      description: 'Terminates all active sessions for a user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'User sessions terminated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      terminatedSessions: { type: 'integer' }
                    }
                  },
                  message: { type: 'string', example: 'User sessions terminated successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'User not found',
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
};
// Role management paths
export const roleManagementPaths = {
  '/api/auth/roles': {
    get: {
      tags: ['Roles'],
      summary: 'List roles',
      description: 'Retrieves a list of roles',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Roles retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      roles: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Role' }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Roles retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Roles'],
      summary: 'Create role',
      description: 'Creates a new role',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RoleCreate'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Role created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Role' },
                  message: { type: 'string', example: 'Role created successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '409': {
          description: 'Role name already exists',
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
  '/api/auth/roles/{id}': {
    get: {
      tags: ['Roles'],
      summary: 'Get role by ID',
      description: 'Retrieves a role by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Role ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Role retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Role' },
                  message: { type: 'string', example: 'Role retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Role not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Roles'],
      summary: 'Update role',
      description: 'Updates an existing role',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Role ID',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RoleUpdate'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Role updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Role' },
                  message: { type: 'string', example: 'Role updated successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Role not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Roles'],
      summary: 'Delete role',
      description: 'Deletes a role',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Role ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Role deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      deleted: { type: 'boolean', example: true }
                    }
                  },
                  message: { type: 'string', example: 'Role deleted successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Role not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '400': {
          description: 'Role is in use and cannot be deleted',
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
  '/api/auth/roles/{id}/users': {
    get: {
      tags: ['Roles'],
      summary: 'Get users with role',
      description: 'Retrieves users assigned to a specific role',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Role ID',
          schema: { type: 'string' }
        },
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1 }
        },
        {
          name: 'pageSize',
          in: 'query',
          description: 'Page size (max: 100)',
          schema: { type: 'integer', default: 10, maximum: 100 }
        }
      ],
      responses: {
        '200': {
          description: 'Users with role retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            username: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            isActive: { type: 'boolean' }
                          }
                        }
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          page: { type: 'integer' },
                          pageSize: { type: 'integer' },
                          totalPages: { type: 'integer' },
                          totalItems: { type: 'integer' }
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Users with role retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Role not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Roles'],
      summary: 'Assign role to users',
      description: 'Assigns a role to multiple users',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Role ID',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AssignRoleRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Role assigned to users successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      roleId: { type: 'string' },
                      assignedUsers: { type: 'integer' }
                    }
                  },
                  message: { type: 'string', example: 'Role assigned to users successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
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
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        '404': {
          description: 'Role not found',
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
};