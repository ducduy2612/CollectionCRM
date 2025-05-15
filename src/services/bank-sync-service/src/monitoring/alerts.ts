/**
 * Alerting system for the Bank Synchronization Microservice
 * Sends notifications for critical errors and threshold violations
 */

import { ErrorType, OperationType, SourceSystemType } from '../errors';
import { logger } from '../utils/logger';
import { MetricData, MetricTags, MetricType } from './metrics';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Alert status
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

/**
 * Alert data interface
 */
export interface AlertData {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  source: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Alert rule interface
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  condition: AlertCondition;
  throttleMinutes?: number;
  lastTriggeredAt?: Date;
  tags?: Record<string, string>;
}

/**
 * Alert condition interface
 */
export interface AlertCondition {
  evaluate(context: AlertContext): boolean;
  getDescription(): string;
}

/**
 * Alert context interface
 */
export interface AlertContext {
  metrics?: MetricData[];
  errors?: Error[];
  timestamp: Date;
  tags?: Record<string, string>;
  [key: string]: any;
}

/**
 * Alert notification channel interface
 */
export interface AlertNotificationChannel {
  send(alert: AlertData): Promise<boolean>;
  getName(): string;
}

/**
 * Threshold condition for metric-based alerts
 */
export class ThresholdCondition implements AlertCondition {
  private metricName: string;
  private operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  private threshold: number;
  private timeWindowMinutes?: number;
  private tags?: MetricTags;

  /**
   * Create a new threshold condition
   * @param metricName The metric name to check
   * @param operator The comparison operator
   * @param threshold The threshold value
   * @param timeWindowMinutes Optional time window in minutes
   * @param tags Optional tags to filter metrics
   */
  constructor(
    metricName: string,
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte',
    threshold: number,
    timeWindowMinutes?: number,
    tags?: MetricTags
  ) {
    this.metricName = metricName;
    this.operator = operator;
    this.threshold = threshold;
    this.timeWindowMinutes = timeWindowMinutes;
    this.tags = tags;
  }

  /**
   * Evaluate the condition
   * @param context The alert context
   * @returns True if the condition is met, false otherwise
   */
  evaluate(context: AlertContext): boolean {
    if (!context.metrics || context.metrics.length === 0) {
      return false;
    }

    // Filter metrics by name and tags
    let filteredMetrics = context.metrics.filter(metric => metric.name === this.metricName);
    
    if (this.tags) {
      filteredMetrics = filteredMetrics.filter(metric => {
        if (!metric.tags) {
          return false;
        }
        
        return Object.entries(this.tags!).every(([key, value]) => metric.tags?.[key] === value);
      });
    }
    
    // Filter metrics by time window
    if (this.timeWindowMinutes) {
      const cutoffTime = new Date(context.timestamp.getTime() - this.timeWindowMinutes * 60 * 1000);
      filteredMetrics = filteredMetrics.filter(metric => metric.timestamp >= cutoffTime);
    }
    
    if (filteredMetrics.length === 0) {
      return false;
    }
    
    // Calculate the aggregate value (sum for counters, latest for gauges, average for histograms)
    let value: number;
    
    const latestMetric = filteredMetrics.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest, filteredMetrics[0]);
    
    if (latestMetric.type === MetricType.GAUGE) {
      value = latestMetric.value;
    } else if (latestMetric.type === MetricType.COUNTER) {
      value = filteredMetrics.reduce((sum, metric) => sum + metric.value, 0);
    } else {
      value = filteredMetrics.reduce((sum, metric) => sum + metric.value, 0) / filteredMetrics.length;
    }
    
    // Compare the value to the threshold
    switch (this.operator) {
      case 'gt':
        return value > this.threshold;
      case 'lt':
        return value < this.threshold;
      case 'eq':
        return value === this.threshold;
      case 'gte':
        return value >= this.threshold;
      case 'lte':
        return value <= this.threshold;
      default:
        return false;
    }
  }

  /**
   * Get the condition description
   * @returns The condition description
   */
  getDescription(): string {
    let description = `${this.metricName} ${this.getOperatorSymbol()} ${this.threshold}`;
    
    if (this.timeWindowMinutes) {
      description += ` in the last ${this.timeWindowMinutes} minutes`;
    }
    
    if (this.tags) {
      const tagString = Object.entries(this.tags)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      
      description += ` with tags [${tagString}]`;
    }
    
    return description;
  }

  /**
   * Get the operator symbol
   * @returns The operator symbol
   */
  private getOperatorSymbol(): string {
    switch (this.operator) {
      case 'gt':
        return '>';
      case 'lt':
        return '<';
      case 'eq':
        return '=';
      case 'gte':
        return '>=';
      case 'lte':
        return '<=';
      default:
        return this.operator;
    }
  }
}

