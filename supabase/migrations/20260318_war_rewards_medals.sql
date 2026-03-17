-- Add medals and titles to profiles for war rewards
alter table profiles add column if not exists medals jsonb default '[]';
alter table profiles add column if not exists titles jsonb default '[]';

-- Update reward_faction_members to optionally award a medal
create or replace function reward_faction_members_v2(
  p_faction_id text, 
  p_ap_amount integer, 
  p_war_id uuid, 
  p_is_winner boolean,
  p_medal_details jsonb default null
)
returns void as $$
begin
  -- Update profiles with AP
  update profiles
  set ap_total = ap_total + p_ap_amount
  where faction = p_faction_id;

  -- Award medal if provided
  if p_medal_details is not null then
    update profiles
    set medals = medals || p_medal_details
    where faction = p_faction_id;
  end if;

  -- Log events
  insert into user_events (user_id, event_type, ap_awarded, faction, metadata)
  select id, 'faction_event', p_ap_amount, faction, jsonb_build_object(
    'war_id', p_war_id, 
    'result', case when p_is_winner then 'win' else 'participation' end,
    'medal_awarded', p_medal_details is not null
  )
  from profiles
  where faction = p_faction_id;
end;
$$ language plpgsql security definer;
