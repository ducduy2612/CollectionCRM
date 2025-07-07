-- =============================================
-- CollectionCRM Database Initialization
-- 02c-relationship-types.sql: Relationship types table for bank-sync-service schema
-- =============================================

-- Relationship Types table (dictionary for customer relationships)
CREATE TABLE bank_sync_service.relationship_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    value VARCHAR(20) NOT NULL UNIQUE,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    updated_by VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bank_sync_service.relationship_types IS 'Dictionary table for relationship types used in customer relationships';

-- Create indexes
CREATE INDEX idx_relationship_types_value ON bank_sync_service.relationship_types(value);
CREATE INDEX idx_relationship_types_is_active ON bank_sync_service.relationship_types(is_active);
CREATE INDEX idx_relationship_types_sort_order ON bank_sync_service.relationship_types(sort_order);

-- Insert relationship types
INSERT INTO bank_sync_service.relationship_types (value, label, description, sort_order) VALUES
-- Family relationships
('spouse', 'Spouse', 'Husband or wife', 1),
('parent', 'Parent', 'Father or mother', 2),
('child', 'Child', 'Son or daughter', 3),
('sibling', 'Sibling', 'Brother or sister', 4),
('grandparent', 'Grandparent', 'Grandfather or grandmother', 5),
('grandchild', 'Grandchild', 'Grandson or granddaughter', 6),
('uncle_aunt', 'Uncle/Aunt', 'Uncle or aunt', 7),
('nephew_niece', 'Nephew/Niece', 'Nephew or niece', 8),
('cousin', 'Cousin', 'Cousin', 9),
('in_law', 'In-law', 'In-law relationship', 10),

-- Professional relationships
('colleague', 'Colleague', 'Work colleague or coworker', 20),
('supervisor', 'Supervisor', 'Direct supervisor or manager', 21),
('subordinate', 'Subordinate', 'Direct report or subordinate', 22),
('business_partner', 'Business Partner', 'Business partner or associate', 23),
('client', 'Client', 'Client or customer', 24),
('vendor', 'Vendor', 'Vendor or supplier', 25),

-- Personal relationships
('friend', 'Friend', 'Personal friend', 30),
('neighbor', 'Neighbor', 'Neighbor', 31),
('roommate', 'Roommate', 'Roommate or housemate', 32),
('partner', 'Partner', 'Life partner (non-married)', 33),
('ex_spouse', 'Ex-spouse', 'Former spouse', 34),
('guardian', 'Guardian', 'Legal guardian', 35),
('ward', 'Ward', 'Legal ward', 36),

-- Financial relationships
('guarantor', 'Guarantor', 'Loan guarantor', 40),
('co_signer', 'Co-signer', 'Loan co-signer', 41),
('beneficiary', 'Beneficiary', 'Beneficiary', 42),
('executor', 'Executor', 'Estate executor', 43),
('trustee', 'Trustee', 'Trustee', 44),
('power_of_attorney', 'Power of Attorney', 'Holds power of attorney', 45),

-- Other relationships
('emergency_contact', 'Emergency Contact', 'Emergency contact person', 50),
('reference', 'Reference', 'Personal or professional reference', 51),
('acquaintance', 'Acquaintance', 'Acquaintance', 52),
('other', 'Other', 'Other type of relationship', 99);

COMMENT ON COLUMN bank_sync_service.relationship_types.value IS 'Unique identifier for the relationship type';
COMMENT ON COLUMN bank_sync_service.relationship_types.label IS 'Human-readable label for the relationship type';
COMMENT ON COLUMN bank_sync_service.relationship_types.description IS 'Detailed description of the relationship type';
COMMENT ON COLUMN bank_sync_service.relationship_types.is_active IS 'Whether this relationship type is currently available for use';
COMMENT ON COLUMN bank_sync_service.relationship_types.sort_order IS 'Display order for UI sorting';