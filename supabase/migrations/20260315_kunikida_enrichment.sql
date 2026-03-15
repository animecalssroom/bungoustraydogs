-- Migration: Kunikida Enrichment & Extended Archive Fields
-- Date: 2026-03-15

ALTER TABLE archive_entries 
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS clearance_level TEXT,
ADD COLUMN IF NOT EXISTS ability_analysis TEXT,
ADD COLUMN IF NOT EXISTS lore_background TEXT,
ADD COLUMN IF NOT EXISTS physical_evidence TEXT[],
ADD COLUMN IF NOT EXISTS narrative_hook TEXT,
ADD COLUMN IF NOT EXISTS duel_voice TEXT,
ADD COLUMN IF NOT EXISTS literary_link TEXT,
ADD COLUMN IF NOT EXISTS special_mechanic TEXT;

-- Update Kunikida with the new data
UPDATE archive_entries SET
    designation = 'The Idealist / The Keystone',
    clearance_level = 'Level 3 (Field Commander)',
    ability_analysis = 'A manifestation ability tied to his physical notebook. By writing the name of an object and tearing out a page, he can materialize that object into reality. Limitation: The object cannot be larger than the notebook itself.',
    lore_background = 'A former math teacher with a rigid moral compass. He is the Agency’s primary disciplinarian and the successor-designate to Director Fukuzawa. His life is governed by his "Ideals"—a series of notebooks detailing how the world should be. While he finds Dazai infuriating, their partnership remains the most effective tactical duo in the city’s history.',
    physical_evidence = ARRAY[
      'One (1) "Ideals" Notebook: Custom-bound, currently on volume #72.',
      'A Precision Stopwatch: Calibrated daily to the millisecond.',
      'A Broken Fountain Pen: Replaced frequently due to "stress-induced gripping" during arguments with Dazai.'
    ],
    narrative_hook = 'Kunikida doesn''t just want to save the city; he wants to save it according to a schedule. He is the bridge between the Agency''s chaos and the city''s order. If his notebook ever runs out of pages, the Agency loses its compass.',
    registry_note = 'This ability is unique because its power is directly proportional to the Subject''s mental discipline. If his resolve wavers, the manifestations fail.'
WHERE slug = 'kunikida-doppo';
