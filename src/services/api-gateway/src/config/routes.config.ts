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
      max: 30,
      windowSizeInSeconds: 60, // 1 minute
      prefix: 'bank:customer:search:'
    },
    syncRun: {
      max: 5,
      windowSizeInSeconds: 300, // 5 minutes
      prefix: 'bank:sync:run:'
    }
  }
};

/**
 * Service route configurations
 */
export const serviceRoutes: Record<string, ProxyConfig> = {
  auth: {
    path: '/api/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
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
    target: process.env.BANK_SERVICE_URL || 'http://bank-sync-service:3000',
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
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
    pathRewrite: { '^/api/payment': '' },
    timeout: parseInt(process.env.PAYMENT_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Payment Service'
  },
  workflow: {
    path: '/api/workflow',
    target: process.env.WORKFLOW_SERVICE_URL || 'http://workflow-service:3000',
    pathRewrite: { '^/api/workflow': '' },
    timeout: parseInt(process.env.WORKFLOW_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Workflow Service'
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