/**
 * Error condition for error-based alerts
 */
export class ErrorCondition implements AlertCondition {
  private errorType?: ErrorType;
  private operationType?: OperationType;
  private sourceSystem?: SourceSystemType;
  private minCount: number;
  private timeWindowMinutes: number;

  /**
   * Create a new error condition
   * @param minCount The minimum error count to trigger the alert
   * @param timeWindowMinutes The time window in minutes
   * @param errorType Optional error type to filter
   * @param operationType Optional operation type to filter
   * @param sourceSystem Optional source system to filter
   */
  constructor(
    minCount: number,
    timeWindowMinutes: number,
    errorType?: ErrorType,
    operationType?: OperationType,
    sourceSystem?: SourceSystemType
  ) {
    this.minCount = minCount;
    this.timeWindowMinutes = timeWindowMinutes;
    this.errorType = errorType;
    this.operationType = operationType;
    this.sourceSystem = sourceSystem;
  }

  /**
   * Evaluate the condition
   * @param context The alert context
   * @returns True if the condition is met, false otherwise
   */
  evaluate(context: AlertContext): boolean {
    if (!context.errors || context.errors.length === 0) {
      return false;
    }

    // Filter errors by type, operation type, and source system
    let filteredErrors = [...context.errors];
    
    if (this.errorType) {
      filteredErrors = filteredErrors.filter(error => 
        'type' in error && (error as any).type === this.errorType);
    }
    
    if (this.operationType) {
      filteredErrors = filteredErrors.filter(error => 
        'details' in error && 
        (error as any).details?.operationType === this.operationType);
    }
    
    if (this.sourceSystem) {
      filteredErrors = filteredErrors.filter(error => 
        'details' in error && 
        (error as any).details?.sourceSystem === this.sourceSystem);
    }
    
    // Count the errors
    return filteredErrors.length >= this.minCount;
  }

  /**
   * Get the condition description
   * @returns The condition description
   */
  getDescription(): string {
    let description = `${this.minCount} or more errors`;
    
    if (this.errorType) {
      description += ` of type ${this.errorType}`;
    }
    
    if (this.operationType) {
      description += ` during ${this.operationType} operations`;
    }
    
    if (this.sourceSystem) {
      description += ` from ${this.sourceSystem}`;
    }
    
    description += ` in the last ${this.timeWindowMinutes} minutes`;
    
    return description;
  }
}

/**
 * Composite condition for combining multiple conditions
 */
export class CompositeCondition implements AlertCondition {
  private conditions: AlertCondition[];
  private operator: 'AND' | 'OR';

  /**
   * Create a new composite condition
   * @param conditions The conditions to combine
   * @param operator The operator to use (AND or OR)
   */
  constructor(conditions: AlertCondition[], operator: 'AND' | 'OR' = 'AND') {
    this.conditions = conditions;
    this.operator = operator;
  }

  /**
   * Evaluate the condition
   * @param context The alert context
   * @returns True if the condition is met, false otherwise
   */
  evaluate(context: AlertContext): boolean {
    if (this.operator === 'AND') {
      return this.conditions.every(condition => condition.evaluate(context));
    } else {
      return this.conditions.some(condition => condition.evaluate(context));
    }
  }

  /**
   * Get the condition description
   * @returns The condition description
   */
  getDescription(): string {
    const descriptions = this.conditions.map(condition => condition.getDescription());
    return descriptions.join(` ${this.operator} `);
  }
}

/**
 * Console notification channel
 */
export class ConsoleNotificationChannel implements AlertNotificationChannel {
  /**
   * Send an alert notification
   * @param alert The alert data
   * @returns True if the notification was sent successfully
   */
  async send(alert: AlertData): Promise<boolean> {
    const color = this.getSeverityColor(alert.severity);
    console.log(`${color}[ALERT] ${alert.severity}: ${alert.name}${COLORS.reset}`);
    console.log(`Description: ${alert.description}`);
    console.log(`Status: ${alert.status}`);
    console.log(`Created: ${alert.createdAt.toISOString()}`);
    
    if (alert.tags) {
      console.log('Tags:', alert.tags);
    }
    
    if (alert.metadata) {
      console.log('Metadata:', alert.metadata);
    }
    
    return true;
  }

  /**
   * Get the channel name
   * @returns The channel name
   */
  getName(): string {
    return 'console';
  }

