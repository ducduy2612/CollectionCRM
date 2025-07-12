/**
 * Base event interface
 */
export interface BaseEvent {
  id: string;
  timestamp: string;
  version: string;
}

/**
 * User created event
 */
export interface UserCreatedEvent extends BaseEvent {
  userId: string;
  username: string;
  email: string;
  role: string;
}

/**
 * User updated event
 */
export interface UserUpdatedEvent extends BaseEvent {
  userId: string;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * User deactivated event
 */
export interface UserDeactivatedEvent extends BaseEvent {
  userId: string;
  reason?: string;
}

/**
 * Action record created event - for customer case f_update
 */
export interface ActionRecordCreatedEvent extends BaseEvent {
  actionIds: string[]; // All action IDs for this customer
  cif: string;
  loanAccountNumbers: string[]; // All loan account numbers for this customer
  agentId: string; // Keep for reference
  agentName: string; // Use this for direct updates
  fUpdate: string; // ISO date string (latest)
  actionDate: string; // ISO date string (latest)
}

/**
 * Bulk assignment uploaded event
 */
export interface BulkAssignmentUploadedEvent extends BaseEvent {
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
 * Action config updated event
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