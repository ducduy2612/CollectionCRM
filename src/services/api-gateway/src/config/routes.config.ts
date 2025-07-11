import { ProxyConfig } from '../utils/proxy.utils';

/**
 * Rate limit configurations for specific routes
 */
export const rateLimitConfigs = {
  auth: {
    login: {
      max: 10,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'auth:login:'
    },
    tokenRefresh: {
      max: 20,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'auth:token:'
    },
    passwordReset: {
      max: 5,
      windowSizeInSeconds: 300, // 5 minutes
      prefix: 'auth:password:'
    }
  },
  bank: {
    customerSearch: {
      max: 60,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'bank:customer:search:'
    },
    syncRun: {
      max: 5,
      windowSizeInSeconds: 300, // 5 minutes
      prefix: 'bank:sync:run:'
    }
  },
  workflow: {
    caseCreate: {
      max: 20,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'workflow:case:create:'
    },
    actionRecord: {
      max: 60,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'workflow:action:record:'
    },
    documentUpload: {
      max: 20,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'workflow:document:upload:'
    },
    documentDownload: {
      max: 50,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'workflow:document:download:'
    }
  },
  campaign: {
    campaignCreate: {
      max: 10,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'campaign:create:'
    },
    campaignUpdate: {
      max: 20,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'campaign:update:'
    },
    customFieldCreate: {
      max: 5,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'campaign:customfield:'
    }
  },
  payment: {
    webhookProcess: {
      max: 100,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'payment:webhook:'
    },
    jobExecution: {
      max: 5,
      windowSizeInSeconds: 300, // 5 minutes
      prefix: 'payment:job:'
    },
    cacheOperation: {
      max: 30,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'payment:cache:'
    },
    paymentQueries: {
      max: 50,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'payment:queries:'
    }
  }
};

/**
 * Service route configurations
 */
