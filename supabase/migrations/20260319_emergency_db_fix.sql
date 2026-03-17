-- Migration: Emergency Schema Fix & Lore Sync
-- Resolves missing columns and synchronizes districts with Yokohama Tactical Map V2 Lore

DO $$ 
BEGIN
    -- 1. Ensure faction_wars has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_wars' AND column_name='resolved_at') THEN
        ALTER TABLE faction_wars ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_wars' AND column_name='created_at') THEN
        ALTER TABLE faction_wars ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_wars' AND column_name='updated_at') THEN
        ALTER TABLE faction_wars ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faction_wars' AND column_name='chronicle_id') THEN
        ALTER TABLE faction_wars ADD COLUMN chronicle_id UUID;
    END IF;

    -- 2. Ensure districts has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='districts' AND column_name='created_at') THEN
        ALTER TABLE districts ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='districts' AND column_name='slug') THEN
        ALTER TABLE districts ADD COLUMN slug TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='districts' AND column_name='controlling_faction') THEN
        ALTER TABLE districts ADD COLUMN controlling_faction TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='districts' AND column_name='ap_pool') THEN
        ALTER TABLE districts ADD COLUMN ap_pool INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Sync districts with Yokohama Tactical Map V2 Lore
INSERT INTO districts (id, name, slug, description, color, points_required, current_points, ap_pool)
VALUES 
  (gen_random_uuid(), 'Yokohama Port', 'yokohama-port', 'Sector 00: The industrial heart and Mafia stronghold.', '#5a0000', 50000, 0, 0),
  (gen_random_uuid(), 'Minato Mirai', 'minato-mirai', 'Sector 01: Modernized waterfront under Agency protection.', '#0f2d52', 20000, 0, 0),
  (gen_random_uuid(), 'Kannai Center', 'kannai-center', 'Sector 02: Commercial heart and Guild territory.', '#4a3800', 30000, 0, 0),
  (gen_random_uuid(), 'Chinatown', 'chinatown', 'Sector 03: Ancient foreign settlement and neutral ground.', '#5a4400', 15000, 0, 0),
  (gen_random_uuid(), 'Tsurumi District', 'tsurumi-district', 'Sector 04: Industrial corridor held by Hunting Dogs.', '#0f1e38', 25000, 0, 0),
  (gen_random_uuid(), 'Honmoku Area', 'honmoku-area', 'Sector 05: Dark streets and Mafia heartland.', '#3a0000', 35000, 0, 0),
  (gen_random_uuid(), 'Motomachi', 'motomachi', 'Sector 06: European shopping street under Special Div.', '#0f3828', 20000, 0, 0),
  (gen_random_uuid(), 'Northern Wards', 'northern-wards', 'Sector 07: Administrative north, frequently contested.', '#1a1a2a', 10000, 0, 0),
  (gen_random_uuid(), 'Suribachi City', 'suribachi-city', 'Sector 08: The crater hills, unwatched and dangerous.', '#141414', 15000, 0, 0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  points_required = EXCLUDED.points_required;

-- 4. Set default owners (initial state)
UPDATE districts SET controlling_faction = 'mafia' WHERE slug IN ('yokohama-port', 'honmoku-area');
UPDATE districts SET controlling_faction = 'agency' WHERE slug = 'minato-mirai';
UPDATE districts SET controlling_faction = 'guild' WHERE slug IN ('kannai-center', 'chinatown');
UPDATE districts SET controlling_faction = 'hunting_dogs' WHERE slug = 'tsurumi-district';
UPDATE districts SET controlling_faction = 'special_div' WHERE slug = 'motomachi';
UPDATE districts SET controlling_faction = 'neutral' WHERE controlling_faction IS NULL;
