/**
 * Metrics collection for the Bank Synchronization Microservice
 * Collects performance and operational metrics for monitoring
 */

import { ErrorType, OperationType, SourceSystemType } from '../errors';
import { logger } from '../utils/logger';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

/**
 * Metric value type
 */
export type MetricValue = number;

/**
 * Metric tags type
 */
export type MetricTags = Record<string, string>;

/**
 * Metric data interface
 */
export interface MetricData {
  name: string;
  type: MetricType;
  value: MetricValue;
  timestamp: Date;
  tags?: MetricTags;
}

/**
 * Metrics collector interface
 */
export interface MetricsCollector {
  recordCounter(name: string, value: number, tags?: MetricTags): void;
  recordGauge(name: string, value: number, tags?: MetricTags): void;
  recordHistogram(name: string, value: number, tags?: MetricTags): void;
  recordTimer(name: string, durationMs: number, tags?: MetricTags): void;
}

/**
 * In-memory metrics storage
 */
class InMemoryMetricsStorage {
  private metrics: MetricData[] = [];
  private readonly maxSize: number = 1000;

  /**
   * Add a metric to the storage
   * @param metric The metric to add
   */
  addMetric(metric: MetricData): void {
    this.metrics.push(metric);
    
    // Trim the metrics array if it exceeds the maximum size
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
  }

  /**
   * Get all metrics
   * @returns All metrics
   */
  getMetrics(): MetricData[] {
    return this.metrics;
  }

