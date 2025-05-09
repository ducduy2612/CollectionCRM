"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStore = void 0;
exports.createSessionStore = createSessionStore;
const index_1 = require("./index");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Session store implementation for authentication service
 */
class SessionStore {
    /**
     * Create a new SessionStore instance
     * @param options - Session options
     */
    constructor(options = {}) {
        this.ready = false;
        this.options = {
            ttl: options.ttl ?? 86400, // Default: 24 hours
            clientName: options.clientName ?? 'session',
            prefix: options.prefix ?? 'session:',
            sessionIdLength: options.sessionIdLength ?? 32
        };
        this.initPromise = this.init();
    }
    /**
     * Initialize the session store
     */
    async init() {
        try {
            this.client = await (0, index_1.getRedisClient)(this.options.clientName);
            this.ready = true;
        }
        catch (error) {
            console.error('Failed to initialize session store:', error);
            this.ready = false;
        }
    }
    /**
     * Ensure the session store is ready
     */
    async ensureReady() {
        if (!this.ready) {
            await this.initPromise;
            if (!this.ready) {
                throw new Error('Session store is not ready');
            }
        }
    }
    /**
     * Generate a session key
     * @param sessionId - Session ID
     */
    generateKey(sessionId) {
        return `${this.options.prefix}${sessionId}`;
    }
    /**
     * Generate a random session ID
     */
    generateSessionId() {
        return crypto_1.default.randomBytes(this.options.sessionIdLength / 2).toString('hex');
    }
    /**
     * Create a new session
     * @param data - Session data
     * @param ttl - Optional TTL override (in seconds)
     */
    async createSession(data, ttl) {
        await this.ensureReady();
        // Generate a unique session ID
        const sessionId = this.generateSessionId();
        const sessionKey = this.generateKey(sessionId);
        try {
            // Store session data with TTL
            await this.client.set(sessionKey, JSON.stringify(data), { EX: ttl ?? this.options.ttl });
            // Create a secondary index by userId for easy lookup
            if (data.userId) {
                const userSessionsKey = `${this.options.prefix}user:${data.userId}`;
                await this.client.sAdd(userSessionsKey, sessionId);
                // Set TTL on the user sessions set as well
                await this.client.expire(userSessionsKey, ttl ?? this.options.ttl);
            }
            return sessionId;
        }
        catch (error) {
            console.error('Error creating session:', error);
            throw new Error('Failed to create session');
        }
    }
    /**
     * Get session data
     * @param sessionId - Session ID
     * @param extend - Whether to extend the session TTL
     */
    async getSession(sessionId, extend = true) {
        await this.ensureReady();
        const sessionKey = this.generateKey(sessionId);
        try {
            // Get session data
            const data = await this.client.get(sessionKey);
            if (!data) {
                return null;
            }
            // Parse session data
            const sessionData = JSON.parse(data);
            // Extend session TTL if requested
            if (extend) {
                await this.client.expire(sessionKey, this.options.ttl);
                // Also extend the user sessions set TTL
                if (sessionData.userId) {
                    const userSessionsKey = `${this.options.prefix}user:${sessionData.userId}`;
                    await this.client.expire(userSessionsKey, this.options.ttl);
                }
            }
            return sessionData;
        }
        catch (error) {
            console.error(`Error getting session ${sessionId}:`, error);
            return null;
        }
    }
    /**
     * Update session data
     * @param sessionId - Session ID
     * @param data - New session data
     * @param extend - Whether to extend the session TTL
     */
    async updateSession(sessionId, data, extend = true) {
        await this.ensureReady();
        const sessionKey = this.generateKey(sessionId);
        try {
            // Get current session data
            const currentData = await this.client.get(sessionKey);
            if (!currentData) {
                return false;
            }
            // Parse and update session data
            const sessionData = { ...JSON.parse(currentData), ...data };
            // Store updated session data
            const ttl = extend ? this.options.ttl : await this.client.ttl(sessionKey);
            await this.client.set(sessionKey, JSON.stringify(sessionData), { EX: ttl });
            return true;
        }
        catch (error) {
            console.error(`Error updating session ${sessionId}:`, error);
            return false;
        }
    }
    /**
     * Delete a session
     * @param sessionId - Session ID
     */
    async deleteSession(sessionId) {
        await this.ensureReady();
        const sessionKey = this.generateKey(sessionId);
        try {
            // Get session data to find userId
            const data = await this.client.get(sessionKey);
            if (data) {
                const sessionData = JSON.parse(data);
                // Remove session from user sessions set
                if (sessionData.userId) {
                    const userSessionsKey = `${this.options.prefix}user:${sessionData.userId}`;
                    await this.client.sRem(userSessionsKey, sessionId);
                }
            }
            // Delete session
            await this.client.del(sessionKey);
            return true;
        }
        catch (error) {
            console.error(`Error deleting session ${sessionId}:`, error);
            return false;
        }
    }
    /**
     * Delete all sessions for a user
     * @param userId - User ID
     */
    async deleteUserSessions(userId) {
        await this.ensureReady();
        const userSessionsKey = `${this.options.prefix}user:${userId}`;
        try {
            // Get all session IDs for the user
            const sessionIds = await this.client.sMembers(userSessionsKey);
            if (sessionIds.length > 0) {
                // Delete all sessions
                const sessionKeys = sessionIds.map(id => this.generateKey(id));
                await this.client.del(sessionKeys);
            }
            // Delete the user sessions set
            await this.client.del(userSessionsKey);
            return true;
        }
        catch (error) {
            console.error(`Error deleting sessions for user ${userId}:`, error);
            return false;
        }
    }
    /**
     * Get all sessions for a user
     * @param userId - User ID
     */
    async getUserSessions(userId) {
        await this.ensureReady();
        const userSessionsKey = `${this.options.prefix}user:${userId}`;
        try {
            return await this.client.sMembers(userSessionsKey);
        }
        catch (error) {
            console.error(`Error getting sessions for user ${userId}:`, error);
            return [];
        }
    }
    /**
     * Check if a session exists
     * @param sessionId - Session ID
     */
    async sessionExists(sessionId) {
        await this.ensureReady();
        const sessionKey = this.generateKey(sessionId);
        try {
            return (await this.client.exists(sessionKey)) === 1;
        }
        catch (error) {
            console.error(`Error checking if session ${sessionId} exists:`, error);
            return false;
        }
    }
    /**
     * Get the TTL of a session in seconds
     * @param sessionId - Session ID
     */
    async getSessionTTL(sessionId) {
        await this.ensureReady();
        const sessionKey = this.generateKey(sessionId);
        try {
            return await this.client.ttl(sessionKey);
        }
        catch (error) {
            console.error(`Error getting TTL for session ${sessionId}:`, error);
            return -1;
        }
    }
    /**
     * Extend the TTL of a session
     * @param sessionId - Session ID
     * @param ttl - New TTL in seconds (defaults to the configured TTL)
     */
    async extendSession(sessionId, ttl) {
        await this.ensureReady();
        const sessionKey = this.generateKey(sessionId);
        try {
            // Get session data to find userId
            const data = await this.client.get(sessionKey);
            if (!data) {
                return false;
            }
            // Extend session TTL
            await this.client.expire(sessionKey, ttl ?? this.options.ttl);
            // Extend user sessions set TTL
            const sessionData = JSON.parse(data);
            if (sessionData.userId) {
                const userSessionsKey = `${this.options.prefix}user:${sessionData.userId}`;
                await this.client.expire(userSessionsKey, ttl ?? this.options.ttl);
            }
            return true;
        }
        catch (error) {
            console.error(`Error extending session ${sessionId}:`, error);
            return false;
        }
    }
}
exports.SessionStore = SessionStore;
/**
 * Create a new SessionStore instance with the given options
 * @param options - Session options
 */
function createSessionStore(options) {
    return new SessionStore(options);
}
