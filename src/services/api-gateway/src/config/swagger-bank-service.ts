/**
 * Bank Sync Service Swagger/OpenAPI configuration
 */

// Bank service schemas
export const bankServiceSchemas = {
  Customer: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      createdBy: { type: 'string' },
      updatedBy: { type: 'string' },
      sourceSystem: { type: 'string' },
      lastSyncedAt: { type: 'string', format: 'date-time', nullable: true },
      isEditable: { type: 'boolean' },
      cif: { type: 'string' },
      type: { type: 'string', enum: ['INDIVIDUAL', 'CORPORATE'] },
      name: { type: 'string' },
      dateOfBirth: { type: 'string', format: 'date' },
      nationalId: { type: 'string' },
      gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
      companyName: { type: 'string', nullable: true },
      registrationNumber: { type: 'string', nullable: true },
      taxId: { type: 'string', nullable: true },
      segment: { type: 'string' },
      status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
      phones: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'string' },
            updatedBy: { type: 'string' },
            number: { type: 'string' },
            type: { type: 'string', enum: ['MOBILE', 'HOME', 'WORK', 'OTHER'] },
            isPrimary: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            verificationDate: { type: 'string', format: 'date-time', nullable: true },
            cif: { type: 'string' }
          }
        }
      },
      addresses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'string' },
            updatedBy: { type: 'string' },
            type: { type: 'string', enum: ['HOME', 'WORK', 'OTHER'] },
            addressLine1: { type: 'string' },
            addressLine2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            district: { type: 'string' },
            country: { type: 'string' },
            isPrimary: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            verificationDate: { type: 'string', format: 'date-time', nullable: true },
            cif: { type: 'string' }
          }
        }
      },
      emails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            createdBy: { type: 'string' },
            updatedBy: { type: 'string' },
            address: { type: 'string', format: 'email' },
            isPrimary: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            verificationDate: { type: 'string', format: 'date-time', nullable: true },
            cif: { type: 'string' }
          }
        }
      },
      loans: {
        type: 'array',
        items: { $ref: '#/components/schemas/Loan' }
      },
      collaterals: {
        type: 'array',
        items: { $ref: '#/components/schemas/Collateral' }
      },
      referenceCustomers: {
        type: 'array',
        items: { $ref: '#/components/schemas/ReferenceCustomer' }
      }
    }
  },
  Loan: {
    type: 'object',
    properties: {
      accountNumber: { type: 'string' },
      cif: { type: 'string' },
      productType: { type: 'string' },
      originalAmount: { type: 'number', format: 'float' },
      currency: { type: 'string' },
      disbursementDate: { type: 'string', format: 'date' },
      maturityDate: { type: 'string', format: 'date' },
      interestRate: { type: 'number', format: 'float' },
      term: { type: 'integer' },
      paymentFrequency: { type: 'string', enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] },
      limit: { type: 'number', format: 'float' },
      outstanding: { type: 'number', format: 'float' },
      remainingAmount: { type: 'number', format: 'float' },
      dueAmount: { type: 'number', format: 'float' },
      minPay: { type: 'number', format: 'float' },
      nextPaymentDate: { type: 'string', format: 'date' },
      dpd: { type: 'integer' },
      delinquencyStatus: { type: 'string', enum: ['CURRENT', 'DELINQUENT', 'DEFAULT'] },
      status: { type: 'string', enum: ['OPEN', 'CLOSED'] },
      sourceSystem: { type: 'string' },
      createdBy: { type: 'string' },
      updatedBy: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      isEditable: { type: 'boolean' },
      lastSyncedAt: { type: 'string', format: 'date-time' },
      dueSegmentation: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            dueDate: { type: 'string', format: 'date' },
            principalAmount: { type: 'number', format: 'float' },
            interestAmount: { type: 'number', format: 'float' },
            feesAmount: { type: 'number', format: 'float' },
            penaltyAmount: { type: 'number', format: 'float' }
          }
        }
      },
      collaterals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            collateralNumber: { type: 'string' },
            type: { type: 'string' },
            description: { type: 'string' },
            value: { type: 'number', format: 'float' }
          }
        }
      }
    }
  },
  Collateral: {
    type: 'object',
    properties: {
      collateralNumber: { type: 'string' },
      cif: { type: 'string' },
      type: { type: 'string', enum: ['REAL_ESTATE', 'VEHICLE', 'DEPOSIT', 'STOCK', 'OTHER'] },
      description: { type: 'string' },
      value: { type: 'number', format: 'float' },
      valuationDate: { type: 'string', format: 'date' },
      propertyType: { type: 'string' },
      address: { type: 'string' },
      size: { type: 'number', format: 'float' },
      titleNumber: { type: 'string' },
      sourceSystem: { type: 'string' },
      createdBy: { type: 'string' },
      updatedBy: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      isEditable: { type: 'boolean' },
      lastSyncedAt: { type: 'string', format: 'date-time' },
      associatedLoans: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            accountNumber: { type: 'string' },
            productType: { type: 'string' },
            outstanding: { type: 'number', format: 'float' }
          }
        }
      }
    }
  },
  SyncStatus: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      sourceSystem: { type: 'string' },
      entityType: { type: 'string' },
      startTime: { type: 'string', format: 'date-time' },
      endTime: { type: 'string', format: 'date-time' },
      status: { type: 'string', enum: ['INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
      recordsProcessed: { type: 'integer' },
      recordsSucceeded: { type: 'integer' },
      recordsFailed: { type: 'integer' },
      lastSyncedAt: { type: 'string', format: 'date-time' }
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
  },
  CommonResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
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
  },
  ReferenceCustomer: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      cif: { type: 'string' },
      referenceCif: { type: 'string' },
      relationshipType: { type: 'string' },
      name: { type: 'string' },
      contactInfo: {
        type: 'object',
        properties: {
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string' }
        }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  }
};

