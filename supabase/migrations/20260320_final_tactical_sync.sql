-- FINAL TACTICAL SYNC: SCHEMA + LORE + MECHANICS
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ALL WAR ERRORS

-- 1. BASE SCHEMA (FACTION WARS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'war_status') THEN
        CREATE TYPE war_status AS ENUM ('pending', 'active', 'day2', 'day3', 'complete');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'war_stakes_type') THEN
        CREATE TYPE war_stakes_type AS ENUM ('district', 'ap_multiplier', 'registry_priority', 'narrative');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS faction_wars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_a_id TEXT NOT NULL,
    faction_b_id TEXT NOT NULL,
    status war_status DEFAULT 'pending',
    stakes war_stakes_type NOT NULL,
    stakes_detail JSONB DEFAULT '{}',
    faction_a_points INTEGER DEFAULT 0,
    faction_b_points INTEGER DEFAULT 0,
    winner_id TEXT,
    war_message TEXT,
    chronicle_id UUID,
    starts_at TIMESTAMPTZ,
    day2_at TIMESTAMPTZ,
    day3_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    boss_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT different_factions CHECK (faction_a_id <> faction_b_id)
);

CREATE TABLE IF NOT EXISTS war_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    war_id UUID NOT NULL REFERENCES faction_wars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contribution_type TEXT NOT NULL,
    points INTEGER NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DISTRICTS SCHEMA UPDATES
ALTER TABLE districts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS controlling_faction TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS ap_pool INTEGER DEFAULT 0;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS points_required INTEGER DEFAULT 10000;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS current_points INTEGER DEFAULT 0;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS last_flip_at TIMESTAMPTZ;

-- 3. LORE SYNC (2026 REVISION)
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

-- 4. INITIAL OWNERSHIP
UPDATE districts SET controlling_faction = 'mafia' WHERE slug IN ('yokohama-port', 'honmoku-area');
UPDATE districts SET controlling_faction = 'agency' WHERE slug = 'minato-mirai';
UPDATE districts SET controlling_faction = 'guild' WHERE slug IN ('kannai-center', 'chinatown');
UPDATE districts SET controlling_faction = 'hunting_dogs' WHERE slug = 'tsurumi-district';
UPDATE districts SET controlling_faction = 'special_div' WHERE slug = 'motomachi';
UPDATE districts SET controlling_faction = 'neutral' WHERE controlling_faction IS NULL;

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION get_war_top_contributors(p_war_id UUID)
RETURNS TABLE (user_id UUID, total_points BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT wc.user_id, SUM(wc.points) AS total_points
  FROM war_contributions wc
  WHERE wc.war_id = p_war_id
  GROUP BY wc.user_id
  ORDER BY total_points DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS & POLICIES
ALTER TABLE faction_wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faction_wars_public_read" ON faction_wars;
CREATE POLICY "faction_wars_public_read" ON faction_wars FOR SELECT USING (true);
DROP POLICY IF EXISTS "war_contributions_public_read" ON war_contributions;
CREATE POLICY "war_contributions_public_read" ON war_contributions FOR SELECT USING (true);
