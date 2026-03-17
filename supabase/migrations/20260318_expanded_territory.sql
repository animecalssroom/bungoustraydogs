-- Migration: Expanded BSD Territory & Landmarks
-- Adds new lore-accurate districts and updates metadata

-- 1. Create new districts if they don't exist
INSERT INTO districts (id, name, slug, color, description)
VALUES 
    ('suribachi', 'Suribachi City', 'suribachi', '#5d4037', 'A massive crater formed by an unknown explosion. Now a lawless slum and the birthplace of the Sheep.'),
    ('tsurumi', 'Tsurumi District', 'tsurumi', '#2e7d32', 'A quiet residential district often monitored by the Hunting Dogs for abnormal ability signatures.'),
    ('northern_wards', 'Northern Wards', 'northern_wards', '#37474f', 'Heavy industrial heart of Yokohama. High concentration of Guild-owned shipping containers.'),
    ('standard_island', 'Standard Island', 'standard_island', '#00bcd4', 'A floating artificial island territory. Critical for international ability treaties and maritime trade.')
ON CONFLICT (id) DO UPDATE SET 
    slug = EXCLUDED.slug,
    color = EXCLUDED.color,
    description = EXCLUDED.description;

-- 2. Update existing districts with refined descriptions
UPDATE districts SET 
    description = 'The tactical center of Yokohama. Home to the Special Operations Division and the Registry.'
WHERE id = 'kannai';

UPDATE districts SET 
    description = 'Port Mafia''s stronghold. The three black skyscrapers dominate the skyline here.'
WHERE id = 'harbor';

UPDATE districts SET 
    description = 'The vibrant waterfront where the Armed Detective Agency operates from their red-brick office.'
WHERE id = 'waterfront';

-- 3. Ensure all have coordinates (placeholder for legacy support)
UPDATE districts SET coordinates = '{"lat": 0, "lng": 0}' WHERE coordinates IS NULL;
