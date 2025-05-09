/**
 * Session data interface
 */
export interface SessionData {
    userId: string;
    username: string;
    roles: string[];
    permissions?: string[];
    [key: string]: any;
}
/**
 * Session options
 */
export interface SessionOptions {
    /** TTL in seconds */
    ttl?: number;
    /** Redis client name */
    clientName?: string;
    /** Key prefix */
    prefix?: string;
    /** Session ID length */
    sessionIdLength?: number;
}
/**
 * Session store implementation for authentication service
 */
export declare class SessionStore {
    private client;
    private options;
    private ready;
    private initPromise;
    /**
     * Create a new SessionStore instance
     * @param options - Session options
     */
    constructor(options?: SessionOptions);
    /**
     * Initialize the session store
     */
    private init;
    /**
     * Ensure the session store is ready
     */
    private ensureReady;
    /**
     * Generate a session key
     * @param sessionId - Session ID
     */
    private generateKey;
    /**
     * Generate a random session ID
     */
    private generateSessionId;
    /**
     * Create a new session
     * @param data - Session data
     * @param ttl - Optional TTL override (in seconds)
     */
    createSession(data: SessionData, ttl?: number): Promise<string>;
    /**
     * Get session data
     * @param sessionId - Session ID
     * @param extend - Whether to extend the session TTL
     */
    getSession(sessionId: string, extend?: boolean): Promise<SessionData | null>;
    /**
     * Update session data
     * @param sessionId - Session ID
     * @param data - New session data
     * @param extend - Whether to extend the session TTL
     */
    updateSession(sessionId: string, data: Partial<SessionData>, extend?: boolean): Promise<boolean>;
    /**
     * Delete a session
     * @param sessionId - Session ID
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Delete all sessions for a user
     * @param userId - User ID
     */
    deleteUserSessions(userId: string): Promise<boolean>;
    /**
     * Get all sessions for a user
     * @param userId - User ID
     */
    getUserSessions(userId: string): Promise<string[]>;
    /**
     * Check if a session exists
     * @param sessionId - Session ID
     */
    sessionExists(sessionId: string): Promise<boolean>;
    /**
     * Get the TTL of a session in seconds
     * @param sessionId - Session ID
     */
    getSessionTTL(sessionId: string): Promise<number>;
    /**
     * Extend the TTL of a session
     * @param sessionId - Session ID
     * @param ttl - New TTL in seconds (defaults to the configured TTL)
     */
    extendSession(sessionId: string, ttl?: number): Promise<boolean>;
}
/**
 * Create a new SessionStore instance with the given options
 * @param options - Session options
 */
export declare function createSessionStore(options?: SessionOptions): SessionStore;
