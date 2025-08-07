-- =============================================
-- CollectionCRM Database Initialization
-- 02-bank-sync-service.sql: Bank sync service schema tables and indexes
-- =============================================

-- =============================================
-- CREATE TABLES - BANK_SYNC_SERVICE SCHEMA
-- =============================================

-- Customers table
CREATE TABLE bank_sync_service.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL UNIQUE,
    type customer_type NOT NULL,
    name VARCHAR(100),
    date_of_birth DATE,
    national_id VARCHAR(20),
    gender VARCHAR(10),
    company_name VARCHAR(100),
    registration_number VARCHAR(20),
    tax_id VARCHAR(20),
    segment VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_editable BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP
);

COMMENT ON TABLE bank_sync_service.customers IS 'Stores information about individual and organizational customers';

-- Reference Customers table
CREATE TABLE bank_sync_service.reference_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_cif VARCHAR(20) NOT NULL UNIQUE,
    primary_cif VARCHAR(20) NOT NULL,
    relationship_type VARCHAR(30) NOT NULL,
    type customer_type NOT NULL,
    name VARCHAR(100),
    date_of_birth DATE,
    national_id VARCHAR(20),
    gender VARCHAR(10),
    company_name VARCHAR(100),
    registration_number VARCHAR(20),
    tax_id VARCHAR(20),
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_editable BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP,
    CONSTRAINT fk_primary_customer FOREIGN KEY (primary_cif) REFERENCES bank_sync_service.customers(cif)
);

COMMENT ON TABLE bank_sync_service.reference_customers IS 'Stores related contacts to customers (such as guarantors, spouses, or other related parties)';

-- Phones table
CREATE TABLE bank_sync_service.phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    ref_cif VARCHAR(20) NULL,
    type VARCHAR(20) NOT NULL,
    number VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMP,
    CONSTRAINT phones_customer_fk FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif) ON DELETE CASCADE,
    CONSTRAINT phones_reference_customer_fk FOREIGN KEY (ref_cif) REFERENCES bank_sync_service.reference_customers(ref_cif) ON DELETE CASCADE,
    UNIQUE (cif, ref_cif, type)
);

COMMENT ON TABLE bank_sync_service.phones IS 'Stores phone numbers associated with customers and optionally reference customers';

-- Addresses table
CREATE TABLE bank_sync_service.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    ref_cif VARCHAR(20) NULL,
    type VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(100) NOT NULL,
    address_line2 VARCHAR(100),
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMP,
    CONSTRAINT addresses_customer_fk FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif) ON DELETE CASCADE,
    CONSTRAINT addresses_reference_customer_fk FOREIGN KEY (ref_cif) REFERENCES bank_sync_service.reference_customers(ref_cif) ON DELETE CASCADE,
    UNIQUE (cif, ref_cif, type)
);

COMMENT ON TABLE bank_sync_service.addresses IS 'Stores physical addresses associated with customers and optionally reference customers';

-- Emails table
CREATE TABLE bank_sync_service.emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cif VARCHAR(20) NOT NULL,
    ref_cif VARCHAR(20) NULL,
    address VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_date TIMESTAMP,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMP,
    CONSTRAINT emails_customer_fk FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif) ON DELETE CASCADE,
    CONSTRAINT emails_reference_customer_fk FOREIGN KEY (ref_cif) REFERENCES bank_sync_service.reference_customers(ref_cif) ON DELETE CASCADE,
    UNIQUE (cif, ref_cif, address)
);

COMMENT ON TABLE bank_sync_service.emails IS 'Stores email addresses associated with customers';

