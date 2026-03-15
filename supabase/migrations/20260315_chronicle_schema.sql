CREATE TABLE IF NOT EXISTS chronicle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number integer UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  entry_type text DEFAULT 'chapter',
  -- types: chapter | war_record | duel_record | character_event | scenario_outcome | player_submission
  faction_focus text,
  author_id uuid REFERENCES profiles(id),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE chronicle_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "chronicle_public_read" ON chronicle_entries;
DROP POLICY IF EXISTS "chronicle_owner_write" ON chronicle_entries;

CREATE POLICY "chronicle_public_read" ON chronicle_entries
  FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "chronicle_owner_write" ON chronicle_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'mod')
    )
  );

-- Create sequence for entry numbers if needed (though we're providing them in seeds)
CREATE SEQUENCE IF NOT EXISTS chronicle_seq START 1;

-- Seed placeholder entries
INSERT INTO chronicle_entries 
  (entry_number, title, content, entry_type, published_at) VALUES
(1, 'Unregistered Signal — Kannai Station', 
 'An unregistered ability signature was detected near Kannai Station. Three organisations have registered interest. No claim has been filed.',
 'chapter', NULL),
(2, 'Blank Notebooks — Harbor District',
 'The Registry has received reports of a figure seen at the waterfront distributing blank notebooks. Recipients have not been identified.',
 'chapter', NULL),
(3, 'Honmoku Under Observation',
 'Following recent territorial disputes, the district of Honmoku remains under joint observation. The city has not assigned authority.',
 'war_record', NULL),
(4, 'Simultaneous Signatures',
 'Special Division records indicate three simultaneous ability signatures in unregistered locations. The pattern has been flagged.',
 'character_event', NULL)
ON CONFLICT (entry_number) DO NOTHING;
