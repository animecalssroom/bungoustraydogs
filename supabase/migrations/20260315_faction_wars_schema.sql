-- Faction Wars Schema
create type war_status as enum ('pending', 'active', 'day2', 'day3', 'complete');
create type war_stakes_type as enum ('district', 'ap_multiplier', 'registry_priority', 'narrative');

create table if not exists faction_wars (
  id uuid primary key default gen_random_uuid(),
  faction_a_id text not null, -- references factions(id)
  faction_b_id text not null,
  status war_status default 'pending',
  stakes war_stakes_type not null,
  stakes_detail jsonb default '{}', -- e.g. { "district": "harbor" } or { "multiplier": 1.5 }
  faction_a_points integer default 0,
  faction_b_points integer default 0,
  winner_id text, -- faction ID
  war_message text, -- Ango's declaration
  chronicle_id uuid, -- link to chronicle entry generated
  starts_at timestamptz,
  day2_at timestamptz,
  day3_at timestamptz,
  ends_at timestamptz,
  resolved_at timestamptz,
  boss_active boolean default false,
  created_at timestamptz default now(),
  constraint different_factions check (faction_a_id <> faction_b_id)
);

create table if not exists war_contributions (
  id uuid primary key default gen_random_uuid(),
  war_id uuid not null references faction_wars(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  contribution_type text not null, -- duel_win | registry_post | daily_login | team_fight | boss_fight
  points integer not null,
  reference_id uuid, -- duel_id or post_id
  created_at timestamptz default now()
);

-- Registry update
alter table registry_posts add column if not exists is_war_related boolean default false;

-- Duels update
alter table duels add column if not exists is_war_duel boolean default false;
alter table duels add column if not exists war_id uuid references faction_wars(id);
alter table duels add column if not exists is_tag_team boolean default false;
alter table duels add column if not exists is_faction_raid boolean default false;
alter table duels add column if not exists is_boss_fight boolean default false;

-- RLS
alter table faction_wars enable row level security;
alter table war_contributions enable row level security;

create policy "faction_wars_public_read" on faction_wars for select using (true);
create policy "war_contributions_public_read" on war_contributions for select using (true);

-- Indexes
create index idx_war_status on faction_wars(status);
create index idx_war_contributions_war_user on war_contributions(war_id, user_id);
create index idx_war_contributions_type on war_contributions(contribution_type);

-- RPC for top contributors
create or replace function get_war_top_contributors(p_war_id uuid)
returns table (user_id uuid, total_points bigint) as $$
begin
  return query
  select wc.user_id, sum(wc.points) as total_points
  from war_contributions wc
  where wc.war_id = p_war_id
  group by wc.user_id
  order by total_points desc
  limit 2;
end;
$$ language plpgsql security definer;

-- Reward function
create or replace function reward_faction_members(p_faction_id text, p_ap_amount integer, p_war_id uuid, p_is_winner boolean)
returns void as $$
begin
  -- Update profiles
  update profiles
  set ap_total = ap_total + p_ap_amount
  where faction = p_faction_id;

  -- Log events
  insert into user_events (user_id, event_type, ap_awarded, faction, metadata)
  select id, 'faction_event', p_ap_amount, faction, jsonb_build_object('war_id', p_war_id, 'result', case when p_is_winner then 'win' else 'participation' end)
  from profiles
  where faction = p_faction_id;
end;
$$ language plpgsql security definer;
