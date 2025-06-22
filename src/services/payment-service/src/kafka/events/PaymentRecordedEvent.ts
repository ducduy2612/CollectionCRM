export interface PaymentRecordedEvent {
  event_id: string;
  event_type: 'payment.recorded';
  timestamp: string;
  version: string;
  source: string;
  payment: {
    id: string;
    reference_number: string;
    loan_account_number: string;
    cif: string;
    amount: number;
    payment_date: string;
    payment_channel: string;
    source: 'staging' | 'webhook';
    metadata: Record<string, any>;
  };
  context?: {
    correlation_id?: string;
    causation_id?: string;
    user_id?: string;
    trace_id?: string;
  };
}

export interface PaymentBatchProcessedEvent {
  event_id: string;
  event_type: 'payment.batch.processed';
  timestamp: string;
  version: string;
  source: string;
  batch: {
    batch_id: string;
    total_records: number;
    successful_inserts: number;
    duplicate_records: number;
    error_records: number;
    processing_time_ms: number;
    batch_start_id: string;
    batch_end_id: string;
  };
  context?: {
    correlation_id?: string;
    causation_id?: string;
    trace_id?: string;
  };
}

export interface PaymentDuplicateDetectedEvent {
  event_id: string;
  event_type: 'payment.duplicate.detected';
  timestamp: string;
  version: string;
  source: string;
  duplicate: {
    reference_number: string;
    loan_account_number: string;
    cif: string;
    amount: number;
    payment_date: string;
    source: 'staging' | 'webhook';
    original_payment_id: string;
    detection_method: 'memory_cache' | 'redis_cache' | 'database';
  };
  context?: {
    correlation_id?: string;
    causation_id?: string;
    trace_id?: string;
  };
}

export type PaymentEvent = 
  | PaymentRecordedEvent 
  | PaymentBatchProcessedEvent 
  | PaymentDuplicateDetectedEvent;