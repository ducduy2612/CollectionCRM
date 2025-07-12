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
  createdBy: {
    userId: string;
    username: string;
  };
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
  updatedBy: {
    userId: string;
    username: string;
  };
}

/**
 * User deactivated event
 */
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