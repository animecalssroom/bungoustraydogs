-- Consolidation Migration: Ensure all Profile Columns exist
-- This resolves the "column profiles.character_class does not exist" error and other missing fields.

DO $$ 
BEGIN
    -- 0. Character Identity & Assignment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_name') THEN
        ALTER TABLE public.profiles ADD COLUMN character_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_match_id') THEN
        ALTER TABLE public.profiles ADD COLUMN character_match_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_ability') THEN
        ALTER TABLE public.profiles ADD COLUMN character_ability TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_ability_jp') THEN
        ALTER TABLE public.profiles ADD COLUMN character_ability_jp TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_description') THEN
        ALTER TABLE public.profiles ADD COLUMN character_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_type') THEN
        ALTER TABLE public.profiles ADD COLUMN character_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_assigned_at') THEN
        ALTER TABLE public.profiles ADD COLUMN character_assigned_at TIMESTAMPTZ;
    END IF;

    -- 1. Tactical & Combat Roles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='character_class') THEN
        ALTER TABLE public.profiles ADD COLUMN character_class TEXT DEFAULT 'BRUTE';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='recovery_until') THEN
        ALTER TABLE public.profiles ADD COLUMN recovery_until TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='recovery_status') THEN
        ALTER TABLE public.profiles ADD COLUMN recovery_status TEXT DEFAULT 'active';
    END IF;

    -- 2. Duel System Stats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='duel_wins') THEN
        ALTER TABLE public.profiles ADD COLUMN duel_wins INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='duel_losses') THEN
        ALTER TABLE public.profiles ADD COLUMN duel_losses INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='duel_forfeits') THEN
        ALTER TABLE public.profiles ADD COLUMN duel_forfeits INTEGER DEFAULT 0;
    END IF;

    -- 3. Assignment & Metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='quiz_scores') THEN
        ALTER TABLE public.profiles ADD COLUMN quiz_scores JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avg_move_speed_minutes') THEN
        ALTER TABLE public.profiles ADD COLUMN avg_move_speed_minutes DOUBLE PRECISION DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='secondary_character_slug') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_character_slug TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='secondary_character_name') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_character_name TEXT;
    END IF;

    -- 4. Bot Management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_bot') THEN
        ALTER TABLE public.profiles ADD COLUMN is_bot BOOLEAN DEFAULT FALSE;
    END IF;

    -- 5. Exam Retake System
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='exam_retake_eligible_at') THEN
        ALTER TABLE public.profiles ADD COLUMN exam_retake_eligible_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='exam_retake_used') THEN
        ALTER TABLE public.profiles ADD COLUMN exam_retake_used BOOLEAN DEFAULT FALSE;
    END IF;

    -- 6. UI & Guide
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='guide_bot_dismissed') THEN
        ALTER TABLE public.profiles ADD COLUMN guide_bot_dismissed BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='guide_bot_opened_at') THEN
        ALTER TABLE public.profiles ADD COLUMN guide_bot_opened_at TIMESTAMPTZ;
    END IF;

END $$;