// Define ReferenceCustomer schema (keeping for backward compatibility)
export const referenceCustomerSchema = {
  ReferenceCustomer: bankServiceSchemas.ReferenceCustomer
};

// Bank service tags
export const bankServiceTags = [
  {
    name: 'Bank',
    description: 'Bank synchronization endpoints',
  },
  {
    name: 'Customers',
    description: 'Customer management endpoints',
  },
  {
    name: 'Loans',
    description: 'Loan management endpoints',
  },
  {
    name: 'Collaterals',
    description: 'Collateral management endpoints',
  },
  {
    name: 'Sync',
    description: 'Synchronization management endpoints',
  }
];

// Bank service paths
export const bankServicePaths = {
  '/api/bank/customers/{cif}': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer by CIF',
      description: 'Retrieves a customer by CIF number',
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
          description: 'Customer retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Customer' },
                  message: { type: 'string', example: 'Customer retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '404': {
          description: 'Customer not found',
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
  '/api/bank/customers': {
    get: {
      tags: ['Customers'],
      summary: 'Search customers',
      description: 'Searches for customers based on criteria',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'name',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Customer name (partial match)'
        },
        {
          name: 'nationalId',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'National ID number (exact match)'
        },
        {
          name: 'companyName',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Company name (partial match)'
        },
        {
          name: 'registrationNumber',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Registration number (exact match)'
        },
        {
          name: 'segment',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Customer segment'
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE']
          },
          description: 'Customer status'
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
          description: 'Customers retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      customers: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            cif: { type: 'string' },
                            type: { type: 'string' },
                            name: { type: 'string' },
                            nationalId: { type: 'string' },
                            segment: { type: 'string' },
                            status: { type: 'string' }
                          }
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Customers retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/bank/customers/{cif}/loans': {
    get: {
      tags: ['Customers', 'Loans'],
      summary: 'Get customer loans',
      description: 'Retrieves loans associated with a customer',
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
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['OPEN', 'CLOSED']
          },
          description: 'Loan status'
        },
        {
          name: 'productType',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Loan product type'
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
          description: 'Customer loans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      loans: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Loan'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Customer loans retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '404': {
          description: 'Customer not found',
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
  '/api/bank/customers/{cif}/collaterals': {
    get: {
      tags: ['Customers', 'Collaterals'],
      summary: 'Get customer collaterals',
      description: 'Retrieves collaterals associated with a customer',
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
            type: 'string'
          },
          description: 'Collateral type'
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
          description: 'Customer collaterals retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      collaterals: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Collateral'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Customer collaterals retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '404': {
          description: 'Customer not found',
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
  '/api/bank/loans/{accountNumber}': {
    get: {
      tags: ['Loans'],
      summary: 'Get loan by account number',
      description: 'Retrieves a loan by account number',
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
        }
      ],
      responses: {
        '200': {
          description: 'Loan retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Loan' },
                  message: { type: 'string', example: 'Loan retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '404': {
          description: 'Loan not found',
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
  '/api/bank/collaterals/{collateralNumber}': {
    get: {
      tags: ['Collaterals'],
      summary: 'Get collateral by number',
      description: 'Retrieves a collateral by collateral number',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'collateralNumber',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Collateral number'
        }
      ],
      responses: {
        '200': {
          description: 'Collateral retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Collateral' },
                  message: { type: 'string', example: 'Collateral retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '404': {
          description: 'Collateral not found',
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
  '/api/bank/sync/status': {
    get: {
      tags: ['Sync'],
      summary: 'Get synchronization status',
      description: 'Retrieves the status of synchronization operations',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'sourceSystem',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['T24', 'W4', 'OTHER']
          },
          description: 'Filter by source system'
        },
        {
          name: 'entityType',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['Customer', 'Loan', 'Collateral']
          },
          description: 'Filter by entity type'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter by start date (ISO 8601 format)'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter by end date (ISO 8601 format)'
        }
      ],
      responses: {
        '200': {
          description: 'Sync status retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      syncStatus: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/SyncStatus'
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Sync status retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/bank/sync/run': {
    post: {
      tags: ['Sync'],
      summary: 'Trigger synchronization',
      description: 'Triggers a synchronization operation',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sourceSystem', 'entityType'],
              properties: {
                sourceSystem: {
                  type: 'string',
                  enum: ['T24', 'W4', 'OTHER'],
                  description: 'Source system to sync from'
                },
                entityType: {
                  type: 'string',
                  enum: ['Customer', 'Loan', 'Collateral'],
                  description: 'Entity type to sync'
                },
                fullSync: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to perform a full sync or incremental sync'
                },
                syncOptions: {
                  type: 'object',
                  properties: {
                    batchSize: {
                      type: 'integer',
                      default: 1000,
                      description: 'Number of records to process in each batch'
                    },
                    priority: {
                      type: 'string',
                      enum: ['HIGH', 'MEDIUM', 'LOW'],
                      default: 'MEDIUM',
                      description: 'Priority of the sync job'
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Synchronization initiated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      syncJobId: { type: 'string' },
                      status: { type: 'string', enum: ['INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] },
                      estimatedCompletionTime: { type: 'string', format: 'date-time' }
                    }
                  },
                  message: { type: 'string', example: 'Synchronization initiated successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid request',
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
  '/api/bank/customers/{cif}/references': {
    get: {
      tags: ['Customers'],
      summary: 'Get customer references',
      description: 'Retrieves reference customers associated with a customer',
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
          description: 'Customer references retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      references: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            referenceCif: { type: 'string' },
                            relationshipType: { type: 'string' },
                            name: { type: 'string' },
                            contactInfo: {
                              type: 'object',
                              properties: {
                                phone: { type: 'string' },
                                email: { type: 'string' },
                                address: { type: 'string' }
                              }
                            }
                          }
                        }
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' }
                    }
                  },
                  message: { type: 'string', example: 'Customer references retrieved successfully' },
                  errors: { type: 'array', items: { type: 'object' }, example: [] }
                }
              }
            }
          }
        },
        '404': {
          description: 'Customer not found',
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