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
 * Agent created event
 */
export interface AgentCreatedEvent extends BaseEvent {
  agentId: string;
  userId?: string;
  name: string;
  email: string;
  department: string;
}

/**
 * Agent updated event
 */
export interface AgentUpdatedEvent extends BaseEvent {
  agentId: string;
  userId?: string;
  name?: string;
  email?: string;
  department?: string;
  isActive?: boolean;
}

/**
 * Action recorded event
 */
export interface ActionRecordedEvent extends BaseEvent {
  actionId: string;
  agentId: string;
  customerId: string;
  actionType: string;
  actionSubtype?: string;
  notes?: string;
  result?: string;
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
 * Customer assigned event
 */
export interface CustomerAssignedEvent extends BaseEvent {
  assignmentId: string;
  customerId: string;
  agentId: string;
  startDate: string;
  endDate?: string;
  reason?: string;
}