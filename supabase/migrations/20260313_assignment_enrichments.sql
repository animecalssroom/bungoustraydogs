alter table profiles
  add column if not exists quiz_scores jsonb default '{}',
  add column if not exists secondary_character_slug text,
  add column if not exists secondary_character_name text,
  add column if not exists avg_move_speed_minutes double precision;

alter table duel_rounds
  add column if not exists challenger_move_submitted_at timestamptz,
  add column if not exists defender_move_submitted_at timestamptz;
