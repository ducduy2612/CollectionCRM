-- =============================================
-- CollectionCRM Test Data Generation Script
-- Configurable data generation for performance testing
-- 
-- Usage: Set the scale configuration before running:
-- SET myapp.scale = 'small';   -- 1K customers, 3K loans
-- SET myapp.scale = 'medium';  -- 10K customers, 30K loans  
-- SET myapp.scale = 'large';   -- 100K customers, 300K loans
-- SET myapp.scale = 'xlarge';  -- 1M customers, 3M loans (default)
-- =============================================

-- Create staging_bank schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS staging_bank;
COMMENT ON SCHEMA staging_bank IS 'Staging schema for performance test data';

-- Get scale configuration
DO $$
DECLARE
    scale_setting TEXT;
    customer_count INTEGER;
    ref_customer_count INTEGER;
    loan_count INTEGER;
    collateral_pct DECIMAL;
BEGIN
    -- Get scale setting, default to 'xlarge'
    scale_setting := COALESCE(current_setting('myapp.scale', true), 'xlarge');
    
    -- Set counts based on scale
    CASE scale_setting
        WHEN 'small' THEN
            customer_count := 1000;
            ref_customer_count := 1000;
            loan_count := 3000;
            collateral_pct := 0.3;
        WHEN 'medium' THEN
            customer_count := 10000;
            ref_customer_count := 10000;
            loan_count := 30000;
            collateral_pct := 0.3;
        WHEN 'large' THEN
            customer_count := 100000;
            ref_customer_count := 100000;
            loan_count := 300000;
            collateral_pct := 0.3;
        WHEN 'xlarge' THEN
            customer_count := 1000000;
            ref_customer_count := 1000000;
            loan_count := 3000000;
            collateral_pct := 0.3;
        ELSE
            -- Default to xlarge
            customer_count := 1000000;
            ref_customer_count := 1000000;
            loan_count := 3000000;
            collateral_pct := 0.3;
    END CASE;
    
    -- Store in session variables for use in other blocks
    PERFORM set_config('myapp.customer_count', customer_count::text, false);
    PERFORM set_config('myapp.ref_customer_count', ref_customer_count::text, false);
    PERFORM set_config('myapp.loan_count', loan_count::text, false);
    PERFORM set_config('myapp.collateral_pct', collateral_pct::text, false);
    
    RAISE NOTICE 'Data generation scale: %', scale_setting;
    RAISE NOTICE 'Customers to generate: %', customer_count;
    RAISE NOTICE 'Reference customers to generate: %', ref_customer_count;
    RAISE NOTICE 'Loans to generate: %', loan_count;
END $$;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS staging_bank.loan_collaterals CASCADE;
DROP TABLE IF EXISTS staging_bank.loan_custom_fields CASCADE;
DROP TABLE IF EXISTS staging_bank.due_segmentations CASCADE;
DROP TABLE IF EXISTS staging_bank.collaterals CASCADE;
DROP TABLE IF EXISTS staging_bank.loans CASCADE;
DROP TABLE IF EXISTS staging_bank.emails CASCADE;
DROP TABLE IF EXISTS staging_bank.addresses CASCADE;
DROP TABLE IF EXISTS staging_bank.phones CASCADE;
DROP TABLE IF EXISTS staging_bank.reference_customers CASCADE;
DROP TABLE IF EXISTS staging_bank.customers CASCADE;

-- Create tables with same structure as bank_sync_service
CREATE TABLE staging_bank.customers (
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

CREATE TABLE staging_bank.phones (
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
    UNIQUE (cif, ref_cif, type)
);

CREATE TABLE staging_bank.addresses (
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
    UNIQUE (cif, ref_cif, type)
);

CREATE TABLE staging_bank.emails (
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
    UNIQUE (cif, ref_cif, address)
);

CREATE TABLE staging_bank.loans (
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
    CONSTRAINT fk_customer_loan FOREIGN KEY (cif) REFERENCES staging_bank.customers(cif)
);

CREATE TABLE staging_bank.collaterals (
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
    CONSTRAINT fk_customer_collateral FOREIGN KEY (cif) REFERENCES staging_bank.customers(cif)
);

CREATE TABLE staging_bank.due_segmentations (
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
    CONSTRAINT fk_loan_due_segmentation FOREIGN KEY (loan_account_number) REFERENCES staging_bank.loans(account_number)
);

CREATE TABLE staging_bank.reference_customers (
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
    CONSTRAINT fk_primary_customer FOREIGN KEY (primary_cif) REFERENCES staging_bank.customers(cif)
);

CREATE TABLE staging_bank.loan_collaterals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_account_number VARCHAR(20) NOT NULL,
    collateral_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    source_system source_system_type NOT NULL,
    UNIQUE (loan_account_number, collateral_number),
    CONSTRAINT fk_loan_collateral_loan FOREIGN KEY (loan_account_number) REFERENCES staging_bank.loans(account_number),
    CONSTRAINT fk_loan_collateral_collateral FOREIGN KEY (collateral_number) REFERENCES staging_bank.collaterals(collateral_number)
);

