/**
 * Workflow Service Swagger/OpenAPI configuration
 */

// Workflow service schemas
export const workflowServiceSchemas = {
  Agent: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] },
      role: { type: 'string' },
      skills: { 
        type: 'array',
        items: { type: 'string' }
      },
      maxCaseLoad: { type: 'integer' },
      currentCaseLoad: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Case: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      cif: { type: 'string' },
      loanAccountNumber: { type: 'string' },
      status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      assignedAgentId: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      closedAt: { type: 'string', format: 'date-time' },
      actions: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/CaseAction'
        }
      }
    }
  },
  CaseAction: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      caseId: { type: 'string', format: 'uuid' },
      agentId: { type: 'string', format: 'uuid' },
      actionType: { type: 'string', enum: ['CALL', 'SMS', 'EMAIL', 'VISIT', 'PAYMENT', 'NOTE', 'STATUS_CHANGE'] },
      actionDetails: { type: 'object' },
      outcome: { type: 'string' },
      notes: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Assignment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      caseId: { type: 'string', format: 'uuid' },
      agentId: { type: 'string', format: 'uuid' },
      assignedBy: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'] },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      dueDate: { type: 'string', format: 'date-time' },
      notes: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer' },
      pageSize: { type: 'integer' },
      totalPages: { type: 'integer' },
      totalItems: { type: 'integer' }
    }
  }
};

// Workflow service tags
export const workflowServiceTags = [
  {
    name: 'Agents',
    description: 'Collection agent management endpoints',
  },
  {
    name: 'Cases',
    description: 'Collection case management endpoints',
  },
  {
    name: 'Actions',
    description: 'Case action management endpoints',
  },
  {
    name: 'Assignments',
    description: 'Case assignment management endpoints',
  }
];

// Workflow service paths
export const workflowServicePaths = {
  '/api/workflow/agents': {
    get: {
      tags: ['Agents'],
      summary: 'Get all agents',
      description: 'Retrieves a list of all collection agents',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE']
          },
          description: 'Filter by agent status'
        },
        {
          name: 'role',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Filter by agent role'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Page number'
        },
        {
          name: 'pageSize',
          in: 'query',
          schema: {
            type: 'integer',
            default: 10,
            maximum: 100
          },
          description: 'Page size'
        }
      ],
      responses: {
        '200': {
          description: 'Agents retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      agents: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Agent'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Agents retrieved successfully' }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Agents'],
      summary: 'Create a new agent',
      description: 'Creates a new collection agent',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'name', 'email', 'role'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string' },
                skills: { 
                  type: 'array',
                  items: { type: 'string' }
                },
                maxCaseLoad: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Agent created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Agent' },
                  message: { type: 'string', example: 'Agent created successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/agents/{id}': {
    get: {
      tags: ['Agents'],
      summary: 'Get agent by ID',
      description: 'Retrieves an agent by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Agent ID'
        }
      ],
      responses: {
        '200': {
          description: 'Agent retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Agent' },
                  message: { type: 'string', example: 'Agent retrieved successfully' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Agent not found'
        }
      }
    }
  },
  '/api/workflow/cases/customer/{cif}': {
    get: {
      tags: ['Cases'],
      summary: 'Get customer case history',
      description: 'Retrieves case history for a customer',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'cif',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Customer CIF number'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Page number'
        },
        {
          name: 'pageSize',
          in: 'query',
          schema: {
            type: 'integer',
            default: 10,
            maximum: 100
          },
          description: 'Page size'
        }
      ],
      responses: {
        '200': {
          description: 'Customer case history retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      cases: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Case'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Customer case history retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/cases/status/{cif}': {
    get: {
      tags: ['Cases'],
      summary: 'Get customer case status',
      description: 'Retrieves current case status for a customer',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'cif',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Customer CIF number'
        }
      ],
      responses: {
        '200': {
          description: 'Customer case status retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      caseStatus: {
                        type: 'string',
                        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
                      },
                      activeCases: {
                        type: 'integer'
                      },
                      lastActivity: {
                        type: 'string',
                        format: 'date-time'
                      }
                    }
                  },
                  message: { type: 'string', example: 'Customer case status retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/cases': {
    post: {
      tags: ['Cases'],
      summary: 'Record case action',
      description: 'Records an action for a collection case',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['cif', 'actionType'],
              properties: {
                cif: { type: 'string' },
                loanAccountNumber: { type: 'string' },
                actionType: { 
                  type: 'string', 
                  enum: ['CALL', 'SMS', 'EMAIL', 'VISIT', 'PAYMENT', 'NOTE', 'STATUS_CHANGE'] 
                },
                actionDetails: { type: 'object' },
                outcome: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Case action recorded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/CaseAction' },
                  message: { type: 'string', example: 'Case action recorded successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/actions/{id}': {
    get: {
      tags: ['Actions'],
      summary: 'Get action by ID',
      description: 'Retrieves a case action by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Action ID'
        }
      ],
      responses: {
        '200': {
          description: 'Action retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/CaseAction' },
                  message: { type: 'string', example: 'Action retrieved successfully' }
                }
              }
            }
          }
        },
        '404': {
          description: 'Action not found'
        }
      }
    }
  },
  '/api/workflow/assignments': {
    get: {
      tags: ['Assignments'],
      summary: 'Get assignments',
      description: 'Retrieves assignments based on criteria',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'agentId',
          in: 'query',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filter by agent ID'
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED']
          },
          description: 'Filter by assignment status'
        },
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Page number'
        },
        {
          name: 'pageSize',
          in: 'query',
          schema: {
            type: 'integer',
            default: 10,
            maximum: 100
          },
          description: 'Page size'
        }
      ],
      responses: {
        '200': {
          description: 'Assignments retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      assignments: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Assignment'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Assignments retrieved successfully' }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Assignments'],
      summary: 'Create assignment',
      description: 'Creates a new case assignment',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['caseId', 'agentId'],
              properties: {
                caseId: { type: 'string', format: 'uuid' },
                agentId: { type: 'string', format: 'uuid' },
                priority: { 
                  type: 'string', 
                  enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                  default: 'MEDIUM'
                },
                dueDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Assignment created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Assignment' },
                  message: { type: 'string', example: 'Assignment created successfully' }
                }
              }
            }
          }
        }
      }
    }
  }
};