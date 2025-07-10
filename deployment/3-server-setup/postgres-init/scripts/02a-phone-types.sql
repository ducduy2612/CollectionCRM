-- =============================================
-- CollectionCRM Database Initialization
-- 02a-phone-types.sql: Phone types table for bank-sync-service schema
-- =============================================

-- Phone Types table (dictionary for phones.type field)
CREATE TABLE bank_sync_service.phone_types (
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

COMMENT ON TABLE bank_sync_service.phone_types IS 'Dictionary table for phone types used in phones.type field - supports multiple numbers per type';

-- Create indexes
CREATE INDEX idx_phone_types_value ON bank_sync_service.phone_types(value);
CREATE INDEX idx_phone_types_is_active ON bank_sync_service.phone_types(is_active);
CREATE INDEX idx_phone_types_sort_order ON bank_sync_service.phone_types(sort_order);

-- Insert phone types supporting multiple numbers per customer
INSERT INTO bank_sync_service.phone_types (value, label, description, sort_order) VALUES
-- Mobile numbers
('mobile1', 'Mobile Phone 1', 'Primary mobile/cellular phone number', 1),
('mobile2', 'Mobile Phone 2', 'Secondary mobile/cellular phone number', 2),
('mobile3', 'Mobile Phone 3', 'Additional mobile/cellular phone number', 3),

-- Home numbers
('home1', 'Home Phone 1', 'Primary home landline phone number', 10),
('home2', 'Home Phone 2', 'Secondary home landline phone number', 11),

-- Work numbers
('work1', 'Work Phone 1', 'Primary work/office phone number', 20),
('work2', 'Work Phone 2', 'Secondary work/office phone number', 21),
('work3', 'Work Phone 3', 'Additional work/office phone number', 22),

-- Other types
('emergency1', 'Emergency Contact 1', 'Primary emergency contact phone number', 30),
('emergency2', 'Emergency Contact 2', 'Secondary emergency contact phone number', 31),
('other1', 'Other Phone 1', 'Other phone number type', 50),
('other2', 'Other Phone 2', 'Additional other phone number', 51);

COMMENT ON COLUMN bank_sync_service.phone_types.value IS 'Unique identifier matching phones.type field - supports multiple numbers per type';
COMMENT ON COLUMN bank_sync_service.phone_types.label IS 'Human-readable label for the phone type';
COMMENT ON COLUMN bank_sync_service.phone_types.description IS 'Detailed description of the phone type';
COMMENT ON COLUMN bank_sync_service.phone_types.is_active IS 'Whether this phone type is currently available for use';
COMMENT ON COLUMN bank_sync_service.phone_types.sort_order IS 'Display order for UI sorting';