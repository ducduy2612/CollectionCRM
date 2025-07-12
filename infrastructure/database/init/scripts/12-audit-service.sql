-- Create audit service schema
CREATE SCHEMA IF NOT EXISTS audit_service;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_service.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    service_name VARCHAR(50) NOT NULL,
    user_id UUID,
    agent_id UUID,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_service.audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_service.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id ON audit_service.audit_logs (agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_service.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_service.audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_service.audit_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_name ON audit_service.audit_logs (service_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_service.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_service.audit_logs (created_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_service.audit_logs (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_timestamp ON audit_service.audit_logs (agent_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_service.audit_logs (entity_type, entity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_timestamp ON audit_service.audit_logs (service_name, timestamp DESC);

-- Create GIN index for metadata JSONB column
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_service.audit_logs USING GIN (metadata);

-- Add comments for documentation
COMMENT ON TABLE audit_service.audit_logs IS 'Audit log table for tracking all user actions and system events';
COMMENT ON COLUMN audit_service.audit_logs.id IS 'Primary key UUID';
COMMENT ON COLUMN audit_service.audit_logs.event_id IS 'Original event ID from the source system';
COMMENT ON COLUMN audit_service.audit_logs.event_type IS 'Type of event (e.g., user.created, action.recorded)';
COMMENT ON COLUMN audit_service.audit_logs.service_name IS 'Source service that generated the event';
COMMENT ON COLUMN audit_service.audit_logs.user_id IS 'User ID associated with the event';
COMMENT ON COLUMN audit_service.audit_logs.agent_id IS 'Agent ID associated with the event';
COMMENT ON COLUMN audit_service.audit_logs.entity_type IS 'Type of entity affected (e.g., user, customer, action)';
COMMENT ON COLUMN audit_service.audit_logs.entity_id IS 'ID of the entity affected';
COMMENT ON COLUMN audit_service.audit_logs.action IS 'Action performed (create, update, delete, view)';
COMMENT ON COLUMN audit_service.audit_logs.timestamp IS 'Timestamp when the event occurred';
COMMENT ON COLUMN audit_service.audit_logs.user_agent IS 'User agent string from the client';
COMMENT ON COLUMN audit_service.audit_logs.metadata IS 'Additional event data in JSON format';
COMMENT ON COLUMN audit_service.audit_logs.created_at IS 'Timestamp when the audit log was created';