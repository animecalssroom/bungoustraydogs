-- Support desk and bot gameplay schema (2026-03-13)

-- -----------------------------------------------------------------------------
-- SUPPORT TICKETS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  queue text NOT NULL CHECK (queue IN ('owner', 'special_division')),
  category text NOT NULL CHECK (
    category IN (
      'assignment',
      'intake',
      'faction',
      'registry',
      'lore',
      'account',
      'bug',
      'special_division'
    )
  ),
  subject text NOT NULL,
  details text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
  response_note text,
  handled_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- CONTENT FLAGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  queue text NOT NULL CHECK (queue IN ('owner', 'special_division')),
  entity_type text NOT NULL CHECK (entity_type IN ('lore_post', 'registry_post', 'comment')),
  entity_id uuid NOT NULL,
  target_path text NOT NULL,
  target_label text,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  action_taken text,
  handled_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- BOT GAMEPLAY PROFILE FLAGS
-- -----------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_config jsonb,
  ADD COLUMN IF NOT EXISTS character_reveal_shown boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_bot_post_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_bot_paused boolean DEFAULT false;

ALTER TABLE faction_messages
  ADD COLUMN IF NOT EXISTS is_bot_post boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_replied_to text;

ALTER TABLE registry_posts
  ADD COLUMN IF NOT EXISTS is_bot_post boolean DEFAULT false;

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_status
  ON support_tickets(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_queue_status
  ON support_tickets(queue, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_content_flags_reporter_status
  ON content_flags(reporter_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_flags_queue_status
  ON content_flags(queue, status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_profiles_is_bot
  ON profiles(is_bot)
  WHERE is_bot = true;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_own_select'
  ) THEN
    CREATE POLICY support_tickets_own_select ON support_tickets
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_own_insert'
  ) THEN
    CREATE POLICY support_tickets_own_insert ON support_tickets
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_staff_select'
  ) THEN
    CREATE POLICY support_tickets_staff_select ON support_tickets
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE id = auth.uid()
            AND (
              role = 'owner'
              OR (role = 'mod' AND faction = 'special_div' AND queue = 'special_division')
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'support_tickets' AND policyname = 'support_tickets_staff_update'
  ) THEN
    CREATE POLICY support_tickets_staff_update ON support_tickets
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE id = auth.uid()
            AND (
              role = 'owner'
              OR (role = 'mod' AND faction = 'special_div' AND queue = 'special_division')
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_flags' AND policyname = 'content_flags_own_select'
  ) THEN
    CREATE POLICY content_flags_own_select ON content_flags
      FOR SELECT
      USING (auth.uid() = reporter_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_flags' AND policyname = 'content_flags_own_insert'
  ) THEN
    CREATE POLICY content_flags_own_insert ON content_flags
      FOR INSERT
      WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_flags' AND policyname = 'content_flags_staff_select'
  ) THEN
    CREATE POLICY content_flags_staff_select ON content_flags
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE id = auth.uid()
            AND (
              role = 'owner'
              OR (role = 'mod' AND faction = 'special_div' AND queue = 'special_division')
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_flags' AND policyname = 'content_flags_staff_update'
  ) THEN
    CREATE POLICY content_flags_staff_update ON content_flags
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE id = auth.uid()
            AND (
              role = 'owner'
              OR (role = 'mod' AND faction = 'special_div' AND queue = 'special_division')
            )
        )
      );
  END IF;
END $$;
