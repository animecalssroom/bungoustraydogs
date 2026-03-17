-- Migration: Fix Missing Timestamps & Ensure Schema Consistency
-- Resolves: 42703 column districts.created_at does not exist

DO $$ 
BEGIN
    -- Fix districts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='districts' AND column_name='created_at') THEN
        ALTER TABLE districts ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Ensure faction_wars has created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_wars' AND column_name='created_at') THEN
        ALTER TABLE faction_wars ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Ensure faction_messages has created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_messages' AND column_name='created_at') THEN
        ALTER TABLE faction_messages ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Ensure faction_bulletins has created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_bulletins' AND column_name='created_at') THEN
        ALTER TABLE faction_bulletins ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;
