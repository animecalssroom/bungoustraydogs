-- Migration: Data TTL Cleanup
-- Date: 2026-03-18

-- Function to prune old ephemeral data
CREATE OR REPLACE FUNCTION cleanup_old_ephemeral_data()
RETURNS void AS $$
BEGIN
    -- Prune faction messages older than 3 days
    DELETE FROM faction_messages
    WHERE created_at < NOW() - INTERVAL '3 days';

    -- Prune faction bulletins older than 7 days (non-pinned)
    DELETE FROM faction_bulletins
    WHERE pinned = false 
      AND created_at < NOW() - INTERVAL '7 days';

    -- Prune public faction activity older than 14 days
    DELETE FROM faction_activity
    WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- To be called via RPC or pg_cron if enabled
-- SELECT cleanup_old_ephemeral_data();
