-- Scaling and Performance Indices for High Usage
-- Target: Stop 'unhealthy' DB reports and fix slow queries for roster/feed

-- 1. Profile Roster Index
-- Optimizes FactionPrivateSpace and Roster fetches
CREATE INDEX IF NOT EXISTS idx_profiles_faction_role_ap 
ON public.profiles (faction, role, ap_total DESC);

-- 2. User Events History Index
-- Optimizes Progress Tracker and Action History
CREATE INDEX IF NOT EXISTS idx_user_events_user_recent
ON public.user_events (user_id, created_at DESC);

-- 3. Profile Last Seen Index
-- Optimizes the "Online" check in the roster
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
ON public.profiles (last_seen DESC)
WHERE last_seen IS NOT NULL;

-- 4. Notification Cleanup Throttling
-- Ensures that many concurrent users don't lock the notifications table on read
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON public.notifications (user_id, read_at NULLS FIRST, created_at DESC);
