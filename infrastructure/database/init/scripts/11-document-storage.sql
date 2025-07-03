-- Document Storage Tables for CollectionCRM
-- This migration adds tables for document upload and management functionality

-- Create documents table in workflow_service schema
CREATE TABLE IF NOT EXISTS workflow_service.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(50) NOT NULL,
    loan_account_number VARCHAR(50),
    document_type VARCHAR(50) NOT NULL,
    document_category VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
    metadata JSONB,
    tags TEXT[],
    uploaded_by UUID NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) 
        REFERENCES workflow_service.agents(id)
);

-- Create indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_cif ON workflow_service.documents(cif);
CREATE INDEX IF NOT EXISTS idx_documents_loan ON workflow_service.documents(loan_account_number) WHERE loan_account_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON workflow_service.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON workflow_service.documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON workflow_service.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON workflow_service.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON workflow_service.documents(created_at);

-- Create document access logs table for audit trail
CREATE TABLE IF NOT EXISTS workflow_service.document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'upload', 'delete', 'update')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_access_logs_document FOREIGN KEY (document_id) 
        REFERENCES workflow_service.documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_logs_agent FOREIGN KEY (agent_id) 
        REFERENCES workflow_service.agents(id)
);

-- Create indexes for document access logs
CREATE INDEX IF NOT EXISTS idx_access_logs_document ON workflow_service.document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_agent ON workflow_service.document_access_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON workflow_service.document_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON workflow_service.document_access_logs(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON workflow_service.documents
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for document statistics
CREATE OR REPLACE VIEW workflow_service.document_statistics AS
SELECT 
    COUNT(*) as total_documents,
    COUNT(DISTINCT cif) as unique_customers,
    COUNT(DISTINCT loan_account_number) as unique_loans,
    SUM(file_size) as total_storage_bytes,
    AVG(file_size) as average_file_size,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_documents,
    COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_documents
FROM workflow_service.documents;

-- Create view for document types summary
CREATE OR REPLACE VIEW workflow_service.document_types_summary AS
SELECT 
    document_type,
    document_category,
    COUNT(*) as count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    MAX(created_at) as last_uploaded
FROM workflow_service.documents
WHERE status = 'active'
GROUP BY document_type, document_category;

-- Add comments
COMMENT ON TABLE workflow_service.documents IS 'Stores metadata for all uploaded documents in the collection system';
COMMENT ON TABLE workflow_service.document_access_logs IS 'Audit trail for all document access and modifications';
COMMENT ON COLUMN workflow_service.documents.cif IS 'Customer Identification Number';
COMMENT ON COLUMN workflow_service.documents.loan_account_number IS 'Associated loan account number (optional)';
COMMENT ON COLUMN workflow_service.documents.storage_path IS 'Path to file in object storage (MinIO/S3)';
COMMENT ON COLUMN workflow_service.documents.checksum IS 'SHA-256 checksum of the file for integrity verification';
COMMENT ON COLUMN workflow_service.documents.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN workflow_service.documents.tags IS 'Array of tags for categorization and search';