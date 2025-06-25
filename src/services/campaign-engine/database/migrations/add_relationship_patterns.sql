-- Migration: Add relationship_patterns to contact_rule_outputs table
-- This adds configurable relationship filtering to campaign contact selection

-- Add the new column
ALTER TABLE campaign_engine.contact_rule_outputs 
ADD COLUMN relationship_patterns JSONB;

-- Add GIN index for efficient JSONB queries
CREATE INDEX idx_contact_rule_outputs_relationship_patterns 
ON campaign_engine.contact_rule_outputs USING GIN (relationship_patterns);

-- Update the comment to reflect the new functionality
COMMENT ON TABLE campaign_engine.contact_rule_outputs IS 'Specifies which contact info to exclude if a rule is met. Uses relationship_patterns for flexible relationship filtering.';

-- Add a comment for the new column
COMMENT ON COLUMN campaign_engine.contact_rule_outputs.relationship_patterns IS 'Optional JSON array of relationship types to exclude (e.g., ["parent", "spouse", "colleague"]). Used when related_party_type is "reference".';

-- Example data showing how to use the new feature:
-- INSERT INTO campaign_engine.contact_rule_outputs (
--     contact_selection_rule_id, 
--     related_party_type, 
--     contact_type, 
--     relationship_patterns
-- ) VALUES (
--     'some-uuid-here',
--     'reference',
--     'mobile',
--     '["colleague", "friend", "neighbor"]'::jsonb
-- );