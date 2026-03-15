-- Migration: UI & Data Polish (Prompt 7)
-- Date: 2026-03-15

-- 1. Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Districts
INSERT INTO districts (id, name, description) VALUES
('kannai', 'Kannai District', 'The administrative and commercial heart of Yokohama, housing the Special Division and the Agency.'),
('chinatown', 'Chinatown', 'A vibrant, crowded district with deep alleys, often used as a neutral ground or hiding spot.'),
('harbor', 'Port of Yokohama', 'The lifeblood of the city and the absolute territory of the Port Mafia.'),
('motomachi', 'Motomachi', 'An upscale shopping district where the transition between light and dark is most visible.'),
('honmoku', 'Honmoku', 'A coastal area with a mix of industrial and residential zones, home to forgotten archives.'),
('waterfront', 'Minato Mirai Waterfront', 'A modern, futuristic facade of the city where The Guild often conducts business.'),
('tsurumi', 'Tsurumi District', 'The industrial outskirts where the city''s noise fades into a grinding silence.')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. Chronicles Table (Internal/Unpublished)
CREATE TABLE IF NOT EXISTS chronicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES auth.users(id),
    category TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial unpublished chronicles
INSERT INTO chronicles (title, slug, content, excerpt, category, is_published) VALUES
('The Dragon Head Conflict', 'dragon-head-conflict', 'A detailed report on the 88-day conflict that reshaped Yokohama''s underworld...', 'The bloodiest 88 days in the city''s history.', 'History', false),
('Special Division Case File #001', 'special-division-case-001', 'An analysis of the events leading to the formation of the current Three-Way Deadlock...', 'The origin of the city''s fragile peace.', 'Files', false)
ON CONFLICT (slug) DO NOTHING;

-- 3. Update character ability types in profiles if they are null
-- (Optional cleanup, but good for data consistency)
UPDATE profiles SET character_type = 'destruction' WHERE character_name IN ('Atsushi Nakajima', 'Ryunosuke Akutagawa') AND character_type IS NULL;
UPDATE profiles SET character_type = 'manipulation' WHERE character_name IN ('Osamu Dazai', 'Chuya Nakahara') AND character_type IS NULL;
UPDATE profiles SET character_type = 'analysis' WHERE character_name IN ('Ranpo Edogawa', 'Ango Sakaguchi') AND character_type IS NULL;
