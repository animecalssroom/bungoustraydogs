-- Migration: Tactical Roles & War Recovery
-- Date: 2026-03-22

-- 1. Profiles Update
-- character_class stores the tactical role (INTEL, MEDIC, etc.)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS character_class TEXT DEFAULT 'BRUTE';

-- 2. Characters Table Update (if exists)
-- Supports central role management
ALTER TABLE IF EXISTS public.characters 
ADD COLUMN IF NOT EXISTS class_tag TEXT;

ALTER TABLE IF EXISTS public.character_profiles 
ADD COLUMN IF NOT EXISTS class_tag TEXT;

-- 3. Recovery Fields (already exist in some form, but ensuring consistency)
-- recovery_until: Timestamptz for when the lockout ends
-- recovery_status: Why they are in recovery (e.g., 'wounded', 'mia', 'defeated')
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS recovery_until timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recovery_status TEXT DEFAULT 'active';

-- Index for searching users in recovery (e.g., for healers)
CREATE INDEX IF NOT EXISTS idx_profiles_recovery_v2
ON public.profiles (recovery_until) 
WHERE recovery_until IS NOT NULL;

-- 4. Initial Seed for existing profiles (optional but helpful)
-- Mapping common slugs to classes
UPDATE public.profiles SET character_class = 'INTEL' WHERE character_match_id IN ('ango-sakaguchi', 'edgar-allan-poe', 'jouno-saigiku');
UPDATE public.profiles SET character_class = 'STRATEGIST' WHERE character_match_id IN ('ranpo-edogawa', 'fukuzawa-yukichi', 'mori-ogai', 'fyodor-dostoevsky', 'agatha-christie', 'tachihara-michizou');
UPDATE public.profiles SET character_class = 'MEDIC' WHERE character_match_id IN ('akiko-yosano');
UPDATE public.profiles SET character_class = 'SUPPORT' WHERE character_match_id IN ('naomi-tanizaki');
UPDATE public.profiles SET character_class = 'ANOMALY' WHERE character_match_id IN ('dazai-osamu', 'sigma', 'junichiro-tanizaki', 'kyouka-izumi', 'lucy-montgomery', 'nikolai-gogol', 'bram-stoker', 'oscar-wilde');
