# BungouArchive Phase 1-2 Implementation

This document describes the canonical product state currently implemented in the repo, what was removed or deprecated, how the system is wired, and what must be run in Supabase before testing.

## Scope Completed

Phase 1 is treated as:
- public-read archive
- auth and onboarding
- faction-first assignment
- waitlist and observer states
- private faction space

Phase 2 is treated as:
- public arena reading
- member/mod/owner voting
- public debate argument thread
- live arena updates

## Canonical Routes

Public routes:
- `/`
- `/characters`
- `/lore`
- `/arena`
- `/factions`
- `/factions/[id]`

Auth and onboarding:
- `/login`
- `/signup`
  redirects to `/login`
- `/auth/callback`
- `/onboarding/username`
- `/onboarding/quiz`
- `/onboarding/result`
- `/waitlist`
- `/observer`

Private faction route:
- `/faction/[factionId]`

Legacy compatibility routes:
- `/factions/[id]/hub`
  now redirects to the canonical private route
- `/exam`
  remains only as a public bridge page pointing users to the new registry flow

Owner and admin:
- `/owner`
- `/admin/special-division`

## Phase 1 Implementation

### Auth and Profile Bootstrap

Primary files:
- [app/(auth)/login/page.tsx](/f:/bsd-app-mvc/app/%28auth%29/login/page.tsx)
- [app/auth/callback/route.ts](/f:/bsd-app-mvc/app/auth/callback/route.ts)
- [backend/controllers/auth.controller.ts](/f:/bsd-app-mvc/backend/controllers/auth.controller.ts)
- [frontend/context/AuthContext.tsx](/f:/bsd-app-mvc/frontend/context/AuthContext.tsx)
- [frontend/lib/hooks/useProfile.ts](/f:/bsd-app-mvc/frontend/lib/hooks/useProfile.ts)
- [middleware.ts](/f:/bsd-app-mvc/middleware.ts)

Behavior:
- Google OAuth and email/password login route into the same profile bootstrap flow.
- `ensureProfile()` only creates missing profiles and no longer stomps onboarding state on every auth check.
- `/api/auth/me` is the canonical session/profile read endpoint used by the client auth context.
- stale refresh-token cookies are cleared in middleware to prevent repeated broken-session loops.

### Onboarding and Faction Assignment

Primary files:
- [app/onboarding/username/page.tsx](/f:/bsd-app-mvc/app/onboarding/username/page.tsx)
- [app/onboarding/quiz/page.tsx](/f:/bsd-app-mvc/app/onboarding/quiz/page.tsx)
- [app/onboarding/result/page.tsx](/f:/bsd-app-mvc/app/onboarding/result/page.tsx)
- [app/api/quiz/submit/route.ts](/f:/bsd-app-mvc/app/api/quiz/submit/route.ts)
- [backend/lib/quiz.ts](/f:/bsd-app-mvc/backend/lib/quiz.ts)
- [backend/controllers/onboarding.controller.ts](/f:/bsd-app-mvc/backend/controllers/onboarding.controller.ts)
- [backend/models/onboarding.model.ts](/f:/bsd-app-mvc/backend/models/onboarding.model.ts)
- [frontend/lib/launch.ts](/f:/bsd-app-mvc/frontend/lib/launch.ts)

Behavior:
- username is confirmed before the quiz
- quiz uses 7 questions
- scoring happens server-side only
- answers and scores are persisted on `profiles`
- result acceptance finalizes the user into:
  - `member`
  - `waitlist`
  - `observer`
- character assignment happens after faction acceptance, not during the quiz

### Waitlist and Observer

Primary files:
- [app/waitlist/page.tsx](/f:/bsd-app-mvc/app/waitlist/page.tsx)
- [app/observer/page.tsx](/f:/bsd-app-mvc/app/observer/page.tsx)
- [frontend/components/account/AssignmentFlagPanel.tsx](/f:/bsd-app-mvc/frontend/components/account/AssignmentFlagPanel.tsx)
- [app/api/assignment-flag/route.ts](/f:/bsd-app-mvc/app/api/assignment-flag/route.ts)

Behavior:
- waitlist users get queue state and live promotion behavior
- observer users remain public-read only
- assignment disagreement can be filed once and reviewed by owner flow

### Faction Dossiers and Private Faction Space

Primary files:
- [app/factions/[id]/page.tsx](/f:/bsd-app-mvc/app/factions/%5Bid%5D/page.tsx)
- [app/faction/[factionId]/page.tsx](/f:/bsd-app-mvc/app/faction/%5BfactionId%5D/page.tsx)
- [frontend/components/faction/FactionPrivateSpace.tsx](/f:/bsd-app-mvc/frontend/components/faction/FactionPrivateSpace.tsx)
- [frontend/components/faction/FactionPrivateSpace.module.css](/f:/bsd-app-mvc/frontend/components/faction/FactionPrivateSpace.module.css)
- [backend/models/faction-space.model.ts](/f:/bsd-app-mvc/backend/models/faction-space.model.ts)

