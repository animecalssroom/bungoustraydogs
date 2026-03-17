-- EMERGENCY PERFORMANCE TUNING
-- Target: queries that are causing 20s+ latency under load

-- 1. Index for checking existing duels between two players
CREATE INDEX IF NOT EXISTS idx_duels_pair_active ON duels(challenger_id, defender_id) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_duels_pair_active_rev ON duels(defender_id, challenger_id) WHERE status IN ('pending', 'active');

-- 2. Index for getActiveWar
CREATE INDEX IF NOT EXISTS idx_faction_wars_active_created ON faction_wars(status, created_at DESC) WHERE status != 'complete';

-- 3. Index for getPendingChallengesForUser/getInbox
CREATE INDEX IF NOT EXISTS idx_duels_pending_defender ON duels(defender_id, status, challenge_expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_duels_pending_challenger ON duels(challenger_id, status, challenge_expires_at) WHERE status = 'pending';

-- 4. Registry posts during wars (Conditional)
-- 4. Registry posts during wars (Conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='registry_posts' AND column_name='is_war_related') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_registry_posts_war_related ON registry_posts(is_war_related) WHERE is_war_related = true';
  END IF;
END $$;