CREATE TABLE staging_bank.loan_custom_fields (
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
    CONSTRAINT fk_loan_custom_fields FOREIGN KEY (account_number) REFERENCES staging_bank.loans(account_number)
);

-- Function to generate Vietnamese names
CREATE OR REPLACE FUNCTION staging_bank.generate_vietnamese_name(is_company BOOLEAN DEFAULT FALSE)
RETURNS VARCHAR AS $$
DECLARE
    first_names VARCHAR[] := ARRAY['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly'];
    middle_names VARCHAR[] := ARRAY['Van', 'Thi', 'Duc', 'Minh', 'Hoang', 'Quoc', 'Anh', 'Hai', 'Thu', 'Xuan'];
    last_names VARCHAR[] := ARRAY['Anh', 'Binh', 'Cuong', 'Dung', 'Giang', 'Hoa', 'Khanh', 'Linh', 'Minh', 'Nam', 'Oanh', 'Phuong', 'Quang', 'Son', 'Tuan', 'Vinh', 'Yen'];
    company_suffixes VARCHAR[] := ARRAY['Corporation', 'Company Limited', 'Joint Stock Company', 'Trading Co.', 'Manufacturing Co.', 'Services Co.', 'Technology Co.', 'Investment Co.'];
    company_types VARCHAR[] := ARRAY['Viet', 'Saigon', 'Hanoi', 'Mekong', 'Pacific', 'Asia', 'Global', 'International'];
BEGIN
    IF is_company THEN
        RETURN company_types[1 + floor(random() * array_length(company_types, 1))] || ' ' || 
               last_names[1 + floor(random() * array_length(last_names, 1))] || ' ' ||
               company_suffixes[1 + floor(random() * array_length(company_suffixes, 1))];
    ELSE
        RETURN first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' || 
               middle_names[1 + floor(random() * array_length(middle_names, 1))] || ' ' || 
               last_names[1 + floor(random() * array_length(last_names, 1))];
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to generate Vietnamese addresses
CREATE OR REPLACE FUNCTION staging_bank.generate_vietnamese_address()
RETURNS TABLE(
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    district VARCHAR
) AS $$
DECLARE
    street_numbers INTEGER[] := ARRAY[1, 15, 23, 45, 67, 89, 123, 234, 345, 456, 567, 678, 789];
    street_names VARCHAR[] := ARRAY['Nguyen Hue', 'Le Loi', 'Tran Hung Dao', 'Pham Ngu Lao', 'Ly Thuong Kiet', 'Hai Ba Trung', 'Le Van Sy', 'Nguyen Thi Minh Khai', 'Vo Van Tan', 'Nam Ky Khoi Nghia'];
    districts_hcm VARCHAR[] := ARRAY['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11', 'District 12', 'Binh Thanh', 'Thu Duc', 'Go Vap', 'Phu Nhuan', 'Tan Binh', 'Tan Phu'];
    districts_hanoi VARCHAR[] := ARRAY['Hoan Kiem', 'Ba Dinh', 'Dong Da', 'Hai Ba Trung', 'Cau Giay', 'Thanh Xuan', 'Hoang Mai', 'Long Bien', 'Tay Ho', 'Nam Tu Liem', 'Bac Tu Liem'];
    cities VARCHAR[] := ARRAY['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong'];
    selected_city VARCHAR;
    selected_district VARCHAR;
