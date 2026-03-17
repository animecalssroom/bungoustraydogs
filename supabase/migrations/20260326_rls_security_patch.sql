-- SECURITY PATCH: Enable RLS and define policies for public tables
-- Identified by Supabase Linter (2026-03-26)

-- 1. Districts
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "districts_public_read" ON public.districts;
CREATE POLICY "districts_public_read" ON public.districts FOR SELECT USING (true);
DROP POLICY IF EXISTS "districts_admin_all" ON public.districts;
CREATE POLICY "districts_admin_all" ON public.districts FOR ALL 
  USING (exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- 2. Lore Posts
ALTER TABLE public.lore_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lore_posts_public_read" ON public.lore_posts;
CREATE POLICY "lore_posts_public_read" ON public.lore_posts FOR SELECT 
  USING (is_published = true OR exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
DROP POLICY IF EXISTS "lore_posts_admin_all" ON public.lore_posts;
CREATE POLICY "lore_posts_admin_all" ON public.lore_posts FOR ALL
  USING (exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- 3. Arena Votes
ALTER TABLE public.arena_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arena_votes_read_own" ON public.arena_votes;
CREATE POLICY "arena_votes_read_own" ON public.arena_votes FOR SELECT 
  USING (auth.uid() = user_id OR exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
DROP POLICY IF EXISTS "arena_votes_insert_own" ON public.arena_votes;
CREATE POLICY "arena_votes_insert_own" ON public.arena_votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 4. Global Events
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "global_events_public_read" ON public.global_events;
CREATE POLICY "global_events_public_read" ON public.global_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "global_events_admin_all" ON public.global_events;
CREATE POLICY "global_events_admin_all" ON public.global_events FOR ALL
  USING (exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- 5. User Characters
ALTER TABLE public.user_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_characters_read_all" ON public.user_characters;
CREATE POLICY "user_characters_read_all" ON public.user_characters FOR SELECT USING (true);
DROP POLICY IF EXISTS "user_characters_own_all" ON public.user_characters;
CREATE POLICY "user_characters_own_all" ON public.user_characters FOR ALL
  USING (auth.uid() = user_id OR exists (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