-- Loans table
CREATE TABLE bank_sync_service.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(20) NOT NULL UNIQUE,
    cif VARCHAR(20) NOT NULL,
    product_type VARCHAR(20) NOT NULL,
    original_amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    disbursement_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    interest_rate DECIMAL(8,4) NOT NULL,
    term INTEGER NOT NULL,
    payment_frequency VARCHAR(20) NOT NULL,
    limit_amount DECIMAL(18,2),
    outstanding DECIMAL(18,2) NOT NULL,
    remaining_amount DECIMAL(18,2) NOT NULL,
    due_amount DECIMAL(18,2) NOT NULL,
    min_pay DECIMAL(18,2),
    next_payment_date DATE NOT NULL,
    dpd INTEGER NOT NULL,
    delinquency_status VARCHAR(20) NOT NULL,
    status loan_status NOT NULL,
    close_date DATE,
    resolution_code VARCHAR(20),
    resolution_notes TEXT,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_editable BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP,
    CONSTRAINT fk_customer_loan FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif)
);

COMMENT ON TABLE bank_sync_service.loans IS 'Stores information about loans issued to customers';

-- Collaterals table
CREATE TABLE bank_sync_service.collaterals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collateral_number VARCHAR(20) NOT NULL UNIQUE,
    cif VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    value DECIMAL(18,2) NOT NULL,
    valuation_date DATE NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    vin VARCHAR(20),
    license_plate VARCHAR(20),
    property_type VARCHAR(20),
    address TEXT,
    size DECIMAL(10,2),
    title_number VARCHAR(20),
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_editable BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP,
    CONSTRAINT fk_customer_collateral FOREIGN KEY (cif) REFERENCES bank_sync_service.customers(cif)
);

COMMENT ON TABLE bank_sync_service.collaterals IS 'Stores information about assets used as collateral for loans';

-- Due Segmentations table
CREATE TABLE bank_sync_service.due_segmentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_account_number VARCHAR(20) NOT NULL,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(18,2) NOT NULL,
    interest_amount DECIMAL(18,2) NOT NULL,
    fees_amount DECIMAL(18,2) NOT NULL,
    penalty_amount DECIMAL(18,2) NOT NULL,
    source_system source_system_type NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_editable BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP,
    UNIQUE (loan_account_number, due_date),
    CONSTRAINT fk_loan_due_segmentation FOREIGN KEY (loan_account_number) REFERENCES bank_sync_service.loans(account_number)
);

COMMENT ON TABLE bank_sync_service.due_segmentations IS 'Stores due segmentation amounts for different due dates for loans';

-- Loan Collaterals junction table
CREATE TABLE bank_sync_service.loan_collaterals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_account_number VARCHAR(20) NOT NULL,
    collateral_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    source_system source_system_type NOT NULL,
    UNIQUE (loan_account_number, collateral_number),
    CONSTRAINT fk_loan_collateral_loan FOREIGN KEY (loan_account_number) REFERENCES bank_sync_service.loans(account_number),
    CONSTRAINT fk_loan_collateral_collateral FOREIGN KEY (collateral_number) REFERENCES bank_sync_service.collaterals(collateral_number)
);

COMMENT ON TABLE bank_sync_service.loan_collaterals IS 'Junction table for the many-to-many relationship between loans and collaterals';

-- Loan Custom Fields table
CREATE TABLE bank_sync_service.loan_custom_fields (
    account_number VARCHAR(20) PRIMARY KEY,
    field_1 VARCHAR(255),
    field_2 VARCHAR(255),
    field_3 VARCHAR(255),
    field_4 VARCHAR(255),
    field_5 VARCHAR(255),
    field_6 VARCHAR(255),
    field_7 VARCHAR(255),
    field_8 VARCHAR(255),
    field_9 VARCHAR(255),
    field_10 VARCHAR(255),
    field_11 VARCHAR(255),
    field_12 VARCHAR(255),
    field_13 VARCHAR(255),
    field_14 VARCHAR(255),
    field_15 VARCHAR(255),
    field_16 VARCHAR(255),
    field_17 VARCHAR(255),
    field_18 VARCHAR(255),
    field_19 VARCHAR(255),
    field_20 VARCHAR(255),
    source_system VARCHAR(50) DEFAULT 'EXTERNAL',
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_loan_custom_fields FOREIGN KEY (account_number) REFERENCES bank_sync_service.loans(account_number)
);