BEGIN
    selected_city := cities[1 + floor(random() * array_length(cities, 1))];
    
    IF selected_city = 'Ho Chi Minh City' THEN
        selected_district := districts_hcm[1 + floor(random() * array_length(districts_hcm, 1))];
    ELSIF selected_city = 'Hanoi' THEN
        selected_district := districts_hanoi[1 + floor(random() * array_length(districts_hanoi, 1))];
    ELSE
        selected_district := 'District ' || (1 + floor(random() * 5))::text;
    END IF;
    
    RETURN QUERY SELECT
        (street_numbers[1 + floor(random() * array_length(street_numbers, 1))]::text || ' ' || 
        street_names[1 + floor(random() * array_length(street_names, 1))])::VARCHAR,
        CASE WHEN random() > 0.7 THEN ('Floor ' || (1 + floor(random() * 20))::text)::VARCHAR ELSE NULL::VARCHAR END,
        selected_city::VARCHAR,
        selected_city::VARCHAR, -- In Vietnam, state is often same as city for major cities
        selected_district::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Generate customers based on scale
DO $$
DECLARE
    i INTEGER;
    customer_cif VARCHAR;
    customer_type_val customer_type;
    segments VARCHAR[] := ARRAY['RETAIL', 'SME', 'CORPORATE', 'PRIORITY', 'MASS'];
    statuses VARCHAR[] := ARRAY['ACTIVE', 'INACTIVE', 'DORMANT'];
    sources source_system_type[] := ARRAY['T24', 'W4', 'OTHER'];
    genders VARCHAR[] := ARRAY['MALE', 'FEMALE'];
    address_rec RECORD;
    total_customers INTEGER;