  /**
   * Get the color for a severity level
   * @param severity The severity level
   * @returns The ANSI color code
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return COLORS.blue;
      case AlertSeverity.WARNING:
        return COLORS.yellow;
      case AlertSeverity.ERROR:
        return COLORS.red;
      case AlertSeverity.CRITICAL:
        return COLORS.bgRed + COLORS.white;
      default:
        return COLORS.reset;
    }
  }
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Logger notification channel
 */
export class LoggerNotificationChannel implements AlertNotificationChannel {
  /**
   * Send an alert notification
   * @param alert The alert data
   * @returns True if the notification was sent successfully
   */
  async send(alert: AlertData): Promise<boolean> {
    switch (alert.severity) {
      case AlertSeverity.INFO:
        logger.info(`Alert: ${alert.name}`, { alert });
        break;
      case AlertSeverity.WARNING:
        logger.warn(`Alert: ${alert.name}`, { alert });
        break;
      case AlertSeverity.ERROR:
        logger.error(`Alert: ${alert.name}`, undefined, { alert });
        break;
      case AlertSeverity.CRITICAL:
        logger.fatal(`Alert: ${alert.name}`, undefined, { alert });
        break;
    }
    
    return true;
  }

  /**
   * Get the channel name
   * @returns The channel name
   */
  getName(): string {
    return 'logger';
  }
}

/**
 * Alert manager for managing alerts and alert rules
 */
export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, AlertData> = new Map();
  private channels: AlertNotificationChannel[] = [];
  private errorBuffer: Error[] = [];
  private maxErrorBufferSize: number = 100;

  /**
   * Create a new alert manager
   * @param channels The notification channels to use
   */
  constructor(channels: AlertNotificationChannel[] = []) {
    // Add default channels
    this.channels = [
      new ConsoleNotificationChannel(),
      new LoggerNotificationChannel(),
      ...channels
    ];
  }

  /**
   * Add an alert rule
   * @param rule The alert rule to add
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Added alert rule: ${rule.name}`, { ruleId: rule.id });
  }

  /**
   * Remove an alert rule
   * @param ruleId The ID of the rule to remove
   * @returns True if the rule was removed, false otherwise
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    
    if (removed) {
      logger.info(`Removed alert rule: ${ruleId}`);
    }
    
    return removed;
  }

  /**
   * Get all alert rules
   * @returns All alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get an alert rule by ID
   * @param ruleId The rule ID
   * @returns The alert rule or undefined if not found
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Add a notification channel
   * @param channel The notification channel to add
   */
  addChannel(channel: AlertNotificationChannel): void {
    this.channels.push(channel);
    logger.info(`Added notification channel: ${channel.getName()}`);
  }

  /**
   * Remove a notification channel
   * @param channelName The name of the channel to remove
   * @returns True if the channel was removed, false otherwise
   */
  removeChannel(channelName: string): boolean {
    const initialLength = this.channels.length;
    this.channels = this.channels.filter(channel => channel.getName() !== channelName);
    
    const removed = this.channels.length < initialLength;
    
    if (removed) {
      logger.info(`Removed notification channel: ${channelName}`);
    }
    
    return removed;
  }

  /**
   * Get all notification channels
   * @returns All notification channels
   */
  getChannels(): AlertNotificationChannel[] {
    return [...this.channels];
  }

  /**
   * Record an error for alerting
   * @param error The error to record
   */
  recordError(error: Error): void {
    this.errorBuffer.push(error);
    
    // Trim the error buffer if it exceeds the maximum size
    if (this.errorBuffer.length > this.maxErrorBufferSize) {
      this.errorBuffer = this.errorBuffer.slice(-this.maxErrorBufferSize);
    }
  }

  /**
   * Evaluate all alert rules
   * @param metrics The metrics to evaluate
   * @returns The triggered alerts
   */
  evaluateRules(metrics: MetricData[]): AlertData[] {
    const triggeredAlerts: AlertData[] = [];
    const now = new Date();
    
    // Create the alert context
    const context: AlertContext = {
      metrics,
      errors: this.errorBuffer,
      timestamp: now
    };
    
    // Evaluate each rule
    for (const rule of this.rules.values()) {
      // Skip disabled rules
      if (!rule.enabled) {
        continue;
      }
      
      // Check throttling
      if (rule.throttleMinutes && rule.lastTriggeredAt) {
        const throttleMs = rule.throttleMinutes * 60 * 1000;
        const timeSinceLastTrigger = now.getTime() - rule.lastTriggeredAt.getTime();
        
        if (timeSinceLastTrigger < throttleMs) {
          continue;
        }
      }
      
      // Evaluate the rule condition
      if (rule.condition.evaluate(context)) {
        // Create an alert
        const alertId = `${rule.id}-${now.getTime()}`;
        
        const alert: AlertData = {
          id: alertId,
          name: rule.name,
          description: rule.condition.getDescription(),
          severity: rule.severity,
          status: AlertStatus.ACTIVE,
          createdAt: now,
          updatedAt: now,
          source: 'alert-manager',
          tags: rule.tags,
          metadata: {
            ruleId: rule.id,
            metrics: metrics.filter(m => m.timestamp.getTime() > now.getTime() - 60000)
          }
        };
        
        // Store the alert
        this.alerts.set(alertId, alert);
        
        // Update the rule's last triggered time
        this.rules.set(rule.id, {
          ...rule,
          lastTriggeredAt: now
        });
        
        // Send notifications
        this.sendNotifications(alert);
        
        // Add to triggered alerts
        triggeredAlerts.push(alert);
      }
    }
    
    return triggeredAlerts;
  }