Behavior:
- public faction pages stay readable by everyone
- private faction space is canonical at `/faction/[factionId]`
- old `/factions/[id]/hub` is now only a redirect bridge
- private faction page is server-preloaded for:
  - roster
  - bulletins
  - activity
  - messages
  - influence strip
- realtime keeps the room live after first render

## Phase 2 Implementation

Primary files:
- [app/arena/page.tsx](/f:/bsd-app-mvc/app/arena/page.tsx)
- [frontend/components/arena/ArenaCard.tsx](/f:/bsd-app-mvc/frontend/components/arena/ArenaCard.tsx)
- [frontend/components/arena/ArenaCard.module.css](/f:/bsd-app-mvc/frontend/components/arena/ArenaCard.module.css)
- [frontend/hooks/useArena.ts](/f:/bsd-app-mvc/frontend/hooks/useArena.ts)
- [app/api/arena/route.ts](/f:/bsd-app-mvc/app/api/arena/route.ts)
- [app/api/arena/[id]/vote/route.ts](/f:/bsd-app-mvc/app/api/arena/%5Bid%5D/vote/route.ts)
- [app/api/arena/[id]/arguments/route.ts](/f:/bsd-app-mvc/app/api/arena/%5Bid%5D/arguments/route.ts)
- [backend/controllers/arena.controller.ts](/f:/bsd-app-mvc/backend/controllers/arena.controller.ts)
- [backend/models/arena.model.ts](/f:/bsd-app-mvc/backend/models/arena.model.ts)

Behavior:
- arena is publicly readable
- active debates are server-preloaded into the page
- votes are member/mod/owner only
- guests, observers, and waitlist users see read-only messaging
- arguments are public to read
- arguments can be posted only by member/mod/owner
- live updates:
  - `arena_debates` updates vote totals
  - `arena_arguments` updates the thread

## Removed or Retired

Deleted legacy files:
- [frontend/components/exam/ExamFlow.tsx](/f:/bsd-app-mvc/frontend/components/exam/ExamFlow.tsx)
- [frontend/hooks/useExam.ts](/f:/bsd-app-mvc/frontend/hooks/useExam.ts)
- [backend/controllers/exam.controller.ts](/f:/bsd-app-mvc/backend/controllers/exam.controller.ts)
- [backend/models/exam.model.ts](/f:/bsd-app-mvc/backend/models/exam.model.ts)
- [app/api/exam/route.ts](/f:/bsd-app-mvc/app/api/exam/route.ts)
- [frontend/components/faction/FactionHub.tsx](/f:/bsd-app-mvc/frontend/components/faction/FactionHub.tsx)
- [frontend/components/faction/FactionHub.module.css](/f:/bsd-app-mvc/frontend/components/faction/FactionHub.module.css)
- [frontend/components/ui/HeroSection.tsx](/f:/bsd-app-mvc/frontend/components/ui/HeroSection.tsx)
- [frontend/hooks/useAuth.ts](/f:/bsd-app-mvc/frontend/hooks/useAuth.ts)

Retained as bridge routes:
- [app/exam/page.tsx](/f:/bsd-app-mvc/app/exam/page.tsx)
- [app/factions/[id]/hub/page.tsx](/f:/bsd-app-mvc/app/factions/%5Bid%5D/hub/page.tsx)

## Performance and Refactor Notes

The main cleanup/optimization changes in this pass:
- removed duplicate old exam/hub implementations so there is one canonical product path
- changed private faction navigation to one route model
- moved the private faction room to server-preloaded first paint
- changed the arena to server-preloaded initial payload + client realtime updates
- removed extra `useProfile()` mount on the faction room page by relying on the shared auth context or server-side auth

Remaining performance boundary:
- local `next dev` still compiles pages on first hit, which will feel slower than production
- heavy visual pages still use large in-file UI structures and could be further split if needed

## Database Requirements

You must rerun these after pulling the current repo state:

1. [backend/db/reset.sql](/f:/bsd-app-mvc/backend/db/reset.sql)
   only if you want a full dev wipe
2. [backend/db/schema.sql](/f:/bsd-app-mvc/backend/db/schema.sql)
3. [backend/db/seed.sql](/f:/bsd-app-mvc/backend/db/seed.sql)

Important additions for the current Phase 2 build:
- `arena_arguments`
- public select / member insert policies for arena arguments
- realtime publication for:
  - `arena_debates`
  - `arena_arguments`
- faction room tables and policies:
  - `faction_messages`
  - `faction_bulletins`
  - `faction_activity`

## What Is Not Phase 2 Yet

Still intentionally out of scope:
- duels
- faction missions
- transfer workflow
- hidden faction invite live-ops beyond Special Division review
- Yokohama map expansion / chronicle system

Those remain Phase 3+.

## Quick Verification Checklist

- sign up or log in
- complete username step
- complete 7-question quiz
- accept assignment
- land in:
  - `/faction/[factionId]`
  - or `/waitlist`
  - or `/observer`
- open `/arena`
- confirm:
  - guests can read
  - waitlist/observer can read but cannot vote or post arguments
  - member/mod/owner can vote
  - member/mod/owner can file arena arguments
- open old `/factions/[id]/hub`
  - it should redirect to `/faction/[factionId]`

