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
              required: ['cif'],
              properties: {
                cif: { type: 'string' },
                actionDate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' },
                customerStatus: { type: 'string' },
                collateralStatus: { type: 'string' },
                processingStateStatus: { type: 'string' },
                lendingViolationStatus: { type: 'string' },
                recoveryAbilityStatus: { type: 'string' }
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
  '/api/workflow/actions/{id}/result': {
    put: {
      tags: ['Actions'],
      summary: 'Update action result',
      description: 'Updates the result of a case action',
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['actionResult'],
              properties: {
                actionResult: {
                  type: 'string',
                  enum: ['SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE', 'NO_RESPONSE', 'RESCHEDULED']
                },
                notes: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Action result updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/CaseAction' },
                  message: { type: 'string', example: 'Action result updated successfully' }
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
  },
  '/api/workflow/actions': {
    post: {
      tags: ['Actions'],
      summary: 'Record a new action',
      description: 'Records a new action for a customer or loan',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['cif', 'loanAccountNumber', 'type', 'subtype', 'actionResult'],
              properties: {
                cif: { type: 'string' },
                loanAccountNumber: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['CALL', 'SMS', 'EMAIL', 'VISIT', 'PAYMENT', 'NOTE']
                },
                subtype: { type: 'string' },
                actionResult: {
                  type: 'string',
                  enum: ['SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE', 'NO_RESPONSE', 'RESCHEDULED']
                },
                actionDate: { type: 'string', format: 'date-time' },
                fUpdate: { type: 'string', format: 'date-time' },
                notes: { type: 'string' },
                callTraceId: { type: 'string' },
                visitLocation: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    address: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Action recorded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/CaseAction' },
                  message: { type: 'string', example: 'Action recorded successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/actions/customer/{cif}': {
    get: {
      tags: ['Actions'],
      summary: 'Get customer actions',
      description: 'Retrieves actions for a customer',
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
          name: 'type',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['CALL', 'SMS', 'EMAIL', 'VISIT', 'PAYMENT', 'NOTE']
          },
          description: 'Filter by action type'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter by start date'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter by end date'
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
          description: 'Customer actions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      actions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/CaseAction'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Customer actions retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/actions/loan/{accountNumber}': {
    get: {
      tags: ['Actions'],
      summary: 'Get loan actions',
      description: 'Retrieves actions for a loan account',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'accountNumber',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Loan account number'
        },
        {
          name: 'type',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['CALL', 'SMS', 'EMAIL', 'VISIT', 'PAYMENT', 'NOTE']
          },
          description: 'Filter by action type'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter by start date'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter by end date'
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
          description: 'Loan actions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      actions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/CaseAction'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Loan actions retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/assignments/agent/{agentId}': {
    get: {
      tags: ['Assignments'],
      summary: 'Get agent assignments',
      description: 'Retrieves assignments for a specific agent',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Agent ID'
        },
        {
          name: 'cif',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Filter by customer CIF'
        },
        {
          name: 'isCurrent',
          in: 'query',
          schema: {
            type: 'boolean'
          },
          description: 'Filter by current assignments'
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
          description: 'Agent assignments retrieved successfully',
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
                  message: { type: 'string', example: 'Agent assignments retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/assignments/history/{cif}': {
    get: {
      tags: ['Assignments'],
      summary: 'Get assignment history',
      description: 'Retrieves assignment history for a customer',
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
          description: 'Assignment history retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      history: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Assignment'
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Assignment history retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/agents/{id}/performance': {
    get: {
      tags: ['Agents'],
      summary: 'Get agent performance metrics',
      description: 'Retrieves performance metrics for an agent',
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
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'Start date for performance period'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date'
          },
          description: 'End date for performance period'
        }
      ],
      responses: {
        '200': {
          description: 'Agent performance retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      agentId: { type: 'string', format: 'uuid' },
                      agentName: { type: 'string' },
                      period: {
                        type: 'object',
                        properties: {
                          startDate: { type: 'string', format: 'date' },
                          endDate: { type: 'string', format: 'date' }
                        }
                      },
                      metrics: {
                        type: 'object',
                        properties: {
                          totalActions: { type: 'integer' },
                          successfulActions: { type: 'integer' },
                          callsPlaced: { type: 'integer' },
                          callsConnected: { type: 'integer' },
                          visitsCompleted: { type: 'integer' },
                          paymentsCollected: { type: 'integer' },
                          totalAmountCollected: { type: 'number' },
                          averageCallDuration: { type: 'integer' },
                          successRate: { type: 'number' }
                        }
                      }
                    }
                  },
                  message: { type: 'string', example: 'Agent performance retrieved successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/agents/by-user/{userId}': {
    get: {
      tags: ['Agents'],
      summary: 'Get agent by user ID',
      description: 'Retrieves agent information by user ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'User ID'
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
        }
      }
    }
  },
  '/api/workflow/agents/link-user': {
    post: {
      tags: ['Agents'],
      summary: 'Link agent to user',
      description: 'Links an agent to a user account',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['agentId', 'userId'],
              properties: {
                agentId: { type: 'string', format: 'uuid' },
                userId: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Agent linked to user successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Agent' },
                  message: { type: 'string', example: 'Agent linked to user successfully' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/workflow/assignments/{id}': {
    put: {
      tags: ['Assignments'],
      summary: 'Update assignment',
      description: 'Updates an existing assignment',
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
          description: 'Assignment ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                assignedCallAgentId: { type: 'string', format: 'uuid' },
                assignedFieldAgentId: { type: 'string', format: 'uuid' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Assignment updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Assignment' },
                  message: { type: 'string', example: 'Assignment updated successfully' }
                }
              }
            }
          }
        }
      }
    }
  }
};