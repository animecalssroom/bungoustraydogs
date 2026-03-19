UPDATE public.faction_wars
SET
  status = 'complete',
  winner_id = NULL,
  resolved_at = NOW(),
  updated_at = NOW(),
  war_message = COALESCE(war_message, '') || E'\n\n[CEASEFIRE ORDER] All active wars were manually halted for system reset and retesting.'
WHERE status != 'complete';
