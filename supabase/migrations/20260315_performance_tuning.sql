-- 1. Index Tuning for AP Throttling and Notifications
-- This makes the check 'select count(*) from user_events where user_id = ? and event_type = ? and created_at > ?' near instant.
create index if not exists idx_user_events_perf_check 
  on public.user_events (user_id, event_type, created_at);

-- Main feed optimization
create index if not exists idx_registry_posts_feed_perf
  on public.registry_posts (status, created_at desc)
  where status = 'approved';

-- 2. Atomic Case Number Generation
-- Prevents 3 manual count(*) roundtrips in registry.model.ts
create or replace function public.generate_registry_case_number(
  p_faction text,
  p_post_type text
) returns text as $$
declare
  v_initial text;
  v_seq_name text;
  v_seq_val bigint;
  v_suffix text;
  v_year text := to_char(now(), 'YYYY');
begin
  v_initial := case p_faction
    when 'agency' then 'A'
    when 'mafia' then 'M'
    when 'guild' then 'G'
    when 'hunting_dogs' then 'D'
    when 'special_div' then 'S'
    else 'X'
  end;

  v_suffix := case p_post_type
    when 'field_note' then '-FN'
    else ''
  end;

  -- Use a central sequence for all posts to ensure atomic integrity
  v_seq_val := nextval('public.registry_case_seq');

  return 'YKH-' || v_initial || '-' || v_year || v_suffix || '-' || lpad(v_seq_val::text, 4, '0');
end;
$$ language plpgsql security definer;

-- Ensure sequence exists
do $$
begin
  create sequence if not exists public.registry_case_seq start with 50; -- start above existing seeds
exception
  when others then null;
end;
$$;

-- 3. Faction Space Consolidation RPC
-- Combines 5 queries into 1 to load the Faction Private Space in one flight.
create or replace function public.get_faction_space_data(
  p_faction_id text,
  p_viewer_id uuid
) returns json as $$
declare
  v_bulletins json;
  v_activity json;
  v_roster json;
  v_messages json;
  v_pending json;
  v_waitlist json;
begin
  -- 1. Bulletins (Pinned first, then newest)
  select json_agg(t) into v_bulletins from (
    select * from public.faction_bulletins 
    where faction_id = p_faction_id 
    order by pinned desc, created_at desc 
    limit 10
  ) t;

  -- 2. Activity Feed
  select json_agg(t) into v_activity from (
    select * from public.faction_activity 
    where faction_id = p_faction_id 
    order by created_at desc 
    limit 50
  ) t;

  -- 3. Roster (High AP first)
  select json_agg(t) into v_roster from (
    select id, username, role, rank, ap_total, character_match_id, faction, behavior_scores, last_seen 
    from public.profiles 
    where faction = p_faction_id 
    and role in ('member', 'mod')
    order by ap_total desc, updated_at asc
  ) t;

  -- 4. Messages (Chat Log)
  -- Note: normalized in frontend to match FactionMessage type
  select json_agg(t) into v_messages from (
    select id, faction_id, user_id, sender_character, sender_rank, content, created_at
    from public.faction_messages 
    where faction_id = p_faction_id 
    order by created_at desc
    limit 50
  ) t;

  -- 5. Pending Registry Posts (Only for mods/owners)
  if exists (select 1 from public.profiles where id = p_viewer_id and (role = 'owner' or (role = 'mod' and faction = p_faction_id))) then
    select json_agg(t) into v_pending from (
      select id, case_number, author_id, author_character, author_faction, author_rank, title, content, district, post_type, created_at
      from public.registry_posts
      where author_faction = p_faction_id
      and status in ('pending', 'review')
      order by created_at asc
      limit 20
    ) t;

    -- NEW: Waitlist Entries (Leadership only)
    select json_agg(w) into v_waitlist from (
      select w.user_id, p.username, p.character_name, w.joined_at, w.position
      from public.waitlist w
      join public.profiles p on w.user_id = p.id
      where w.faction = p_faction_id
      order by w.position asc
    ) w;
  else
    v_pending := '[]'::json;
    v_waitlist := '[]'::json;
  end if;

  return json_build_object(
    'bulletins', coalesce(v_bulletins, '[]'::json),
    'activity', coalesce(v_activity, '[]'::json),
    'roster', coalesce(v_roster, '[]'::json),
    'messages', coalesce(v_messages, '[]'::json),
    'pending_posts', coalesce(v_pending, '[]'::json),
    'waitlist', coalesce(v_waitlist, '[]'::json)
  );
end;
$$ language plpgsql security definer;
