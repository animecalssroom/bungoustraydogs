# BungouArchive Deployment Readiness Checklist

Use this file to verify the current live surface before opening the project to more players.

## Environment

- Use `Node 20.18.x` for local builds and Vercel runtime.
- Confirm `.env.local` contains:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL`
  - `GEMINI_API_KEY`
  - optional `GEMINI_MODEL=gemini-1.5-flash` or `gemini-2.5-flash`
  - `BOT_DUEL_SECRET`
  - `OWNER_USER_ID`
- Run the latest [schema.sql](/f:/bsd-app-mvc/backend/db/schema.sql)
- Restart the app after env or schema changes

## Account Roles

- `owner`
  - hidden infrastructure account
  - opens `/owner`
  - no public character requirement
- `Ango`
  - separate public account
  - `role = mod`
  - `faction = special_div`
  - visible in the world as the Special Division handler
- normal users
  - join visible factions through onboarding
  - write Lore
  - read/save Registry
  - cannot file Registry reports directly

## Home And Navigation

- Home entrance splash appears once per browser session
- Theme toggle works across dawn, twilight, midnight
- Navbar stays visible and readable in all themes
- Mobile drawer exposes all important navigation
- Guide route is visible from nav
- Footer links resolve correctly

## Auth And Onboarding

- Sign up, login, logout work without hard reload glitches
- Onboarding quiz completes cleanly
- Result page renders without overlay or broken glyph issues
- Users without a faction can reopen the onboarding result page
- Daily login ritual appears once per day and awards 5 AP

## Guide Terminal

- Bottom-right terminal button appears for logged-in users unless dismissed
- First open shows the hardcoded registry activation message
- Suggestions vary by player state
- Replies stream in the terminal panel
- History persists across refreshes
- Daily query cap is 5 per day
- Dismiss flow requires typing `CONFIRM`
- Fallback directs the user to `/tickets`

## Archive

- Archive index loads quickly
- Search works without UI lag
- Individual case files open correctly
- Archive read events contribute to progression
- Public users can browse without filing permissions

## Lore

- `/lore` shows published entries first
- `/lore/submit` is the public writing lane
- Lore rules:
  - minimum 50 words
  - rank 1 maximum 200 words
  - rank 2+ maximum 500 words
  - longer work should be split into continuation entries
- Publishing redirects to the created lore entry
- Lore comments work

## Registry

- `/registry` is readable by everyone
- Save buttons work
- `/registry/saved` shows saved case files
- Registry comments work
- Registry filing is restricted to `mod` and `owner`
- Non-staff users visiting `/registry/submit` are redirected to `/lore/submit`
- Staff filing types:
  - `field_note`
  - `incident_report`
  - `classified_report`
  - `chronicle_submission`

## Factions

- Private faction room loads only for valid members
- Transmission log works
- Feed view logging works
- Profile view logging works
- Bulletin posting is mod/owner only
- Faction dossier prefers the mod as leader and shows character-first identity

## Special Division

- Ango can silently draft users into `special_div`
- Drafted user gets a `special_division_invite` notification
- `Report To Registry` opens the Special Division route correctly
- Invite notice stops reappearing once acknowledged
- Drafted users do not auto-receive a final BSD character
- Roster shows drafted users clearly without duplicating Ango

## Character Assignment

- Visible factions only auto-assign
- Reserved characters are excluded from normal assignment
- Assignment requires qualifying activity, not passive spam
- Assignment rationale appears on the profile under the assigned character
- When a new character is assigned, the user is redirected to their own profile and sees the reveal
- Special Division remains manual assignment only

## Owner And Ango Panels

- Owner can open `/owner`
- Owner can access reserved/manual assignment desk
- Ango can open `/admin/special-division`
- Tickets and flags appear in the correct queue
- Owner and Ango remain separate accounts and separate designations

## Tickets And Flags

- `/tickets` allows users to file support tickets
- Content flagging works on supported surfaces
- Owner/Ango queue can resolve tickets and flags
- Guide terminal directs unresolved problems to `/tickets`

## Settings And Utility Controls

- Theme switching works
- Sound toggle persists
- Notification bell opens and marks notices correctly
- City mode label updates correctly
- Terminal widget can be dismissed permanently

## Security Baseline

- Public write inputs are sanitized before persistence:
  - lore submission
  - registry submission
  - comments
  - tickets
  - flags
  - faction messages
  - bulletins
  - guide terminal prompts
- Relative paths for flags are normalized and blocked from external or script schemes
- React-rendered text remains escaped by default
- Supabase queries use the SDK rather than string-built SQL
- RLS should remain enabled for tables that depend on per-user visibility

## Manual SQL Smoke Checks

- Check a user profile:

```sql
select username, role, faction, character_name, character_match_id, ap_total
from public.profiles
where username = 'your_username';
```

- Check recent user events:

```sql
select event_type, metadata, created_at
from public.user_events
where user_id = (select id from public.profiles where username = 'your_username')
order by created_at desc;
```

- Check notifications:

```sql
select type, message, read_at, payload, created_at
from public.notifications
where user_id = (select id from public.profiles where username = 'your_username')
order by created_at desc;
```

- Check support tickets:

```sql
select category, subject, status, created_at
from public.support_tickets
order by created_at desc;
```

## Current Writing Rules

- Lore
  - public
  - essays, theory, analysis, symbolism, author context
  - 50 word minimum
  - 200 word max at rank 1
  - 500 word max at rank 2+
- Registry
  - staff only
  - in-world filings and case reports
  - readable and savable by the public

## Release Notes For Testers

- If a user says a page still shows stale data after role or faction changes, restart the dev server and refresh the browser before filing a bug.
- If guide terminal answers drift from current rules, test `/guide`, `/lore`, and `/registry` first, then file a ticket with the exact prompt and reply.
- Do not rerun `reset.sql` unless you intentionally want a full wipe.
