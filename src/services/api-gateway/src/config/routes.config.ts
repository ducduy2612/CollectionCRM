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
  }
};

/**
 * Service route configurations
 */
export const serviceRoutes: Record<string, ProxyConfig> = {
  auth: {
    path: '/api/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
    pathRewrite: { '^/api/auth': '' },
    timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Authentication Service',
    routes: {
      login: '/login',
      logout: '/logout',
      refreshToken: '/token/refresh',
      validateToken: '/token/validate',
      passwordReset: '/password/reset',
      passwordChange: '/password/change',
      users: '/users',
      roles: '/roles'
    },
    requiresAuth: {
      all: true,
      except: ['/login', '/token/refresh', '/token/validate', '/password/reset']
    }
  },
  bank: {
    path: '/api/bank',
    target: process.env.BANK_SERVICE_URL || 'http://bank-sync-service:3000',
    pathRewrite: { '^/api/bank': '' },
    timeout: parseInt(process.env.BANK_SERVICE_TIMEOUT || '30000', 10),
    serviceName: 'Bank Sync Service'
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