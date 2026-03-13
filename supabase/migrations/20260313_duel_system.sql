create table if not exists duels (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references profiles(id) on delete cascade,
  defender_id uuid not null references profiles(id) on delete cascade,
  challenger_character text,
  defender_character text,
  challenger_character_slug text,
  defender_character_slug text,
  challenger_faction text not null,
  defender_faction text not null,
  status text default 'pending',
  current_round integer default 0,
  challenger_hp integer default 100,
  defender_hp integer default 100,
  challenger_max_hp integer default 100,
  defender_max_hp integer default 100,
  winner_id uuid references profiles(id),
  loser_id uuid references profiles(id),
  ap_awarded boolean default false,
  is_ranked boolean default false,
  is_war_duel boolean default false,
  war_id uuid,
  challenger_came_back boolean default false,
  defender_came_back boolean default false,
  decline_reason text,
  challenge_message text,
  challenge_expires_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists duel_rounds (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references duels(id) on delete cascade,
  round_number integer not null,
  challenger_move text,
  challenger_override_character text,
  challenger_move_submitted_at timestamptz,
  defender_move text,
  defender_move_submitted_at timestamptz,
  round_started_at timestamptz default now(),
  round_deadline timestamptz,
  reversal_available boolean default false,
  reversal_deadline timestamptz,
  reversal_used boolean default false,
  challenger_damage_dealt integer default 0,
  defender_damage_dealt integer default 0,
  challenger_hp_after integer,
  defender_hp_after integer,
  special_events jsonb default '[]',
  narrative text,
  narrative_is_fallback boolean default false,
  resolved_at timestamptz,
  unique(duel_id, round_number)
);

create table if not exists open_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references profiles(id) on delete cascade,
  faction text not null,
  character_name text,
  message text,
  status text default 'open',
  accepted_by uuid references profiles(id),
  duel_id uuid references duels(id),
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

create table if not exists duel_cooldowns (
  id uuid primary key default gen_random_uuid(),
  duel_id uuid not null references duels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  ability_type text not null,
  locked_until_round integer not null,
  unique(duel_id, user_id, ability_type)
);

create table if not exists global_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null unique,
  description text,
  occurred_at timestamptz default now(),
  payload jsonb default '{}'
);

alter table profiles
  add column if not exists duel_wins integer default 0,
  add column if not exists duel_losses integer default 0,
  add column if not exists duel_forfeits integer default 0,
  add column if not exists avg_move_speed_minutes float,
  add column if not exists secondary_character_slug text,
  add column if not exists secondary_character_name text;

alter table notifications
  add column if not exists action_url text,
  add column if not exists reference_id uuid;

create index if not exists idx_duels_challenger on duels(challenger_id, status);
create index if not exists idx_duels_defender on duels(defender_id, status);
create index if not exists idx_duels_status on duels(status, created_at);
create index if not exists idx_rounds_duel on duel_rounds(duel_id, round_number);
create index if not exists idx_rounds_deadline on duel_rounds(round_deadline) where resolved_at is null;
create index if not exists idx_open_challenges on open_challenges(status, expires_at);

alter table duels enable row level security;
alter table duel_rounds enable row level security;
alter table open_challenges enable row level security;
alter table duel_cooldowns enable row level security;

drop policy if exists "duels_own" on duels;
create policy "duels_own" on duels for select
  using (auth.uid() = challenger_id or auth.uid() = defender_id);

drop policy if exists "duels_ranked_public" on duels;
create policy "duels_ranked_public" on duels for select
  using (is_ranked = true);

drop policy if exists "duels_insert_member" on duels;
create policy "duels_insert_member" on duels for insert
  with check (exists (
    select 1 from profiles
    where id = auth.uid() and role in ('member', 'mod', 'owner')
  ));

drop policy if exists "duels_update_participants" on duels;
create policy "duels_update_participants" on duels for update
  using (auth.uid() = challenger_id or auth.uid() = defender_id);

drop policy if exists "duels_owner_all" on duels;
create policy "duels_owner_all" on duels for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

drop policy if exists "rounds_participants" on duel_rounds;
create policy "rounds_participants" on duel_rounds for select
  using (exists (
    select 1 from duels
    where duels.id = duel_id
      and (challenger_id = auth.uid() or defender_id = auth.uid())
  ));

drop policy if exists "rounds_ranked" on duel_rounds;
create policy "rounds_ranked" on duel_rounds for select
  using (exists (
    select 1 from duels where duels.id = duel_id and is_ranked = true
  ));

drop policy if exists "open_challenges_read" on open_challenges;
create policy "open_challenges_read" on open_challenges for select using (true);

drop policy if exists "open_challenges_own_write" on open_challenges;
create policy "open_challenges_own_write" on open_challenges for insert
  with check (auth.uid() = challenger_id);

drop policy if exists "open_challenges_own_update" on open_challenges;
create policy "open_challenges_own_update" on open_challenges for update
  using (auth.uid() = challenger_id or auth.uid() = accepted_by);

drop policy if exists "cooldowns_participants" on duel_cooldowns;
create policy "cooldowns_participants" on duel_cooldowns for select
  using (exists (
    select 1 from duels
    where duels.id = duel_id
      and (challenger_id = auth.uid() or defender_id = auth.uid())
  ));

-- Helpful indexes to reduce heavy read/scan patterns observed in guide-bot and bot schedules
create index if not exists idx_guide_bot_messages_user_created on guide_bot_messages(user_id, created_at);
create index if not exists idx_transmission_logs_user_created on transmission_logs(user_id, created_at);
create index if not exists idx_user_events_user_type on user_events(user_id, event_type);
