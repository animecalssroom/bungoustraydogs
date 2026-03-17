-- Migration: Global Chat Implementation
-- Date: 2026-03-23

-- 1. Create global_messages table
CREATE TABLE IF NOT EXISTS public.global_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_character_name text,
    sender_faction_id text,
    content text NOT NULL,
    is_bot_post boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_messages_created_at ON public.global_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_global_messages_user_id ON public.global_messages(user_id);

-- 3. RLS - Fully public read, authenticated insert
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "global_messages_read" ON public.global_messages;
CREATE POLICY "global_messages_read" ON public.global_messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "global_messages_insert" ON public.global_messages;
CREATE POLICY "global_messages_insert" ON public.global_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Update Cleanup Function to include global messages (TTL: 3 days)
CREATE OR REPLACE FUNCTION cleanup_old_ephemeral_data()
RETURNS void AS $$
BEGIN
    -- Prune faction messages older than 3 days
    DELETE FROM faction_messages
    WHERE created_at < NOW() - INTERVAL '3 days';

    -- Prune global messages older than 3 days
    DELETE FROM global_messages
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

-- 5. Trigger for auto-cleanup on global messages (occasionally)
CREATE OR REPLACE FUNCTION trigger_cleanup_global()
RETURNS trigger AS $$
BEGIN
    -- Only run cleanup 1% of the time to avoid overhead
    IF random() < 0.01 THEN
        PERFORM cleanup_old_ephemeral_data();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cleanup_global ON global_messages;
CREATE TRIGGER tr_cleanup_global
    AFTER INSERT ON global_messages
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_global();