  /**
   * Send notifications for an alert
   * @param alert The alert to send notifications for
   */
  private async sendNotifications(alert: AlertData): Promise<void> {
    for (const channel of this.channels) {
      try {
        await channel.send(alert);
      } catch (error) {
        logger.error(`Failed to send alert notification via ${channel.getName()}`, error as Error);
      }
    }
  }

  /**
   * Acknowledge an alert
   * @param alertId The alert ID
   * @param userId The user ID acknowledging the alert
   * @returns True if the alert was acknowledged, false otherwise
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert || alert.status !== AlertStatus.ACTIVE) {
      return false;
    }
    
    const now = new Date();
    
    const updatedAlert: AlertData = {
      ...alert,
      status: AlertStatus.ACKNOWLEDGED,
      updatedAt: now,
      acknowledgedAt: now,
      acknowledgedBy: userId
    };
    
    this.alerts.set(alertId, updatedAlert);
    
    logger.info(`Alert ${alertId} acknowledged by ${userId}`);
    
    return true;
  }

  /**
   * Resolve an alert
   * @param alertId The alert ID
   * @param userId The user ID resolving the alert
   * @returns True if the alert was resolved, false otherwise
   */
  resolveAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    
    if (!alert || alert.status === AlertStatus.RESOLVED) {
      return false;
    }
    
    const now = new Date();
    
    const updatedAlert: AlertData = {
      ...alert,
      status: AlertStatus.RESOLVED,
      updatedAt: now,
      resolvedAt: now,
      resolvedBy: userId
    };
    
    this.alerts.set(alertId, updatedAlert);
    
    logger.info(`Alert ${alertId} resolved by ${userId}`);
    
    return true;
  }

  /**
   * Get all alerts
   * @returns All alerts
   */
  getAlerts(): AlertData[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   * @returns Active alerts
   */
  getActiveAlerts(): AlertData[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.status === AlertStatus.ACTIVE);
  }

  /**
   * Get an alert by ID
   * @param alertId The alert ID
   * @returns The alert or undefined if not found
   */
  getAlert(alertId: string): AlertData | undefined {
    return this.alerts.get(alertId);
  }
}

// Create and export a default alert manager instance
export const alertManager = new AlertManager();

// Add some default alert rules
alertManager.addRule({
  id: 'high-error-rate',
  name: 'High Error Rate',
  description: 'Triggers when there are too many errors in a short period',
  enabled: true,
  severity: AlertSeverity.ERROR,
  condition: new ThresholdCondition('error.count', 'gt', 10, 5),
  throttleMinutes: 15
});

alertManager.addRule({
  id: 'critical-errors',
  name: 'Critical Errors',
  description: 'Triggers when there are any critical errors',
  enabled: true,
  severity: AlertSeverity.CRITICAL,
  condition: new ErrorCondition(1, 5, ErrorType.CRITICAL)
});

alertManager.addRule({
  id: 'sync-failures',
  name: 'Sync Failures',
  description: 'Triggers when there are multiple sync failures',
  enabled: true,
  severity: AlertSeverity.WARNING,
  condition: new ThresholdCondition('sync.error.count', 'gt', 5, 10),
  throttleMinutes: 30
});

alertManager.addRule({
  id: 'external-service-errors',
  name: 'External Service Errors',
  description: 'Triggers when there are too many external service errors',
  enabled: true,
  severity: AlertSeverity.WARNING,
  condition: new ThresholdCondition('external.error.count', 'gt', 5, 5),
  throttleMinutes: 15
});

alertManager.addRule({
  id: 'database-errors',
  name: 'Database Errors',
  description: 'Triggers when there are database errors',
  enabled: true,
  severity: AlertSeverity.ERROR,
  condition: new ThresholdCondition('db.error.count', 'gt', 3, 5),
  throttleMinutes: 10
});