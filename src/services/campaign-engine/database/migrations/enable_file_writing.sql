-- Enable file writing capabilities for SQL debugging
-- This migration enables the adminpack extension and creates helper functions

-- Enable the adminpack extension for file operations
CREATE EXTENSION IF NOT EXISTS adminpack;

-- Create a helper function that safely writes to files with error handling
CREATE OR REPLACE FUNCTION campaign_engine.safe_file_write(
    p_filename TEXT,
    p_content TEXT,
    p_append BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
BEGIN
    BEGIN
        -- Try to write the file using pg_file_write from adminpack
        PERFORM pg_file_write(p_filename, p_content, p_append);
        RETURN true;
    EXCEPTION WHEN OTHERS THEN
        -- If file writing fails, log the error but don't fail the whole process
        RAISE NOTICE 'Failed to write debug file %: %', p_filename, SQLERRM;
        RETURN false;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create a function to ensure debug directory exists (if possible)
CREATE OR REPLACE FUNCTION campaign_engine.ensure_debug_directory()
RETURNS BOOLEAN AS $$
BEGIN
    -- Try to create the debug directory (may fail due to permissions, that's OK)
    BEGIN
        PERFORM pg_file_write('/tmp/campaign_debug_test.txt', 'test', false);
        PERFORM pg_file_unlink('/tmp/campaign_debug_test.txt');
        RETURN true;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Debug directory /tmp may not be writable: %', SQLERRM;
        RETURN false;
    END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION campaign_engine.safe_file_write(TEXT, TEXT, BOOLEAN) IS 'Safely writes content to files with error handling for SQL debugging';
COMMENT ON FUNCTION campaign_engine.ensure_debug_directory() IS 'Checks if debug directory is writable';