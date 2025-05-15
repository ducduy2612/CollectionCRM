/**
 * Monitoring module for the Bank Synchronization Microservice
 * Exports all monitoring-related components
 */

// Export metrics components
export * from './metrics';

// Export alerts components
export * from './alerts';

import { metricsService as defaultMetricsService, MetricNames, MetricsService } from './metrics';
import { alertManager as defaultAlertManager, AlertManager, AlertSeverity, AlertStatus } from './alerts';
import { logger } from '../utils/logger';
import { ErrorType, OperationType, SourceSystemType } from '../errors';

/**
 * Monitoring service for centralized monitoring functionality
 */
export class MonitoringService {
  private metricsService: MetricsService;
  private alertManager: AlertManager;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private monitoringIntervalMs: number = 60000; // 1 minute

  /**
   * Create a new monitoring service
   * @param metricsService The metrics service to use
   * @param alertManager The alert manager to use
   */
  constructor(
    metricsService: MetricsService = defaultMetricsService,
    alertManager: AlertManager = defaultAlertManager
  ) {
    this.metricsService = metricsService;
    this.alertManager = alertManager;
  }

  /**
   * Start the monitoring service
   * @param intervalMs The monitoring interval in milliseconds
   */
  start(intervalMs: number = this.monitoringIntervalMs): void {
    if (this.monitoringInterval) {
      this.stop();
    }

    this.monitoringIntervalMs = intervalMs;
    
    logger.info(`Starting monitoring service with interval ${intervalMs}ms`);
    
    this.monitoringInterval = setInterval(() => {
      this.evaluateAlerts();
    }, intervalMs);
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      
      logger.info('Stopped monitoring service');
    }
  }

  /**
   * Evaluate all alert rules
   */
  evaluateAlerts(): void {
    try {
      const metrics = (this.metricsService as any).getMetrics?.() || [];
      const triggeredAlerts = this.alertManager.evaluateRules(metrics);
      
      if (triggeredAlerts.length > 0) {
        logger.info(`Triggered ${triggeredAlerts.length} alerts`, {
          alertCount: triggeredAlerts.length,
          alertIds: triggeredAlerts.map(alert => alert.id)
        });
      }
    } catch (error) {
      logger.error('Error evaluating alerts', error as Error);
    }
  }

  /**
   * Record an API request
   * @param method The HTTP method
   * @param path The request path
   * @param statusCode The response status code
   * @param durationMs The request duration in milliseconds
   */
  recordApiRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.metricsService.recordApiRequest(method, path, statusCode, durationMs);
  }

  /**
   * Record a sync operation
   * @param operation The sync operation
   * @param sourceSystem The source system
   * @param entityType The entity type
   * @param recordCount The number of records processed
   * @param durationMs The operation duration in milliseconds
   * @param success Whether the operation was successful
   */
  recordSyncOperation(
    operation: string,
    sourceSystem: string,
    entityType: string,
    recordCount: number,
    durationMs: number,
    success: boolean
  ): void {
    this.metricsService.recordSyncOperation(
      operation,
      sourceSystem,
      entityType,
      recordCount,
      durationMs,
      success
    );
  }

  /**
   * Record a database query
   * @param operation The database operation
   * @param entity The entity being queried
   * @param durationMs The query duration in milliseconds
   * @param success Whether the query was successful
   */
  recordDatabaseQuery(
    operation: string,
    entity: string,
    durationMs: number,
    success: boolean
  ): void {
    this.metricsService.recordDatabaseQuery(operation, entity, durationMs, success);
  }

  /**
   * Record an external service request
   * @param service The external service name
   * @param operation The operation being performed
   * @param durationMs The request duration in milliseconds
   * @param success Whether the request was successful
   */
  recordExternalRequest(
    service: string,
    operation: string,
    durationMs: number,
    success: boolean
  ): void {
    this.metricsService.recordExternalRequest(service, operation, durationMs, success);
  }

  /**
   * Record an error
   * @param error The error object
   * @param operationType The operation type
   * @param sourceSystem The source system
   */
  recordError(
    error: Error,
    operationType?: OperationType,
    sourceSystem?: SourceSystemType
  ): void {
    // Extract error type if available
    const errorType = 'type' in error ? (error as any).type as ErrorType : ErrorType.UNKNOWN;
    
    // Record the error in metrics
    this.metricsService.recordError(errorType, operationType, sourceSystem);
    
    // Record the error for alerting
    this.alertManager.recordError(error);
    
    // Log the error
    logger.error('Error recorded', error, {
      errorType,
      operationType,
      sourceSystem
    });
  }

  /**
   * Record a circuit breaker state change
   * @param name The circuit breaker name
   * @param state The new state
   */
  recordCircuitBreakerState(name: string, state: string): void {
    this.metricsService.recordCircuitBreakerState(name, state);
  }

  /**
   * Record a retry attempt
   * @param operation The operation being retried
   * @param attempt The retry attempt number
   * @param success Whether the retry was successful
   */
  recordRetry(operation: string, attempt: number, success: boolean): void {
    this.metricsService.recordRetry(operation, attempt, success);
  }

  /**
   * Get active alerts
   * @returns Active alerts
   */
  getActiveAlerts(): any[] {
    return this.alertManager.getActiveAlerts();
  }

  /**
   * Acknowledge an alert
   * @param alertId The alert ID
   * @param userId The user ID acknowledging the alert
   * @returns True if the alert was acknowledged, false otherwise
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    return this.alertManager.acknowledgeAlert(alertId, userId);
  }

  /**
   * Resolve an alert
   * @param alertId The alert ID
   * @param userId The user ID resolving the alert
   * @returns True if the alert was resolved, false otherwise
   */
  resolveAlert(alertId: string, userId: string): boolean {
    return this.alertManager.resolveAlert(alertId, userId);
  }
}

// Create and export a default monitoring service instance
export const monitoringService = new MonitoringService();

// Create Express middleware for request monitoring
export function requestMonitoringMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Record response metrics when the response is finished
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      monitoringService.recordApiRequest(
        req.method,
        req.path,
        res.statusCode,
        durationMs
      );
    });
    
    next();
  };
}

// Create Express error monitoring middleware
export function errorMonitoringMiddleware() {
  return (err: Error, req: any, res: any, next: any) => {
    // Record the error
    monitoringService.recordError(err, OperationType.API_CALL);
    
    // Continue to the next error handler
    next(err);
  };
}