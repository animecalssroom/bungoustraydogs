-- Additional Scaling Indices for War Mode and Archive
-- Optimizes Faction War lookups and Archive slug resolution

-- 1. Faction War Status Index
-- Optimizes active war lookups and history
CREATE INDEX IF NOT EXISTS idx_faction_wars_status_factions
ON public.faction_wars (status, faction_a_id, faction_b_id);

-- 2. Archive Slug Index
-- Optimizes deep-linked character entries
CREATE INDEX IF NOT EXISTS idx_archive_entries_slug
ON public.archive_entries (slug);

-- 3. Open Challenges Index
-- Optimizes war targets/strikes logic
CREATE INDEX IF NOT EXISTS idx_open_challenges_faction_status
ON public.open_challenges (faction, status, expires_at DESC);
