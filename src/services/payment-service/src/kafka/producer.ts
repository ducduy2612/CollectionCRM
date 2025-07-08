import { Kafka, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { PaymentEvent, PaymentRecordedEvent, PaymentBatchProcessedEvent } from './events/PaymentRecordedEvent';
import { Payment, BatchProcessResult } from '@/types/payment.types';

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  topic: string;
  batchSize: number;
  compression?: 'gzip' | 'snappy' | 'lz4' | 'zstd';
  retries?: number;
  acks?: 0 | 1 | -1;
  timeout?: number;
}

export interface EventContext {
  correlation_id?: string;
  causation_id?: string;
  user_id?: string;
  trace_id?: string;
}

export class PaymentEventProducer {
  private kafka: Kafka;
  private producer: Producer;
  private logger: pino.Logger;
  private config: KafkaConfig;
  private isConnected: boolean = false;

  // Metrics
  private metrics = {
    events_sent: 0,
    events_failed: 0,
    total_batches: 0,
    last_send_time: 0,
    connection_errors: 0,
  };

  constructor(config: KafkaConfig, logger: pino.Logger) {
    this.config = config;
    this.logger = logger;

    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: {
        initialRetryTime: 100,
        retries: config.retries || 5,
      },
      connectionTimeout: config.timeout || 3000,
      requestTimeout: config.timeout || 30000,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: config.retries || 5,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.producer.on('producer.connect', () => {
      this.logger.info('Kafka producer connected');
      this.isConnected = true;
    });

    this.producer.on('producer.disconnect', () => {
      this.logger.warn('Kafka producer disconnected');
      this.isConnected = false;
    });

    this.producer.on('producer.network.request_timeout', (payload) => {
      this.logger.error({ payload }, 'Kafka producer request timeout');
      this.metrics.connection_errors++;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.logger.info('Kafka producer initialized successfully');
    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Failed to connect Kafka producer');
      this.metrics.connection_errors++;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.logger.info('Kafka producer disconnected');
    } catch (error) {
      this.logger.error({ 
        error: error instanceof Error ? error.message : String(error) 
      }, 'Error disconnecting Kafka producer');
    }
  }

  async publishPaymentRecorded(
    payment: Payment,
    context?: EventContext
  ): Promise<void> {
    const event: PaymentRecordedEvent = {
      event_id: uuidv4(),
      event_type: 'payment.recorded',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'payment-service',
      payment: {
        id: payment.id,
        reference_number: payment.reference_number,
        loan_account_number: payment.loan_account_number,
        cif: payment.cif,
        amount: payment.amount,
        payment_date: payment.payment_date.toISOString(),
        payment_channel: payment.payment_channel || 'unknown',
        source: payment.source,
        metadata: payment.metadata || {},
      },
      ...(context && { context }),
    };

    await this.publishEvent(event, payment.reference_number);
  }

  async publishBatchProcessed(
    batchResult: BatchProcessResult & {
      batch_id: string;
      batch_start_id: bigint;
      batch_end_id: bigint;
    },
    context?: EventContext
  ): Promise<void> {
    const event: PaymentBatchProcessedEvent = {
      event_id: uuidv4(),
      event_type: 'payment.batch.processed',
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'payment-service',
      batch: {
        batch_id: batchResult.batch_id,
        total_records: batchResult.total_processed,
        successful_inserts: batchResult.successful_inserts,
        duplicate_records: batchResult.duplicates_found,
        error_records: batchResult.errors,
        processing_time_ms: batchResult.processing_time_ms,
        batch_start_id: batchResult.batch_start_id.toString(),
        batch_end_id: batchResult.batch_end_id.toString(),
      },
      ...(context && { context }),
    };

    await this.publishEvent(event, batchResult.batch_id);
  }

  async publishPaymentsBatch(
    payments: Payment[],
    context?: EventContext
  ): Promise<void> {
    if (payments.length === 0) return;

    const events = payments.map(payment => ({
      event_id: uuidv4(),
      event_type: 'payment.recorded' as const,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'payment-service',
      payment: {
        id: payment.id,
        reference_number: payment.reference_number,
        loan_account_number: payment.loan_account_number,
        cif: payment.cif,
        amount: payment.amount,
        payment_date: payment.payment_date.toISOString(),
        payment_channel: payment.payment_channel || 'unknown',
        source: payment.source,
        metadata: payment.metadata || {},
      },
      ...(context && { context }),
    }));

    await this.publishEventsBatch(events);
  }

  private async publishEvent(event: PaymentEvent, partitionKey?: string): Promise<RecordMetadata[]> {
    try {
      if (!this.isConnected) {
        throw new Error('Kafka producer is not connected');
      }

      const record: ProducerRecord = {
        topic: this.config.topic,
        messages: [{
          key: partitionKey || event.event_id,
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
          headers: {
            event_type: event.event_type,
            event_id: event.event_id,
            source: event.source,
            version: event.version,
          },
        }],
      };

      const metadata = await this.producer.send(record);
      
      this.metrics.events_sent++;
      this.metrics.last_send_time = Date.now();

      this.logger.debug({
        event_id: event.event_id,
        event_type: event.event_type,
        partition: metadata[0]?.partition,
        offset: metadata[0]?.offset,
      }, 'Event published successfully');

      return metadata;

    } catch (error) {
      this.metrics.events_failed++;
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        event_id: event.event_id,
        event_type: event.event_type,
      }, 'Failed to publish event');
      throw error;
    }
  }

  private async publishEventsBatch(events: PaymentEvent[]): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Kafka producer is not connected');
      }

      if (events.length === 0) return;

      const messages = events.map(event => ({
        key: event.event_id,
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
        headers: {
          event_type: event.event_type,
          event_id: event.event_id,
          source: event.source,
          version: event.version,
        },
      }));

      const record: ProducerRecord = {
        topic: this.config.topic,
        messages,
      };

      await this.producer.send(record);
      
      this.metrics.events_sent += events.length;
      this.metrics.total_batches++;
      this.metrics.last_send_time = Date.now();

      this.logger.info({
        batch_size: events.length,
        event_types: [...new Set(events.map(e => e.event_type))],
      }, 'Event batch published successfully');

    } catch (error) {
      this.metrics.events_failed += events.length;
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        batch_size: events.length,
      }, 'Failed to publish event batch');
      throw error;
    }
  }

  async healthCheck(): Promise<{
    connected: boolean;
    last_send_time: number;
    events_sent: number;
    events_failed: number;
    error_rate: number;
  }> {
    const total_events = this.metrics.events_sent + this.metrics.events_failed;
    const error_rate = total_events > 0 ? (this.metrics.events_failed / total_events) * 100 : 0;

    return {
      connected: this.isConnected,
      last_send_time: this.metrics.last_send_time,
      events_sent: this.metrics.events_sent,
      events_failed: this.metrics.events_failed,
      error_rate: Math.round(error_rate * 100) / 100,
    };
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      events_sent: 0,
      events_failed: 0,
      total_batches: 0,
      last_send_time: 0,
      connection_errors: 0,
    };
  }
}