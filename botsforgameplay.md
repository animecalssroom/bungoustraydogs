# BungouArchive Bot Gameplay Reference

Last updated: March 13, 2026

## Purpose

Bots are meant to behave like real users from the database's point of view.
They should:
- hold real `profiles` rows with `is_bot = true`
- earn behavior scores through normal events
- auto-accept and play duels through the same duel APIs as human players
- eventually support scheduled posting, replies, and lore filing

The current live foundation in this repo is duel-focused:
- bot duel detection uses `profiles.is_bot`
- `/api/bots/submit-duel-move` submits pending bot turns
- `lib/duels/npc-logic.ts` defines duel strategies
- duel creation auto-accepts when the defender is a bot

## Required Schema

This repo now expects these bot-related fields:
- `profiles.is_bot boolean default false`
- `profiles.bot_config jsonb`
- `profiles.character_reveal_shown boolean default false`
- `profiles.last_bot_post_at timestamptz`
- `profiles.is_bot_paused boolean default false`
- `faction_messages.is_bot_post boolean default false`
- `faction_messages.bot_replied_to text`
- `registry_posts.is_bot_post boolean default false`

These are included in:
- `supabase/migrations/20260313_support_bot_schema.sql`

## Duel Bot Flow

1. A human challenges a bot through `/api/duels/challenge`.
2. The API detects `defender.is_bot = true`.
3. The duel is immediately accepted and round 1 begins.
4. `/api/bots/submit-duel-move` scans active duels for unresolved bot turns.
5. The route chooses a move from `lib/duels/npc-logic.ts` and submits it through `/api/duels/submit-move`.
6. The normal duel resolver handles the round result.

## Current Duel Strategies

- `PATIENT_DESTRUCTION`
  - opens defensively, then pressures with strikes
- `COUNTER_WAIT`
  - stalls early, then punishes predictable aggression
- `GAMBIT_CHAOS`
  - alternates burst-risk play with direct attacks
- `CALCULATED_HEAL`
  - preserves HP and recovers at low health
- `TRAP_THEN_WAIT`
  - prefers setup and delayed pressure

## Suggested Roster Mapping

- Kenji Miyazawa -> `PATIENT_DESTRUCTION`
- Gin Akutagawa -> `COUNTER_WAIT`
- Mark Twain -> `GAMBIT_CHAOS`
- Tachihara Michizou -> `GAMBIT_CHAOS`
- Louisa May Alcott -> `CALCULATED_HEAL`
- Akiko Yosano -> `CALCULATED_HEAL`
- Edgar Allan Poe -> `TRAP_THEN_WAIT`

## Environment

The duel bot route currently uses:
- `BOT_DUEL_SECRET`

If broader scheduled social bots are added later, keep using server-side routes and signed headers only.
Never call Gemini directly from the client for bot actions.

## Next Expansion Path

The duel bot foundation is already in place. The next gameplay expansion should add:
- scheduled bot daily-login events
- scheduled faction posts
- reply scanning for recent faction activity
- lore/registry posting schedules
- pause and verification scripts

Those additions should continue to reuse the same event, AP, assignment, and notification systems that human players use.
