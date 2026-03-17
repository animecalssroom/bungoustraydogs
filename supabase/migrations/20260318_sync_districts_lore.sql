-- Sync districts with Yokohama Tactical Map V2 Lore
-- Merges Harbor District and Standard Island into Yokohama Port
-- Updates all other districts to match BSD lore-accurate names and slugs

-- 1. Upsert districts with new slugs and lore names
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

-- 2. Cleanup old districts that might still exist with old slugs
DELETE FROM districts 
WHERE slug NOT IN (
  'yokohama-port', 
  'minato-mirai', 
  'kannai-center', 
  'chinatown', 
  'tsurumi-district', 
  'honmoku-area', 
  'motomachi', 
  'northern-wards', 
  'suribachi-city'
);

-- 3. Set default owners (initial state)
UPDATE districts SET controlling_faction = 'mafia' WHERE slug IN ('yokohama-port', 'honmoku-area');
UPDATE districts SET controlling_faction = 'agency' WHERE slug = 'minato-mirai';
UPDATE districts SET controlling_faction = 'guild' WHERE slug IN ('kannai-center', 'chinatown');
UPDATE districts SET controlling_faction = 'hunting_dogs' WHERE slug = 'tsurumi-district';
UPDATE districts SET controlling_faction = 'special_div' WHERE slug = 'motomachi';
