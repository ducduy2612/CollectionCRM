/**
 * Base event interface
 */
export interface BaseEvent {
  id: string;
  timestamp: string;
  version: string;
}

/**
 * User events from auth service
 */
export interface UserCreatedEvent extends BaseEvent {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface UserUpdatedEvent extends BaseEvent {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserDeactivatedEvent extends BaseEvent {
  userId: string;
  reason?: string;
}

/**
 * Workflow events from workflow service
 */
export interface AgentCreatedEvent extends BaseEvent {
  agentId: string;
  userId?: string;
  name: string;
  email: string;
  department: string;
}

export interface AgentUpdatedEvent extends BaseEvent {
  agentId: string;
  userId?: string;
  name?: string;
  email?: string;
  department?: string;
  isActive?: boolean;
}

export interface ActionRecordedEvent extends BaseEvent {
  actionId: string;
  agentId: string;
  customerId: string;
  actionType: string;
  actionSubtype?: string;
  notes?: string;
  result?: string;
}

export interface ActionRecordCreatedEvent extends BaseEvent {
  actionIds: string[];
  cif: string;
  loanAccountNumbers: string[];
  agentId: string;
  agentName: string;
  fUpdate: string;
  actionDate: string;
}

export interface CustomerAssignedEvent extends BaseEvent {
  assignmentId: string;
  customerId: string;
  agentId: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}

/**
 * Payment events from payment service
 */
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

/**
 * Campaign events from campaign engine
 */
export interface CampaignCreatedEvent extends BaseEvent {
  campaignId: string;
  name: string;
  description?: string;
  createdBy: string;
}

export interface CampaignUpdatedEvent extends BaseEvent {
  campaignId: string;
  name?: string;
  description?: string;
  updatedBy: string;
}

export interface CampaignDeletedEvent extends BaseEvent {
  campaignId: string;
  deletedBy: string;
  reason?: string;
}

export interface CampaignGroupCreatedEvent extends BaseEvent {
  campaignGroupId: string;
  campaignId: string;
  name: string;
  createdBy: string;
}

export interface CampaignGroupUpdatedEvent extends BaseEvent {
  campaignGroupId: string;
  campaignId: string;
  name?: string;
  updatedBy: string;
}

export interface CampaignGroupDeletedEvent extends BaseEvent {
  campaignGroupId: string;
  campaignId: string;
  deletedBy: string;
  reason?: string;
}

/**
 * Union type for all events
 */
export type AuditableEvent = 
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeactivatedEvent
  | AgentCreatedEvent
  | AgentUpdatedEvent
  | ActionRecordedEvent
  | ActionRecordCreatedEvent
  | CustomerAssignedEvent
  | PaymentEvent
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignDeletedEvent
  | CampaignGroupCreatedEvent
  | CampaignGroupUpdatedEvent
  | CampaignGroupDeletedEvent;