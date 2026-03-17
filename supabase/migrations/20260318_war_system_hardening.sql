-- Migration: War System Hardening
-- Adds boss_active and ensure other war-related fields exist

-- 1. Add boss_active to faction_wars
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'faction_wars' AND COLUMN_NAME = 'boss_active') THEN
        ALTER TABLE faction_wars ADD COLUMN boss_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Ensure day2_at and day3_at exist (used for war escalation)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'faction_wars' AND COLUMN_NAME = 'day2_at') THEN
        ALTER TABLE faction_wars ADD COLUMN day2_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'faction_wars' AND COLUMN_NAME = 'day3_at') THEN
        ALTER TABLE faction_wars ADD COLUMN day3_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Ensure chronicle_id exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'faction_wars' AND COLUMN_NAME = 'chronicle_id') THEN
        ALTER TABLE faction_wars ADD COLUMN chronicle_id UUID REFERENCES chronicles(id);
    END IF;
END $$;

-- 4. Ensure updated_at exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'faction_wars' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE faction_wars ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
