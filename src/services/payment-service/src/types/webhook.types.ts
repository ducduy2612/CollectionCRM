import { z } from 'zod';

export const WebhookPaymentSchema = z.object({
  reference_number: z.string().min(1).max(255),
  loan_account_number: z.string().min(1).max(20),
  cif: z.string().min(1).max(20),
  amount: z.number().positive(),
  payment_date: z.string().datetime().or(z.date()),
  payment_channel: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

export type WebhookPaymentData = z.infer<typeof WebhookPaymentSchema>;

export interface WebhookAuthConfig {
  enabled: boolean;
  secret?: string;
  header_name?: string;
  ip_whitelist?: string[];
}

export interface WebhookProcessingResult {
  success: boolean;
  payment_id?: string;
  duplicate: boolean;
  error?: string;
  processing_time_ms: number;
}

export interface WebhookChannelConfig {
  channel: string;
  auth: WebhookAuthConfig;
  rate_limit: {
    enabled: boolean;
    max_requests: number;
    window_ms: number;
  };
  transform?: (data: any) => WebhookPaymentData;
}

export interface WebhookMetrics {
  total_requests: number;
  successful_requests: number;
  duplicate_requests: number;
  failed_requests: number;
  average_response_time: number;
  last_request_at?: Date;
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  reset_time: number;
  total: number;
}