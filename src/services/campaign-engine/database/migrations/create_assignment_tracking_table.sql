-- Create assignment tracking table optimized for daily processing runs
-- Assignments are only valid within a single processing run and cleaned up daily

DROP TABLE IF EXISTS campaign_engine.campaign_assignment_tracking CASCADE;

-- Create campaign assignment tracking table
CREATE TABLE IF NOT EXISTS campaign_engine.campaign_assignment_tracking (
    processing_run_id UUID NOT NULL,
    campaign_group_id UUID NOT NULL,
    cif VARCHAR(50) NOT NULL,
    campaign_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Primary key combines run + group + cif for uniqueness within run
    PRIMARY KEY (processing_run_id, campaign_group_id, cif),
    
    -- Foreign key constraints
    CONSTRAINT fk_assignment_tracking_processing_run
        FOREIGN KEY (processing_run_id)
        REFERENCES campaign_engine.campaign_processing_runs(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_assignment_tracking_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign_engine.campaigns(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE campaign_engine.campaign_assignment_tracking IS 'Tracks customer assignments within each processing run to prevent duplicates, cleaned up daily';

-- Create indexes optimized for daily processing
CREATE INDEX idx_assignment_tracking_run_group ON campaign_engine.campaign_assignment_tracking(processing_run_id, campaign_group_id);
CREATE INDEX idx_assignment_tracking_assigned_at ON campaign_engine.campaign_assignment_tracking(assigned_at);

-- Create function to cleanup assignments older than specified days (for daily cleanup)
CREATE OR REPLACE FUNCTION campaign_engine.cleanup_old_assignments(
    p_days_to_keep INTEGER DEFAULT 7
) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete assignments from runs older than specified days
    DELETE FROM campaign_engine.campaign_assignment_tracking 
    WHERE assigned_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup assignments for completed processing runs older than 1 day
CREATE OR REPLACE FUNCTION campaign_engine.cleanup_completed_run_assignments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete assignments for processing runs that completed more than 1 day ago
    DELETE FROM campaign_engine.campaign_assignment_tracking cat
    WHERE EXISTS (
        SELECT 1 FROM campaign_engine.campaign_processing_runs cpr
        WHERE cpr.id = cat.processing_run_id
        AND cpr.status IN ('completed', 'failed')
        AND cpr.completed_at < NOW() - INTERVAL '1 day'
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create daily cleanup job function (to be called by cron or scheduler)
CREATE OR REPLACE FUNCTION campaign_engine.daily_assignment_cleanup()
RETURNS TABLE (
    completed_runs_cleaned INTEGER,
    old_assignments_cleaned INTEGER,
    total_remaining INTEGER
) AS $$
DECLARE
    completed_cleaned INTEGER;
    old_cleaned INTEGER;
    remaining INTEGER;
BEGIN
    -- Clean up assignments from completed runs
    SELECT campaign_engine.cleanup_completed_run_assignments() INTO completed_cleaned;
    
    -- Clean up any remaining old assignments (fallback)
    SELECT campaign_engine.cleanup_old_assignments(7) INTO old_cleaned;
    
    -- Count remaining assignments
    SELECT COUNT(*) FROM campaign_engine.campaign_assignment_tracking INTO remaining;
    
    RETURN QUERY SELECT completed_cleaned, old_cleaned, remaining;
END;
$$ LANGUAGE plpgsql;