  /**
   * Get metrics by name
   * @param name The metric name
   * @returns Metrics with the specified name
   */
  getMetricsByName(name: string): MetricData[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get metrics by type
   * @param type The metric type
   * @returns Metrics with the specified type
   */
  getMetricsByType(type: MetricType): MetricData[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  /**
   * Get metrics by tags
   * @param tags The metric tags
   * @returns Metrics with the specified tags
   */
  getMetricsByTags(tags: MetricTags): MetricData[] {
    return this.metrics.filter(metric => {
      if (!metric.tags) {
        return false;
      }
      
      return Object.entries(tags).every(([key, value]) => metric.tags?.[key] === value);
    });
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Default metrics collector implementation
 */
export class DefaultMetricsCollector implements MetricsCollector {
  private storage: InMemoryMetricsStorage;
  
  /**
   * Create a new metrics collector
   */
  constructor() {
    this.storage = new InMemoryMetricsStorage();
  }
  
  /**
   * Record a counter metric
   * @param name The metric name
   * @param value The metric value
   * @param tags Additional tags
   */
  recordCounter(name: string, value: number, tags?: MetricTags): void {
    this.recordMetric(name, MetricType.COUNTER, value, tags);
  }
  
  /**
   * Record a gauge metric
   * @param name The metric name
   * @param value The metric value
   * @param tags Additional tags
   */
  recordGauge(name: string, value: number, tags?: MetricTags): void {
    this.recordMetric(name, MetricType.GAUGE, value, tags);
  }
  
  /**
   * Record a histogram metric
   * @param name The metric name
   * @param value The metric value
   * @param tags Additional tags
   */
  recordHistogram(name: string, value: number, tags?: MetricTags): void {
    this.recordMetric(name, MetricType.HISTOGRAM, value, tags);
  }
  
  /**
   * Record a timer metric
   * @param name The metric name
   * @param durationMs The duration in milliseconds
   * @param tags Additional tags
   */
  recordTimer(name: string, durationMs: number, tags?: MetricTags): void {
    this.recordMetric(name, MetricType.HISTOGRAM, durationMs, { ...tags, unit: 'ms' });
  }
  
  /**
   * Record a metric
   * @param name The metric name
   * @param type The metric type
   * @param value The metric value
   * @param tags Additional tags
   */
  private recordMetric(name: string, type: MetricType, value: number, tags?: MetricTags): void {
    const metric: MetricData = {
      name,
      type,
      value,
      timestamp: new Date(),
      tags
    };
    
    this.storage.addMetric(metric);
    
    // Log the metric for debugging
    logger.debug(`Recorded metric: ${name} = ${value}`, { metric });
  }
  
  /**
   * Get all metrics
   * @returns All metrics
   */
  getMetrics(): MetricData[] {
    return this.storage.getMetrics();
  }
  
  /**
   * Get metrics by name
   * @param name The metric name
   * @returns Metrics with the specified name
   */
  getMetricsByName(name: string): MetricData[] {
    return this.storage.getMetricsByName(name);
  }
  
  /**
   * Get metrics by type
   * @param type The metric type
   * @returns Metrics with the specified type
   */
  getMetricsByType(type: MetricType): MetricData[] {
    return this.storage.getMetricsByType(type);
  }
  
  /**
   * Get metrics by tags
   * @param tags The metric tags
   * @returns Metrics with the specified tags
   */
  getMetricsByTags(tags: MetricTags): MetricData[] {
    return this.storage.getMetricsByTags(tags);
  }
}

/**
 * Predefined metrics for the Bank Synchronization Microservice
 */
export const MetricNames = {
  // API metrics
  API_REQUEST_COUNT: 'api.request.count',
  API_REQUEST_DURATION: 'api.request.duration',
  API_ERROR_COUNT: 'api.error.count',
  
  // Sync metrics
  SYNC_OPERATION_COUNT: 'sync.operation.count',
  SYNC_OPERATION_DURATION: 'sync.operation.duration',
  SYNC_RECORD_COUNT: 'sync.record.count',
  SYNC_ERROR_COUNT: 'sync.error.count',
  
  // Database metrics
  DB_QUERY_COUNT: 'db.query.count',
  DB_QUERY_DURATION: 'db.query.duration',
  DB_ERROR_COUNT: 'db.error.count',
  
  // External service metrics
  EXTERNAL_REQUEST_COUNT: 'external.request.count',
  EXTERNAL_REQUEST_DURATION: 'external.request.duration',
  EXTERNAL_ERROR_COUNT: 'external.error.count',
  
  // Circuit breaker metrics
  CIRCUIT_BREAKER_STATE: 'circuit_breaker.state',
  CIRCUIT_BREAKER_FAILURE_COUNT: 'circuit_breaker.failure.count',
  CIRCUIT_BREAKER_SUCCESS_COUNT: 'circuit_breaker.success.count',
  
  // Retry metrics
  RETRY_COUNT: 'retry.count',
  RETRY_SUCCESS_COUNT: 'retry.success.count',
  RETRY_FAILURE_COUNT: 'retry.failure.count',
  
  // Error metrics
  ERROR_COUNT: 'error.count',
  ERROR_TYPE_COUNT: 'error.type.count'
};

/**
 * Metrics service for recording application metrics
 */
export class MetricsService {
  private collector: MetricsCollector;
  
  /**
   * Create a new metrics service
   * @param collector The metrics collector to use
   */
  constructor(collector: MetricsCollector = new DefaultMetricsCollector()) {
    this.collector = collector;
  }
  
  /**
   * Record an API request
   * @param method The HTTP method
   * @param path The request path
   * @param statusCode The response status code
   * @param durationMs The request duration in milliseconds
   */
  recordApiRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const tags: MetricTags = {
      method,
      path,
      statusCode: statusCode.toString()
    };
    
    this.collector.recordCounter(MetricNames.API_REQUEST_COUNT, 1, tags);
    this.collector.recordTimer(MetricNames.API_REQUEST_DURATION, durationMs, tags);
    
    // Record error if status code is 4xx or 5xx
    if (statusCode >= 400) {
      this.collector.recordCounter(MetricNames.API_ERROR_COUNT, 1, {
        ...tags,
        errorType: statusCode >= 500 ? 'server' : 'client'
      });
    }
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
    const tags: MetricTags = {
      operation,
      sourceSystem,
      entityType,
      success: success.toString()
    };
    
    this.collector.recordCounter(MetricNames.SYNC_OPERATION_COUNT, 1, tags);
    this.collector.recordTimer(MetricNames.SYNC_OPERATION_DURATION, durationMs, tags);
    this.collector.recordCounter(MetricNames.SYNC_RECORD_COUNT, recordCount, tags);
    
    if (!success) {
      this.collector.recordCounter(MetricNames.SYNC_ERROR_COUNT, 1, tags);
    }
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
    const tags: MetricTags = {
      operation,
      entity,
      success: success.toString()
    };
    
    this.collector.recordCounter(MetricNames.DB_QUERY_COUNT, 1, tags);
    this.collector.recordTimer(MetricNames.DB_QUERY_DURATION, durationMs, tags);
    
    if (!success) {
      this.collector.recordCounter(MetricNames.DB_ERROR_COUNT, 1, tags);
    }
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
    const tags: MetricTags = {
      service,
      operation,
      success: success.toString()
    };
    
    this.collector.recordCounter(MetricNames.EXTERNAL_REQUEST_COUNT, 1, tags);
    this.collector.recordTimer(MetricNames.EXTERNAL_REQUEST_DURATION, durationMs, tags);
    
    if (!success) {
      this.collector.recordCounter(MetricNames.EXTERNAL_ERROR_COUNT, 1, tags);
    }
  }
  
  /**
   * Record a circuit breaker state change
   * @param name The circuit breaker name
   * @param state The new state
   */
  recordCircuitBreakerState(name: string, state: string): void {
    const tags: MetricTags = {
      name,
      state
    };
    
    // Use 0 for CLOSED, 1 for HALF_OPEN, 2 for OPEN
    const stateValue = state === 'CLOSED' ? 0 : state === 'HALF_OPEN' ? 1 : 2;
    
    this.collector.recordGauge(MetricNames.CIRCUIT_BREAKER_STATE, stateValue, tags);
  }
  
  /**
   * Record a circuit breaker failure
   * @param name The circuit breaker name
   */
  recordCircuitBreakerFailure(name: string): void {
    this.collector.recordCounter(MetricNames.CIRCUIT_BREAKER_FAILURE_COUNT, 1, { name });
  }
  
  /**
   * Record a circuit breaker success
   * @param name The circuit breaker name
   */
  recordCircuitBreakerSuccess(name: string): void {
    this.collector.recordCounter(MetricNames.CIRCUIT_BREAKER_SUCCESS_COUNT, 1, { name });
  }
  
  /**
   * Record a retry attempt
   * @param operation The operation being retried
   * @param attempt The retry attempt number
   * @param success Whether the retry was successful
   */
  recordRetry(operation: string, attempt: number, success: boolean): void {
    const tags: MetricTags = {
      operation,
      attempt: attempt.toString(),
      success: success.toString()
    };
    
    this.collector.recordCounter(MetricNames.RETRY_COUNT, 1, tags);
    
    if (success) {
      this.collector.recordCounter(MetricNames.RETRY_SUCCESS_COUNT, 1, tags);
    } else {
      this.collector.recordCounter(MetricNames.RETRY_FAILURE_COUNT, 1, tags);
    }
  }
  
  /**
   * Record an error
   * @param errorType The error type
   * @param operationType The operation type
   * @param sourceSystem The source system
   */
  recordError(
    errorType: ErrorType,
    operationType?: OperationType,
    sourceSystem?: SourceSystemType
  ): void {
    const tags: MetricTags = {
      errorType,
      ...(operationType ? { operationType } : {}),
      ...(sourceSystem ? { sourceSystem } : {})
    };
    
    this.collector.recordCounter(MetricNames.ERROR_COUNT, 1, tags);
    this.collector.recordCounter(MetricNames.ERROR_TYPE_COUNT, 1, { errorType });
  }
}

// Create and export a default metrics service instance
export const metricsService = new MetricsService();