COMMENT ON TABLE bank_sync_service.loan_custom_fields IS 'Stores custom field values for loans that are calculated externally and used for campaign evaluation';

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Customer indexes
CREATE INDEX idx_customers_national_id ON bank_sync_service.customers(national_id);
CREATE INDEX idx_customers_registration_number ON bank_sync_service.customers(registration_number);
CREATE INDEX idx_customers_segment ON bank_sync_service.customers(segment);
CREATE INDEX idx_customers_status ON bank_sync_service.customers(status);
CREATE INDEX idx_customers_type ON bank_sync_service.customers(type);

-- Phone indexes
CREATE INDEX idx_phones_number ON bank_sync_service.phones(number);
CREATE INDEX idx_phones_cif ON bank_sync_service.phones(cif);

-- Address indexes
CREATE INDEX idx_addresses_city ON bank_sync_service.addresses(city);
CREATE INDEX idx_addresses_state ON bank_sync_service.addresses(state);
CREATE INDEX idx_addresses_country ON bank_sync_service.addresses(country);
CREATE INDEX idx_addresses_cif ON bank_sync_service.addresses(cif);

-- Email indexes
CREATE INDEX idx_emails_cif ON bank_sync_service.emails(cif);

-- Loan indexes
CREATE INDEX idx_loans_cif ON bank_sync_service.loans(cif);
CREATE INDEX idx_loans_product_type ON bank_sync_service.loans(product_type);
CREATE INDEX idx_loans_status ON bank_sync_service.loans(status);
CREATE INDEX idx_loans_dpd ON bank_sync_service.loans(dpd);
CREATE INDEX idx_loans_delinquency_status ON bank_sync_service.loans(delinquency_status);
CREATE INDEX idx_loans_next_payment_date ON bank_sync_service.loans(next_payment_date);

-- Collateral indexes
CREATE INDEX idx_collaterals_cif ON bank_sync_service.collaterals(cif);
CREATE INDEX idx_collaterals_type ON bank_sync_service.collaterals(type);
CREATE INDEX idx_collaterals_vin ON bank_sync_service.collaterals(vin);
CREATE INDEX idx_collaterals_license_plate ON bank_sync_service.collaterals(license_plate);
CREATE INDEX idx_collaterals_title_number ON bank_sync_service.collaterals(title_number);

-- Due Segmentation indexes
CREATE INDEX idx_due_segmentations_loan_account_number ON bank_sync_service.due_segmentations(loan_account_number);
CREATE INDEX idx_due_segmentations_due_date ON bank_sync_service.due_segmentations(due_date);

-- Reference Customer indexes
CREATE INDEX idx_reference_customers_primary_cif ON bank_sync_service.reference_customers(primary_cif);
CREATE INDEX idx_reference_customers_relationship_type ON bank_sync_service.reference_customers(relationship_type);
CREATE INDEX idx_reference_customers_national_id ON bank_sync_service.reference_customers(national_id);
CREATE INDEX idx_reference_customers_registration_number ON bank_sync_service.reference_customers(registration_number);

-- Loan Collaterals indexes
CREATE INDEX idx_loan_collaterals_loan_account_number ON bank_sync_service.loan_collaterals(loan_account_number);
CREATE INDEX idx_loan_collaterals_collateral_number ON bank_sync_service.loan_collaterals(collateral_number);

-- Loan Custom Fields indexes
-- Create indexes on frequently queried fields (add more as needed based on usage patterns)
CREATE INDEX idx_loan_custom_fields_field_1 ON bank_sync_service.loan_custom_fields(field_1);
CREATE INDEX idx_loan_custom_fields_field_2 ON bank_sync_service.loan_custom_fields(field_2);
CREATE INDEX idx_loan_custom_fields_field_3 ON bank_sync_service.loan_custom_fields(field_3);
CREATE INDEX idx_loan_custom_fields_field_4 ON bank_sync_service.loan_custom_fields(field_4);
CREATE INDEX idx_loan_custom_fields_field_5 ON bank_sync_service.loan_custom_fields(field_5);