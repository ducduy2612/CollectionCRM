-- Create campaign_engine schema if not exists
CREATE SCHEMA IF NOT EXISTS campaign_engine;

-- Campaign Groups table
CREATE TABLE IF NOT EXISTS campaign_engine.campaign_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on name for quick lookups
CREATE INDEX idx_campaign_groups_name ON campaign_engine.campaign_groups(name);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaign_engine.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_group_id UUID NOT NULL REFERENCES campaign_engine.campaign_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    priority INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_group_id, name),
    UNIQUE(campaign_group_id, priority)
);

-- Add indexes for performance
CREATE INDEX idx_campaigns_group_id ON campaign_engine.campaigns(campaign_group_id);
CREATE INDEX idx_campaigns_priority ON campaign_engine.campaigns(campaign_group_id, priority);

-- Base Conditions table
CREATE TABLE IF NOT EXISTS campaign_engine.base_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaign_engine.campaigns(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    field_value TEXT NOT NULL,
    data_source VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for campaign lookups
CREATE INDEX idx_base_conditions_campaign_id ON campaign_engine.base_conditions(campaign_id);

-- Contact Selection Rules table
CREATE TABLE IF NOT EXISTS campaign_engine.contact_selection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaign_engine.campaigns(id) ON DELETE CASCADE,
    rule_priority INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, rule_priority)
);

-- Add indexes for performance
CREATE INDEX idx_contact_rules_campaign_id ON campaign_engine.contact_selection_rules(campaign_id);
CREATE INDEX idx_contact_rules_priority ON campaign_engine.contact_selection_rules(campaign_id, rule_priority);

-- Contact Rule Conditions table
CREATE TABLE IF NOT EXISTS campaign_engine.contact_rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_selection_rule_id UUID NOT NULL REFERENCES campaign_engine.contact_selection_rules(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    field_value TEXT NOT NULL,
    data_source VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for rule lookups
CREATE INDEX idx_contact_conditions_rule_id ON campaign_engine.contact_rule_conditions(contact_selection_rule_id);

-- Contact Rule Outputs table
CREATE TABLE IF NOT EXISTS campaign_engine.contact_rule_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_selection_rule_id UUID NOT NULL REFERENCES campaign_engine.contact_selection_rules(id) ON DELETE CASCADE,
    related_party_type VARCHAR(100) NOT NULL,
    contact_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for rule lookups
CREATE INDEX idx_contact_outputs_rule_id ON campaign_engine.contact_rule_outputs(contact_selection_rule_id);

-- Custom Fields metadata table
CREATE TABLE IF NOT EXISTS campaign_engine.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_name VARCHAR(255) NOT NULL UNIQUE,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('string', 'number', 'date', 'boolean')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on field name
CREATE INDEX idx_custom_fields_name ON campaign_engine.custom_fields(field_name);

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