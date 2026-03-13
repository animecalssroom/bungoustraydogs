# BUNGOUARCHIVE — PROMPT 6: DUEL SYSTEM

Saved from the implementation brief on 2026-03-13.

## Scope
- Database schema + migration
- Challenge flow: send / accept / decline / withdraw
- Duel discovery page and inbox
- Pre-assignment duel state
- Move submission route
- Resolver edge function
- Duel page UI
- Aftermath + AP resolution
- Assignment feedback loop
- Bot integration
- Owner duel panel

## Critical Rules
- Gemini narrates only. Code decides all mechanics.
- Define fallback before every Gemini call, 5000ms timeout, always try/catch.
- AP never below 0. Rank never decreases.
- Same faction cannot duel.
- Server-side validation on every move submission.
- Prefer narrow Supabase selects with limits.
- Clean up every Realtime subscription.

## Data Model Highlights
- `duels`
- `duel_rounds`
- `open_challenges`
- `duel_cooldowns`
- `profiles.duel_wins / duel_losses / duel_forfeits / avg_move_speed_minutes`
- challenge deadline cleanup cron
- round deadline resolver cron
- corruption global event enforcement

## Requested Files
- `app/api/duels/*`
- `app/api/bots/submit-duel-move/route.ts`
- `app/duels/page.tsx`
- `app/duels/inbox/page.tsx`
- `app/duels/[duelId]/page.tsx`
- `supabase/functions/resolve-duel-round/index.ts`
- `supabase/functions/resolve-duel-aftermath/index.ts`
- `lib/duels/*`
- `components/duels/*`

## Verification Focus
- Challenge lifecycle works end to end
- Duel move submission is server-authoritative
- Resolver order matches spec
- Assignment signals are written from duel activity
- Bot auto-accept and bot turns work
- Owner can monitor and intervene

## Source Brief
The full source brief was provided in chat and is the governing spec for this implementation.
