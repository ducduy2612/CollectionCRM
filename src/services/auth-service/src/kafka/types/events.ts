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