-- Migration: Data TTL Triggers
-- Date: 2026-03-18

-- Trigger function to occasionally run cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_ephemeral()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run cleanup occasionally (5% chance) to minimize overhead on every insert
    IF random() < 0.05 THEN
        PERFORM cleanup_old_ephemeral_data();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to faction_messages
DROP TRIGGER IF EXISTS tr_cleanup_messages ON faction_messages;
CREATE TRIGGER tr_cleanup_messages
AFTER INSERT ON faction_messages
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_cleanup_ephemeral();

-- Attach to faction_bulletins
DROP TRIGGER IF EXISTS tr_cleanup_bulletins ON faction_bulletins;
CREATE TRIGGER tr_cleanup_bulletins
AFTER INSERT ON faction_bulletins
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_cleanup_ephemeral();