export const serviceRoutes: Record<string, ProxyConfig> = {
  auth: {
    path: '/api/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    pathRewrite: { '^/api/auth': '/api/v1/auth' },
    timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT || '60000', 10),
    serviceName: 'Authentication Service',
    routes: {
      login: '/login',
      logout: '/logout',
      refreshToken: '/token/refresh',
      validateToken: '/token/validate',
      passwordReset: '/password/reset',
      passwordChange: '/password/change',
      users: '/users',
      roles: '/roles',
      health: '/health'
    },
    requiresAuth: {
      all: true,
      except: ['/login', '/token/refresh', '/token/validate', '/password/reset', '/health']
    }
  },
  bank: {
    path: '/api/bank',
    target: process.env.BANK_SERVICE_URL || 'http://bank-sync-service:3002',
    pathRewrite: { '^/api/bank': '/api/v1/bank-sync' },
    timeout: parseInt(process.env.BANK_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Bank Sync Service',
    routes: {
      customers: '/customers',
      customerById: '/customers/:cif',
      customerLoans: '/customers/:cif/loans',
      customerCollaterals: '/customers/:cif/collaterals',
      loans: '/loans',
      loanById: '/loans/:accountNumber',
      collaterals: '/collaterals',
      collateralById: '/collaterals/:collateralNumber',
      phoneTypes: '/phone-types',
      addressTypes: '/address-types',
      relationshipTypes: '/relationship-types',
      syncStatus: '/sync/status',
      syncRun: '/sync/run',
      health: '/health'
    },
    requiresAuth: {
      all: true,
      except: ['/health', '/health/check']
    }
  },
  payment: {
    path: '/api/payment',
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
    pathRewrite: { '^/api/payment': '/api/v1/payment' },
    timeout: parseInt(process.env.PAYMENT_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Payment Service',
    routes: {
      // Monitoring routes (/api/v1/payment/monitoring)
      health: '/monitoring/health',
      ready: '/monitoring/ready',
      metrics: '/monitoring/metrics',
      stats: '/monitoring/stats',
      jobsStatus: '/monitoring/jobs/status',
      partitions: '/monitoring/partitions',
      runStagingIngestion: '/monitoring/jobs/staging-ingestion/run',
      runPartitionMaintenance: '/monitoring/jobs/partition-maintenance/run',
      runCacheCleanup: '/monitoring/jobs/cache-cleanup/run',
      warmCache: '/monitoring/cache/warm',
      clearCache: '/monitoring/cache/clear',
      paymentsByCif: '/payments/cif/:cif',
      // Webhook routes (/api/v1/payment/webhook)
      webhook: '/webhook',
      webhookChannel: '/webhook/:channel',
      webhookStats: '/webhook/stats',
      duplicateCheck: '/webhook/duplicate/:reference_number',
      paymentByReference: '/webhook/payment/:reference_number'
    },
    requiresAuth: {
      all: true,
      except: ['/monitoring/health', '/monitoring/ready', '/webhook', '/webhook/:channel']
    }
  },
  workflow: {
    path: '/api/workflow',
    target: process.env.WORKFLOW_SERVICE_URL || 'http://workflow-service:3003',
    pathRewrite: { '^/api/workflow': '/api/v1/workflow' },
    timeout: parseInt(process.env.WORKFLOW_SERVICE_TIMEOUT || '300000', 10),
    serviceName: 'Workflow Service',
    routes: {
      agents: '/agents',
      agentById: '/agents/:id',
      cases: '/cases',
      customerCases: '/cases/customer/:cif',
      customerCaseStatus: '/cases/status/:cif',
      actions: '/actions',
      actionById: '/actions/:id',
      assignments: '/assignments',
      assignmentById: '/assignments/:id',
      bulkAssignments: '/assignments/bulk',
      batchStatus: '/assignments/bulk/:batchId/status',
      documents: '/documents',
      documentUpload: '/documents/upload',
      documentsByCustomer: '/documents/customer/:cif',
      documentsByLoan: '/documents/loan/:loanAccountNumber',
      documentDownload: '/documents/:id/download',
      documentPresignedUrl: '/documents/:id/presigned-url',
      documentById: '/documents/:id',
      health: '/health'
    },
    requiresAuth: {
      all: true,
      except: ['/health']
    }
  },
  campaign: {
    path: '/api/campaigns',
    target: process.env.CAMPAIGN_SERVICE_URL || 'http://campaign-engine:3004',
    pathRewrite: { '^/api/campaigns': '/api/v1/campaigns' },
    timeout: parseInt(process.env.CAMPAIGN_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Campaign Engine Service',
    routes: {
      groups: '/groups',
      groupById: '/groups/:id',
      campaigns: '/',
      campaignById: '/:id',
      campaignConditions: '/:id/conditions',
      campaignContactRules: '/:id/contact-rules',
      customFields: '/config/custom-fields',
      dataSources: '/config/data-sources',
      operators: '/config/operators',
      contactTypes: '/config/contact-types',
      relatedPartyTypes: '/config/related-party-types',
      processingConfig: '/config/processing',
      processingTrigger: '/processing/trigger',
      processingRuns: '/processing/runs',
      processingRunById: '/processing/runs/:id',
      processingRunResults: '/processing/runs/:id/results',
      processingRunStatistics: '/processing/runs/:id/statistics',
      processingRunErrors: '/processing/runs/:id/errors',
      processingAssignments: '/results/:campaignResultId/assignments',
      processingAssignmentSearch: '/processing/assignments/search',
      health: '/health'
    },
    requiresAuth: {
      all: true,
      except: ['/health']
    }
  }
};

/**
 * Get service route configuration by name
 * @param name - Service name
 */
export function getServiceRoute(name: string): ProxyConfig | undefined {
  return serviceRoutes[name];
}

/**
 * Get all service routes
 */
export function getAllServiceRoutes(): ProxyConfig[] {
  return Object.values(serviceRoutes);
}