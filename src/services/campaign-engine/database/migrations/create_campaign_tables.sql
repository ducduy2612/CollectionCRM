-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS campaign_engine;

-- Create campaign_groups table
CREATE TABLE campaign_engine.campaign_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);

COMMENT ON TABLE campaign_engine.campaign_groups IS 'Groups for organizing collection campaigns with priority.';

-- Create campaigns table
CREATE TABLE campaign_engine.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_group_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    priority INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_group_id, name),
    UNIQUE (campaign_group_id, priority),
    CONSTRAINT fk_campaign_group
        FOREIGN KEY (campaign_group_id)
        REFERENCES campaign_engine.campaign_groups(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.campaigns IS 'Individual collection campaigns within a group.';

-- Create base_conditions table
CREATE TABLE campaign_engine.base_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    field_value TEXT NOT NULL,
    data_source VARCHAR(50) NOT NULL, -- e.g., bank_sync_service.loans, bank_sync_service.customers, custom_fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_campaign_base_condition
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.base_conditions IS 'Conditions for selecting customers for a campaign.';

-- Create contact_selection_rules table
CREATE TABLE campaign_engine.contact_selection_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    rule_priority INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, rule_priority),
    CONSTRAINT fk_campaign_contact_rule
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.contact_selection_rules IS 'Rules for selecting contact information based on conditions.';

-- Create contact_rule_conditions table
CREATE TABLE campaign_engine.contact_rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_selection_rule_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    field_value TEXT NOT NULL,
    data_source VARCHAR(50) NOT NULL, -- e.g., bank_sync_service.loans, custom_fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_contact_rule_condition
        FOREIGN KEY (contact_selection_rule_id)
        REFERENCES campaign_engine.contact_selection_rules(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.contact_rule_conditions IS 'Conditions for a contact selection rule.';

-- Create contact_rule_outputs table
CREATE TABLE campaign_engine.contact_rule_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_selection_rule_id UUID NOT NULL,
    related_party_type VARCHAR(50) NOT NULL, -- e.g., 'customer', 'reference'
    contact_type VARCHAR(50) NOT NULL, -- e.g., 'mobile', 'home', 'work', 'all'
    relationship_patterns JSONB, -- Optional: JSON array of relationship types to exclude (e.g., ['parent', 'spouse', 'colleague'])
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_contact_rule_output
        FOREIGN KEY (contact_selection_rule_id)
        REFERENCES campaign_engine.contact_selection_rules(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.contact_rule_outputs IS 'Specifies which contact info to exclude if a rule is met. Uses relationship_patterns for flexible relationship filtering.';

-- Create custom_fields table
CREATE TABLE campaign_engine.custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name VARCHAR(100) NOT NULL UNIQUE,
    data_type VARCHAR(50) NOT NULL, -- e.g., 'string', 'number', 'date', 'boolean'
    description TEXT NOT NULL, -- Defines how to retrieve or calculate the value
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE campaign_engine.custom_fields IS 'Defines custom fields for campaign conditions.';

-- Add indexes for performance
CREATE INDEX idx_campaigns_campaign_group_id ON campaign_engine.campaigns(campaign_group_id);
CREATE INDEX idx_campaigns_priority ON campaign_engine.campaigns(priority);
CREATE INDEX idx_base_conditions_campaign_id ON campaign_engine.base_conditions(campaign_id);
CREATE INDEX idx_contact_selection_rules_campaign_id ON campaign_engine.contact_selection_rules(campaign_id);
CREATE INDEX idx_contact_selection_rules_rule_priority ON campaign_engine.contact_selection_rules(rule_priority);
CREATE INDEX idx_contact_rule_conditions_rule_id ON campaign_engine.contact_rule_conditions(contact_selection_rule_id);
CREATE INDEX idx_contact_rule_outputs_rule_id ON campaign_engine.contact_rule_outputs(contact_selection_rule_id);
CREATE INDEX idx_contact_rule_outputs_relationship_patterns ON campaign_engine.contact_rule_outputs USING GIN (relationship_patterns);


-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION campaign_engine.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_campaign_groups_updated_at
    BEFORE UPDATE ON campaign_engine.campaign_groups
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaign_engine.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_base_conditions_updated_at
    BEFORE UPDATE ON campaign_engine.base_conditions
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_contact_selection_rules_updated_at
    BEFORE UPDATE ON campaign_engine.contact_selection_rules
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_contact_rule_conditions_updated_at
    BEFORE UPDATE ON campaign_engine.contact_rule_conditions
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_contact_rule_outputs_updated_at
    BEFORE UPDATE ON campaign_engine.contact_rule_outputs
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();

CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON campaign_engine.custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION campaign_engine.update_updated_at_column();