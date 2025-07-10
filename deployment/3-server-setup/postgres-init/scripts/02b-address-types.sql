-- =============================================
-- CollectionCRM Database Initialization
-- 02b-address-types.sql: Address types table for bank-sync-service schema
-- =============================================

-- Address Types table (dictionary for addresses.type field)
CREATE TABLE bank_sync_service.address_types (
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

COMMENT ON TABLE bank_sync_service.address_types IS 'Dictionary table for address types used in addresses.type field - supports multiple addresses per type';

-- Create indexes
CREATE INDEX idx_address_types_value ON bank_sync_service.address_types(value);
CREATE INDEX idx_address_types_is_active ON bank_sync_service.address_types(is_active);
CREATE INDEX idx_address_types_sort_order ON bank_sync_service.address_types(sort_order);

-- Insert address types supporting multiple addresses per customer
INSERT INTO bank_sync_service.address_types (value, label, description, sort_order) VALUES
-- Home addresses
('home1', 'Home Address 1', 'Primary home/residential address', 1),
('home2', 'Home Address 2', 'Secondary home/residential address', 2),

-- Work addresses
('work1', 'Work Address 1', 'Primary work/office address', 10),
('work2', 'Work Address 2', 'Secondary work/office address', 11),

-- Mailing addresses
('mailing1', 'Mailing Address 1', 'Primary mailing/correspondence address', 20),
('mailing2', 'Mailing Address 2', 'Secondary mailing/correspondence address', 21),

-- Permanent addresses
('permanent1', 'Permanent Address 1', 'Primary permanent/registered address', 30),
('permanent2', 'Permanent Address 2', 'Secondary permanent/registered address', 31),

-- Temporary addresses
('temporary1', 'Temporary Address 1', 'Primary temporary/current address', 40),
('temporary2', 'Temporary Address 2', 'Secondary temporary/current address', 41),

-- Business addresses
('business1', 'Business Address 1', 'Primary business/company address', 50),
('business2', 'Business Address 2', 'Secondary business/company address', 51),

-- Other types
('billing', 'Billing Address', 'Address for billing purposes', 60),
('shipping', 'Shipping Address', 'Address for shipping/delivery', 61),
('other1', 'Other Address 1', 'Other address type', 70),
('other2', 'Other Address 2', 'Additional other address', 71);

COMMENT ON COLUMN bank_sync_service.address_types.value IS 'Unique identifier matching addresses.type field - supports multiple addresses per type';
COMMENT ON COLUMN bank_sync_service.address_types.label IS 'Human-readable label for the address type';
COMMENT ON COLUMN bank_sync_service.address_types.description IS 'Detailed description of the address type';
COMMENT ON COLUMN bank_sync_service.address_types.is_active IS 'Whether this address type is currently available for use';
COMMENT ON COLUMN bank_sync_service.address_types.sort_order IS 'Display order for UI sorting';