BEGIN
    total_customers := current_setting('myapp.customer_count')::INTEGER;
    RAISE NOTICE 'Starting customer generation for % customers...', total_customers;
    
    FOR i IN 1..total_customers LOOP
        customer_cif := 'CIF' || LPAD(i::text, 10, '0');
        customer_type_val := CASE WHEN random() > 0.8 THEN 'ORGANIZATION'::customer_type ELSE 'INDIVIDUAL'::customer_type END;
        
        -- Insert customer
        INSERT INTO staging_bank.customers (
            cif, type, name, date_of_birth, national_id, gender,
            company_name, registration_number, tax_id,
            segment, status, source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            customer_cif,
            customer_type_val,
            CASE WHEN customer_type_val = 'INDIVIDUAL' THEN staging_bank.generate_vietnamese_name(false) ELSE NULL END,
            CASE WHEN customer_type_val = 'INDIVIDUAL' THEN DATE '1960-01-01' + (random() * 15000)::integer ELSE NULL END,
            CASE WHEN customer_type_val = 'INDIVIDUAL' THEN LPAD((200000000 + i)::text, 12, '0') ELSE NULL END,
            CASE WHEN customer_type_val = 'INDIVIDUAL' THEN genders[1 + floor(random() * 2)] ELSE NULL END,
            CASE WHEN customer_type_val = 'ORGANIZATION' THEN staging_bank.generate_vietnamese_name(true) ELSE NULL END,
            CASE WHEN customer_type_val = 'ORGANIZATION' THEN LPAD((300000000 + i)::text, 10, '0') ELSE NULL END,
            CASE WHEN customer_type_val = 'ORGANIZATION' THEN LPAD((400000000 + i)::text, 10, '0') ELSE NULL END,
            segments[1 + floor(random() * array_length(segments, 1))],
            statuses[1 + floor(random() * array_length(statuses, 1))],
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Insert phone
        INSERT INTO staging_bank.phones (
            cif, type, number, is_primary, is_verified, verification_date,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            customer_cif,
            'mobile1',
            '0' || (900000000 + floor(random() * 99999999))::text,
            true,
            random() > 0.3,
            CASE WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '180 days') ELSE NULL END,
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Insert address
        SELECT * FROM staging_bank.generate_vietnamese_address() INTO address_rec;
        
        INSERT INTO staging_bank.addresses (
            cif, type, address_line1, address_line2, city, state, district, country,
            is_primary, is_verified, verification_date,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            customer_cif,
            'home1',
            address_rec.address_line1,
            address_rec.address_line2,
            address_rec.city,
            address_rec.state,
            address_rec.district,
            'Vietnam',
            true,
            random() > 0.3,
            CASE WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '180 days') ELSE NULL END,
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Insert email
        INSERT INTO staging_bank.emails (
            cif, address, is_primary, is_verified, verification_date,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            customer_cif,
            LOWER(REPLACE(REPLACE(CASE WHEN customer_type_val = 'INDIVIDUAL' 
                THEN staging_bank.generate_vietnamese_name(false) 
                ELSE staging_bank.generate_vietnamese_name(true) END, ' ', '.'), '''', '')) || 
                '.' || i::text || '@example.com',
            true,
            random() > 0.4,
            CASE WHEN random() > 0.4 THEN NOW() - (random() * INTERVAL '180 days') ELSE NULL END,
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        IF i % 10000 = 0 THEN
            RAISE NOTICE 'Generated % customers', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Customer generation completed!';
END $$;

-- Generate loans based on scale
DO $$
DECLARE
    i INTEGER;
    customer_cif VARCHAR;
    loan_account VARCHAR;
    product_types VARCHAR[] := ARRAY['PERSONAL_LOAN', 'AUTO_LOAN', 'MORTGAGE', 'CREDIT_CARD', 'BUSINESS_LOAN'];
    currencies VARCHAR[] := ARRAY['VND', 'USD'];
    payment_frequencies VARCHAR[] := ARRAY['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'];
    delinquency_statuses VARCHAR[] := ARRAY['CURRENT', 'DELINQUENT_30', 'DELINQUENT_60', 'DELINQUENT_90', 'DELINQUENT_120', 'DELINQUENT_180', 'WRITE_OFF'];
    loan_statuses loan_status[] := ARRAY['OPEN', 'CLOSED'];
    disbursement_date DATE;
    maturity_date DATE;
    original_amount DECIMAL;
    outstanding_pct DECIMAL;
    dpd_val INTEGER;
    total_loans INTEGER;
    total_customers INTEGER;
BEGIN
    total_loans := current_setting('myapp.loan_count')::INTEGER;
    total_customers := current_setting('myapp.customer_count')::INTEGER;
    RAISE NOTICE 'Starting loan generation for % loans...', total_loans;
    
    FOR i IN 1..total_loans LOOP
        -- Select a random customer (approximately 3 loans per customer)
        customer_cif := 'CIF' || LPAD(((i-1) % total_customers + 1)::text, 10, '0');
        loan_account := 'LN' || LPAD(i::text, 10, '0');
        
        disbursement_date := DATE '2020-01-01' + (random() * 1460)::integer;
        maturity_date := disbursement_date + (360 + random() * 2520)::integer; -- 1-8 years
        original_amount := 10000000 + random() * 990000000; -- 10M to 1B VND
        outstanding_pct := random();
        dpd_val := CASE 
            WHEN random() < 0.7 THEN 0 
            WHEN random() < 0.85 THEN 1 + floor(random() * 30)::integer
            WHEN random() < 0.95 THEN 31 + floor(random() * 60)::integer
            ELSE 91 + floor(random() * 180)::integer
        END;
        
        INSERT INTO staging_bank.loans (
            account_number, cif, product_type, original_amount, currency,
            disbursement_date, maturity_date, interest_rate, term, payment_frequency,
            limit_amount, outstanding, remaining_amount, due_amount, min_pay,
            next_payment_date, dpd, delinquency_status, status,
            close_date, resolution_code, resolution_notes,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            loan_account,
            customer_cif,
            product_types[1 + floor(random() * array_length(product_types, 1))],
            original_amount,
            currencies[1 + floor(random() * array_length(currencies, 1))],
            disbursement_date,
            maturity_date,
            5 + random() * 15, -- 5% to 20% interest rate
            EXTRACT(YEAR FROM AGE(maturity_date, disbursement_date)) * 12 + EXTRACT(MONTH FROM AGE(maturity_date, disbursement_date)),
            payment_frequencies[1 + floor(random() * array_length(payment_frequencies, 1))],
            CASE WHEN random() > 0.7 THEN original_amount * 1.2 ELSE NULL END,
            original_amount * outstanding_pct,
            original_amount * outstanding_pct,
            CASE WHEN dpd_val > 0 THEN original_amount * 0.05 * (1 + dpd_val/30.0) ELSE 0 END,
            CASE WHEN dpd_val > 0 THEN original_amount * 0.03 ELSE NULL END,
            CURRENT_DATE + (30 - dpd_val),
            dpd_val,
            CASE 
                WHEN dpd_val = 0 THEN 'CURRENT'
                WHEN dpd_val <= 30 THEN 'DELINQUENT_30'
                WHEN dpd_val <= 60 THEN 'DELINQUENT_60'
                WHEN dpd_val <= 90 THEN 'DELINQUENT_90'
                WHEN dpd_val <= 120 THEN 'DELINQUENT_120'
                WHEN dpd_val <= 180 THEN 'DELINQUENT_180'
                ELSE 'WRITE_OFF'
            END,
            CASE WHEN random() > 0.9 THEN 'CLOSED'::loan_status ELSE 'OPEN'::loan_status END,
            CASE WHEN random() > 0.9 THEN CURRENT_DATE - (random() * 180)::integer ELSE NULL END,
            CASE WHEN random() > 0.9 THEN 'PAID_OFF' ELSE NULL END,
            NULL,
            'T24'::source_system_type,
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Add loan custom fields
        IF random() > 0.5 THEN
            INSERT INTO staging_bank.loan_custom_fields (
                account_number, field_1, field_2, source_system, uploaded_by
            ) VALUES (
                loan_account,
                CASE WHEN random() > 0.5 THEN '1' ELSE '0' END, -- field_1: randomized 1s and 0s
                CASE WHEN random() > 0.5 THEN '1' ELSE '0' END, -- field_2: randomized 1s and 0s
                'EXTERNAL',
                'data_generator'
            );
        END IF;
        
        IF i % 10000 = 0 THEN
            RAISE NOTICE 'Generated % loans', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Loan generation completed!';
END $$;

-- Generate reference customers based on scale
DO $$
DECLARE
    i INTEGER;
    primary_cif VARCHAR;
    ref_cif VARCHAR;
    relationship_types VARCHAR[] := ARRAY['SPOUSE', 'PARENT', 'SIBLING', 'CHILD', 'GUARANTOR', 'CO_BORROWER', 'EMERGENCY_CONTACT', 'BUSINESS_PARTNER'];
    ref_type customer_type;
    genders VARCHAR[] := ARRAY['MALE', 'FEMALE'];
    sources source_system_type[] := ARRAY['T24', 'W4', 'OTHER'];
    address_rec RECORD;
    total_ref_customers INTEGER;
    total_customers INTEGER;
BEGIN
    total_ref_customers := current_setting('myapp.ref_customer_count')::INTEGER;
    total_customers := current_setting('myapp.customer_count')::INTEGER;
    RAISE NOTICE 'Starting reference customer generation for % reference customers...', total_ref_customers;
    
    FOR i IN 1..total_ref_customers LOOP
        -- Select a primary customer
        primary_cif := 'CIF' || LPAD(((i-1) % total_customers + 1)::text, 10, '0');
        ref_cif := 'REF' || LPAD(i::text, 10, '0');
        ref_type := CASE WHEN random() > 0.9 THEN 'ORGANIZATION'::customer_type ELSE 'INDIVIDUAL'::customer_type END;
        
        INSERT INTO staging_bank.reference_customers (
            ref_cif, primary_cif, relationship_type, type,
            name, date_of_birth, national_id, gender,
            company_name, registration_number, tax_id,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            ref_cif,
            primary_cif,
            relationship_types[1 + floor(random() * array_length(relationship_types, 1))],
            ref_type,
            CASE WHEN ref_type = 'INDIVIDUAL' THEN staging_bank.generate_vietnamese_name(false) ELSE NULL END,
            CASE WHEN ref_type = 'INDIVIDUAL' THEN DATE '1960-01-01' + (random() * 15000)::integer ELSE NULL END,
            CASE WHEN ref_type = 'INDIVIDUAL' THEN LPAD((500000000 + i)::text, 12, '0') ELSE NULL END,
            CASE WHEN ref_type = 'INDIVIDUAL' THEN genders[1 + floor(random() * 2)] ELSE NULL END,
            CASE WHEN ref_type = 'ORGANIZATION' THEN staging_bank.generate_vietnamese_name(true) ELSE NULL END,
            CASE WHEN ref_type = 'ORGANIZATION' THEN LPAD((600000000 + i)::text, 10, '0') ELSE NULL END,
            CASE WHEN ref_type = 'ORGANIZATION' THEN LPAD((700000000 + i)::text, 10, '0') ELSE NULL END,
            'T24'::source_system_type,
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Insert phone for reference customer
        INSERT INTO staging_bank.phones (
            cif, ref_cif, type, number, is_primary, is_verified, verification_date,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            primary_cif,
            ref_cif,
            'mobile1',
            '0' || (800000000 + floor(random() * 99999999))::text,
            true,
            random() > 0.3,
            CASE WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '180 days') ELSE NULL END,
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Insert address for reference customer
        SELECT * FROM staging_bank.generate_vietnamese_address() INTO address_rec;
        
        INSERT INTO staging_bank.addresses (
            cif, ref_cif, type, address_line1, address_line2, city, state, district, country,
            is_primary, is_verified, verification_date,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            primary_cif,
            ref_cif,
            'home1',
            address_rec.address_line1,
            address_rec.address_line2,
            address_rec.city,
            address_rec.state,
            address_rec.district,
            'Vietnam',
            true,
            random() > 0.3,
            CASE WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '180 days') ELSE NULL END,
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        -- Insert email for reference customer
        INSERT INTO staging_bank.emails (
            cif, ref_cif, address, is_primary, is_verified, verification_date,
            source_system, created_by, updated_by, last_synced_at
        ) VALUES (
            primary_cif,
            ref_cif,
            LOWER(REPLACE(REPLACE(CASE WHEN ref_type = 'INDIVIDUAL' 
                THEN staging_bank.generate_vietnamese_name(false) 
                ELSE staging_bank.generate_vietnamese_name(true) END, ' ', '.'), '''', '')) || 
                '.ref.' || i::text || '@example.com',
            true,
            random() > 0.4,
            CASE WHEN random() > 0.4 THEN NOW() - (random() * INTERVAL '180 days') ELSE NULL END,
            sources[1 + floor(random() * array_length(sources, 1))],
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        );
        
        IF i % 10000 = 0 THEN
            RAISE NOTICE 'Generated % reference customers', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Reference customer generation completed!';
END $$;

-- Generate collaterals for some loans
DO $$
DECLARE
    i INTEGER;
    loan_rec RECORD;
    collateral_num VARCHAR;
    collateral_types VARCHAR[] := ARRAY['VEHICLE', 'PROPERTY', 'EQUIPMENT', 'INVENTORY', 'SECURITIES'];
    vehicle_makes VARCHAR[] := ARRAY['Toyota', 'Honda', 'Mazda', 'Ford', 'Hyundai', 'Kia', 'Mercedes-Benz', 'BMW'];
    vehicle_models VARCHAR[] := ARRAY['Camry', 'Accord', 'CX-5', 'Ranger', 'Tucson', 'Seltos', 'C-Class', 'X3'];
    property_types VARCHAR[] := ARRAY['APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'WAREHOUSE'];
    collateral_count INTEGER := 0;
    collateral_pct DECIMAL;
    max_collaterals INTEGER;
BEGIN
    collateral_pct := current_setting('myapp.collateral_pct')::DECIMAL;
    max_collaterals := (current_setting('myapp.loan_count')::INTEGER * collateral_pct)::INTEGER;
    RAISE NOTICE 'Starting collateral generation for up to % collaterals...', max_collaterals;
    
    -- Generate collaterals for about 30% of loans
    FOR loan_rec IN 
        SELECT account_number, cif 
        FROM staging_bank.loans 
        WHERE random() < collateral_pct 
        LIMIT max_collaterals
    LOOP
        collateral_count := collateral_count + 1;
        collateral_num := 'COL' || LPAD(collateral_count::text, 10, '0');
        
        INSERT INTO staging_bank.collaterals (
            collateral_number, cif, type, description, value, valuation_date,
            make, model, year, vin, license_plate,
            property_type, address, size, title_number,
            source_system, created_by, updated_by, last_synced_at
        )
        SELECT
            collateral_num,
            loan_rec.cif,
            col_type,
            CASE 
                WHEN col_type = 'VEHICLE' THEN 'Vehicle - ' || vehicle_makes[1 + floor(random() * array_length(vehicle_makes, 1))] || ' ' || vehicle_models[1 + floor(random() * array_length(vehicle_models, 1))]
                WHEN col_type = 'PROPERTY' THEN 'Property - ' || property_types[1 + floor(random() * array_length(property_types, 1))]
                ELSE col_type || ' Collateral'
            END,
            50000000 + random() * 5000000000, -- 50M to 5B VND
            CURRENT_DATE - (random() * 365)::integer,
            CASE WHEN col_type = 'VEHICLE' THEN vehicle_makes[1 + floor(random() * array_length(vehicle_makes, 1))] ELSE NULL END,
            CASE WHEN col_type = 'VEHICLE' THEN vehicle_models[1 + floor(random() * array_length(vehicle_models, 1))] ELSE NULL END,
            CASE WHEN col_type = 'VEHICLE' THEN 2015 + floor(random() * 9)::integer ELSE NULL END,
            CASE WHEN col_type = 'VEHICLE' THEN UPPER(SUBSTRING(MD5(random()::text), 1, 17)) ELSE NULL END,
            CASE WHEN col_type = 'VEHICLE' THEN (59 + floor(random() * 40))::text || UPPER(SUBSTRING(MD5(random()::text), 1, 1)) || '-' || LPAD((10000 + floor(random() * 89999))::text, 5, '0') ELSE NULL END,
            CASE WHEN col_type = 'PROPERTY' THEN property_types[1 + floor(random() * array_length(property_types, 1))] ELSE NULL END,
            CASE WHEN col_type = 'PROPERTY' THEN (SELECT address_line1 || ', ' || city FROM staging_bank.generate_vietnamese_address()) ELSE NULL END,
            CASE WHEN col_type = 'PROPERTY' THEN 50 + random() * 450 ELSE NULL END,
            CASE WHEN col_type = 'PROPERTY' THEN 'TITLE' || LPAD((100000 + collateral_count)::text, 8, '0') ELSE NULL END,
            'T24'::source_system_type,
            'data_generator',
            'data_generator',
            NOW() - (random() * INTERVAL '30 days')
        FROM (SELECT collateral_types[1 + floor(random() * array_length(collateral_types, 1))] as col_type) t;
        
        -- Link collateral to loan
        INSERT INTO staging_bank.loan_collaterals (
            loan_account_number, collateral_number, source_system
        ) VALUES (
            loan_rec.account_number,
            collateral_num,
            'T24'::source_system_type
        );
        
        IF collateral_count % 10000 = 0 THEN
            RAISE NOTICE 'Generated % collaterals', collateral_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Collateral generation completed!';
END $$;

-- Generate due segmentations for loans with DPD > 0
DO $$
DECLARE
    loan_rec RECORD;
    due_date DATE;
    segmentation_count INTEGER := 0;
    max_segmentations INTEGER;
BEGIN
    max_segmentations := GREATEST(current_setting('myapp.loan_count')::INTEGER / 6, 100); -- Roughly 1/6 of loans have DPD > 0
    RAISE NOTICE 'Starting due segmentation generation for up to % loans with DPD > 0...', max_segmentations;
    
    FOR loan_rec IN 
        SELECT account_number, dpd, due_amount, disbursement_date
        FROM staging_bank.loans 
        WHERE dpd > 0
        LIMIT max_segmentations
    LOOP
        -- Generate past due dates based on DPD
        FOR i IN 1..(loan_rec.dpd / 30 + 1) LOOP
            due_date := CURRENT_DATE - (i * 30);
            
            INSERT INTO staging_bank.due_segmentations (
                loan_account_number, due_date,
                principal_amount, interest_amount, fees_amount, penalty_amount,
                source_system, created_by, updated_by, last_synced_at
            ) VALUES (
                loan_rec.account_number,
                due_date,
                loan_rec.due_amount * 0.7,
                loan_rec.due_amount * 0.2,
                loan_rec.due_amount * 0.05,
                loan_rec.due_amount * 0.05,
                'T24'::source_system_type,
                'data_generator',
                'data_generator',
                NOW() - (random() * INTERVAL '30 days')
            );
            
            segmentation_count := segmentation_count + 1;
        END LOOP;
        
        IF segmentation_count % 10000 = 0 THEN
            RAISE NOTICE 'Generated % due segmentations', segmentation_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Due segmentation generation completed!';
END $$;

-- Create indexes for performance
DO $$ BEGIN RAISE NOTICE 'Creating indexes...'; END $$;

-- Customer indexes
CREATE INDEX idx_staging_customers_national_id ON staging_bank.customers(national_id);
CREATE INDEX idx_staging_customers_registration_number ON staging_bank.customers(registration_number);
CREATE INDEX idx_staging_customers_segment ON staging_bank.customers(segment);
CREATE INDEX idx_staging_customers_status ON staging_bank.customers(status);
CREATE INDEX idx_staging_customers_type ON staging_bank.customers(type);

-- Phone indexes
CREATE INDEX idx_staging_phones_number ON staging_bank.phones(number);
CREATE INDEX idx_staging_phones_cif ON staging_bank.phones(cif);
CREATE INDEX idx_staging_phones_ref_cif ON staging_bank.phones(ref_cif);

-- Address indexes
CREATE INDEX idx_staging_addresses_city ON staging_bank.addresses(city);
CREATE INDEX idx_staging_addresses_state ON staging_bank.addresses(state);
CREATE INDEX idx_staging_addresses_country ON staging_bank.addresses(country);
CREATE INDEX idx_staging_addresses_cif ON staging_bank.addresses(cif);
CREATE INDEX idx_staging_addresses_ref_cif ON staging_bank.addresses(ref_cif);

-- Email indexes
CREATE INDEX idx_staging_emails_address ON staging_bank.emails(address);
CREATE INDEX idx_staging_emails_cif ON staging_bank.emails(cif);
CREATE INDEX idx_staging_emails_ref_cif ON staging_bank.emails(ref_cif);

-- Loan indexes
CREATE INDEX idx_staging_loans_cif ON staging_bank.loans(cif);
CREATE INDEX idx_staging_loans_product_type ON staging_bank.loans(product_type);
CREATE INDEX idx_staging_loans_status ON staging_bank.loans(status);
CREATE INDEX idx_staging_loans_dpd ON staging_bank.loans(dpd);
CREATE INDEX idx_staging_loans_delinquency_status ON staging_bank.loans(delinquency_status);
CREATE INDEX idx_staging_loans_next_payment_date ON staging_bank.loans(next_payment_date);

-- Collateral indexes
CREATE INDEX idx_staging_collaterals_cif ON staging_bank.collaterals(cif);
CREATE INDEX idx_staging_collaterals_type ON staging_bank.collaterals(type);

-- Due Segmentation indexes
CREATE INDEX idx_staging_due_segmentations_loan_account_number ON staging_bank.due_segmentations(loan_account_number);
CREATE INDEX idx_staging_due_segmentations_due_date ON staging_bank.due_segmentations(due_date);

-- Reference Customer indexes
CREATE INDEX idx_staging_reference_customers_primary_cif ON staging_bank.reference_customers(primary_cif);
CREATE INDEX idx_staging_reference_customers_relationship_type ON staging_bank.reference_customers(relationship_type);

-- Loan Collaterals indexes
CREATE INDEX idx_staging_loan_collaterals_loan_account_number ON staging_bank.loan_collaterals(loan_account_number);
CREATE INDEX idx_staging_loan_collaterals_collateral_number ON staging_bank.loan_collaterals(collateral_number);

-- Clean up helper functions
DROP FUNCTION IF EXISTS staging_bank.generate_vietnamese_name(BOOLEAN);
DROP FUNCTION IF EXISTS staging_bank.generate_vietnamese_address();

DO $$ 
DECLARE
    scale_setting TEXT;
    actual_customers INTEGER;
    actual_ref_customers INTEGER;
    actual_loans INTEGER;
    actual_collaterals INTEGER;
    actual_segmentations INTEGER;
    actual_phones INTEGER;
    actual_emails INTEGER;
    actual_addresses INTEGER;
BEGIN
    scale_setting := COALESCE(current_setting('myapp.scale', true), 'xlarge');
    
    SELECT COUNT(*) INTO actual_customers FROM staging_bank.customers;
    SELECT COUNT(*) INTO actual_ref_customers FROM staging_bank.reference_customers;
    SELECT COUNT(*) INTO actual_loans FROM staging_bank.loans;
    SELECT COUNT(*) INTO actual_collaterals FROM staging_bank.collaterals;
    SELECT COUNT(*) INTO actual_segmentations FROM staging_bank.due_segmentations;
    SELECT COUNT(*) INTO actual_phones FROM staging_bank.phones;
    SELECT COUNT(*) INTO actual_emails FROM staging_bank.emails;
    SELECT COUNT(*) INTO actual_addresses FROM staging_bank.addresses;
    
    RAISE NOTICE 'Test data generation completed successfully!';
    RAISE NOTICE 'Scale: %', scale_setting;
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Customers: %', actual_customers;
    RAISE NOTICE '- Reference Customers: %', actual_ref_customers;
    RAISE NOTICE '- Loans: %', actual_loans;
    RAISE NOTICE '- Collaterals: %', actual_collaterals;
    RAISE NOTICE '- Due Segmentations: %', actual_segmentations;
    RAISE NOTICE '- Phones: %', actual_phones;
    RAISE NOTICE '- Emails: %', actual_emails;
    RAISE NOTICE '- Addresses: %', actual_addresses;
END $$;