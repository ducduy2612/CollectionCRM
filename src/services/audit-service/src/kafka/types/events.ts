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
  createdBy: {
    userId: string;
    username: string;
  };
}

export interface UserUpdatedEvent extends BaseEvent {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  updatedBy: {
    userId: string;
    username: string;
  };
}

export interface UserDeactivatedEvent extends BaseEvent {
  userId: string;
  reason?: string;
  deactivatedBy: {
    userId: string;
    username: string;
  };
}

/**
 * User login event
 */
export interface UserLoginEvent extends BaseEvent {
  userId: string;
  username: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
  };
  sessionId: string;
}

/**
 * User logout event
 */
export interface UserLogoutEvent extends BaseEvent {
  userId: string;
  username: string;
  sessionId: string;
  reason?: string;
}

/**
 * Workflow events from workflow service
 */

export interface ActionConfigUpdatedEvent extends BaseEvent {
  operation: 'add' | 'update' | 'deactivate' | 'map' | 'unmap';
  entityType: 'action_type' | 'action_subtype' | 'action_result' | 'type_subtype_mapping' | 'subtype_result_mapping';
  entityCode?: string;
  entityId?: string;
  changes?: Record<string, any>;
  updatedBy: string;
  userId: string;
}

export interface CustomerAssignedEvent extends BaseEvent {
  batchId: string;
  uploadedBy: string;
  userId: string;
  agentId: string;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  status: 'processing' | 'completed' | 'failed';
}

/**
 * Campaign events from campaign engine
 */
export interface CampaignEvent extends BaseEvent {
  type: string; // 'campaign.created', 'campaign.updated', 'campaign.deleted'
  data: {
    type: 'campaign' | 'campaign_group';
    id: string;
    name?: string;
    campaign_group_id?: string;
    campaign_details?: any;
  };
}

// Legacy interfaces for backward compatibility
export interface CampaignCreatedEvent extends CampaignEvent {
  type: 'campaign.created';
}

export interface CampaignUpdatedEvent extends CampaignEvent {
  type: 'campaign.updated';
}

export interface CampaignDeletedEvent extends CampaignEvent {
  type: 'campaign.deleted';
}

/**
 * Campaign processing events from campaign engine
 */
export interface CampaignProcessingEvent extends BaseEvent {
  type: 'campaign.process.result';
  data: {
    request_id: string;
    processed_count: number;
    success_count: number;
    error_count: number;
    started_at: string;
    completed_at: string;
    total_duration_ms: number;
    requested_by?: string;
    requested_by_id?: string;
  };
}

/**
 * Union type for all events
 */
export type AuditableEvent = 
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeactivatedEvent
  | UserLoginEvent
  | UserLogoutEvent
  | ActionConfigUpdatedEvent
  | CustomerAssignedEvent
  | CampaignEvent
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignDeletedEvent
  | CampaignProcessingEvent;