export interface PaymentStaging {
  id: bigint;
  reference_number: string;
  loan_account_number: string;
  cif: string;
  amount: number;
  payment_date: Date;
  payment_channel?: string;
  metadata?: Record<string, any>;
  processed: boolean;
  processed_at?: Date;
  created_at: Date;
}

export interface Payment {
  id: string;
  reference_number: string;
  loan_account_number: string;
  cif: string;
  amount: number;
  payment_date: Date;
  payment_channel?: string;
  source: 'staging' | 'webhook';
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface PaymentReference {
  reference_number: string;
  payment_id: string;
  payment_date: Date;
  created_at: Date;
}

export interface StagingProcessLog {
  id: string;
  batch_start_id: bigint;
  batch_end_id: bigint;
  total_records: number;
  processed_records: number;
  duplicate_records: number;
  error_records: number;
  status: 'processing' | 'completed' | 'failed';
  started_at: Date;
  completed_at?: Date;
  error_details?: Record<string, any>;
}

export interface PaymentCreateRequest {
  reference_number: string;
  loan_account_number: string;
  cif: string;
  amount: number;
  payment_date: string | Date;
  payment_channel?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: 'created' | 'duplicate';
  payment_id: string;
  message?: string;
}

export interface BatchProcessResult {
  total_processed: number;
  successful_inserts: number;
  duplicates_found: number;
  errors: number;
  processing_time_ms: number;
}

export interface PaymentStats {
  staging: {
    processed_today: number;
    pending_count: number;
    average_batch_time_ms: number;
    last_processed_id?: bigint;
  };
  webhooks: {
    received_today: number;
    duplicate_rate: number;
    average_response_time_ms: number;
  };
  cache: {
    memory_hit_rate: number;
    redis_hit_rate: number;
    total_references: number;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: 'ok' | 'error';
    kafka: 'ok' | 'error';
    redis: 'ok' | 'error';
    staging_backlog: number;
    last_staging_run?: string;
  };
  timestamp: string;
}