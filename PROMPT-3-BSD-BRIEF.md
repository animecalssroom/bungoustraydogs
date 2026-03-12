# BungouArchive Prompt 3 Brief

Saved on 2026-03-12 from the current BSD direction notes so the next phases stay aligned with canon.

## Canon Pillars To Carry Forward

- Tripartite Framework:
  Site theme should default to Yokohama time, not a purely cosmetic toggle.
  Dawn / Agency hours: 06:00-13:59.
  Twilight / neutral balance: 14:00-19:59.
  Midnight / Mafia hours: 20:00-05:59.
- The Book:
  Weekly chapter event.
  One current holder faction at a time.
  Holder gets visual prominence and a +10 percent AP bonus.
- Literary layer:
  Every archive entry needs a literary-origin section tying the ability to the real author and work.
- Buraiha hidden mechanic:
  If Dazai, Ango, and Oda are all actively held, unlock a private Bar Lupin channel.

## Immediate Pre-Phase-3 Patches

- Replace the landing hero with the opening Yokohama narrative.
- Keep rain, remove the busy hero layout, and make the text itself the graphic.
- Default theme must follow city time with a small manual override.
- Show the active time-state in the nav.
- Replace faction result copy with full philosophy text that feels like onboarding into a worldview.

## Prompt 3 Build Order

1. Database changes first.
2. Character assignment edge function.
3. Utilities:
   `rank.ts`
   `ability-types.ts`
   `ability-signature.ts`
4. UI components:
   `RankUpFlash`
   `FloatingAP`
   `CharacterReveal`
   `NotificationBell`
   `ObservationMeter`
   `DailyLoginRitual`
5. Onboarding result philosophy block.
6. Profile page:
   identity plate
   ability signature
   observation meter
   AP progress
   ability type badge
   field record log
   waitlist / observer banners
7. Owner assignment panel for reserved characters.
8. Exam retake system.
9. Nav updates.

## Prompt 3 Repo Status

Updated on 2026-03-12 after the first active implementation pass.

- [x] Profile route upgraded to a dedicated Prompt 3 experience.
- [x] AP/rank progress UI is live on `/profile/[username]`.
- [x] Ability signature rendering is live on the profile page.
- [x] Observation meter is live for signed-in users who are members without a character.
- [x] One-time character reveal overlay is wired for the owner of the profile.
- [x] Rank-up flash is wired for live rank changes on the owner profile view.
- [x] `rank.ts`, `ability-types.ts`, and `ability-signature.ts` are in active use.
- [x] `behavior.ts` was added and is now used to accumulate behavior scores from server-recorded events.
- [x] Onboarding now finalizes faction first and delays character assignment until later activity.
- [x] Delayed character assignment service exists in the repo and filters reserved characters.
- [x] `/api/character/assign` exists for manual assignment trigger/testing.
- [x] `/api/behavior/update` exists for non-quiz activity to feed behavior scoring.
- [x] Prompt 3 profile columns and supporting SQL tables were scaffolded into `backend/db/schema.sql`.
- [x] Gemini-capable character assignment now exists in the app service, with a matching Supabase edge function scaffold under `supabase/functions/assign-character`.
- [x] DailyLoginRitual is implemented and mounted globally in `app/layout.tsx`.
- [x] Owner reserved-character assignment panel is implemented at `/owner/assign-character`, with dashboard status visibility.
- [x] Exam retake flow is implemented via `/exam`, `/api/exam/retake`, and retake-aware quiz submission.
- [x] Field record log is implemented on the profile page for the file owner.
- [x] Prompt 3 database seed now includes `character_profiles`.

## Prompt 3 Rules To Preserve

- Character reveal fires once per browser via local storage.
- Daily login ritual fires once per user per day.
- Observation meter disappears once a character exists.
- Reserved characters are filtered before any automatic assignment.
- Special Division copy differs from the standard unassigned state.
- Floating AP layer stays mounted in layout.
- Realtime subscriptions must clean up on unmount.
- Owner routes must redirect non-owners before content flashes.
- Mobile profile layout must stack cleanly.

## Later Prompt Direction

- Prompt 4: archive literary-origin section and ability type display. Completed in repo on 2026-03-12 with `/archive` and `/archive/[slug]`.
- Prompt 5: registry district tagging tied to the Yokohama map. Completed in repo on 2026-03-12 with `/registry`, `/registry/submit`, and faction-space moderation queue wiring.
- Prompt 6: SVG city map with district control.
- Prompt 7: weekly Book chapter mechanic.

## Owner-Written Content

- Landing page opening narrative.
- Faction philosophies.
- Chronicle Entry #001.
- Reserved character assignments for the inner circle.
- Owner account set as Ango.

## Hidden Mechanics

- Bar Lupin channel.
- Exam retake after 30 days and 500 AP.
- Ambient notifications edge function.
- Fyodor's long-tail game for a later phase.
