-- Migration: Global Chat Real-time & Metadata Enhancement
-- Date: 2026-03-24

-- 1. Add sender_username to global_messages
ALTER TABLE public.global_messages 
ADD COLUMN IF NOT EXISTS sender_username TEXT;

-- 2. Enable Real-time for global_messages
-- First, ensure the publication exists (Supabase standard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add the table to the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE global_messages;

-- 3. Backfill sender_username for existing messages (if any)
UPDATE public.global_messages gm
SET sender_username = p.username
FROM public.profiles p
WHERE gm.user_id = p.id
AND gm.sender_username IS NULL;
