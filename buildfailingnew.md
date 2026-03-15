# Build failures and warnings (summary)

This document collects all issues discovered across iterative build and dev runs, with affected files, reproduction notes, and suggested fixes.

## Summary
- Context: multiple `npm run build` and `npm run dev` runs were performed to resolve lint, TypeScript, and runtime errors.
- Outcome: production build completed page generation, but several non-fatal warnings and issues were discovered that should be reviewed and/or fixed before deployment.

## High-level issues

- **Lint / React warnings**
  - react/no-unescaped-entities reported in `components/duels/RoundHistory.tsx` (unescaped double quotes in JSX).
  - react-hooks/exhaustive-deps warning in `components/duels/DuelHubClient.tsx` for `refreshOpenChallenges` usage.

- **Next.js App Router / PageProps mismatch**
  - A page in `app/(auth)/login/page.tsx` originally accepted an optional prop (`initialMode`) which conflicted with Next's generated PageProps type checks and caused type errors during build.

- **Suspense / useSearchParams prerender error**
  - Using `useSearchParams()` in the page entry caused a Suspense prerender error during SSG. Resolved by reading `window.location.search` client-side in a `useEffect`.

- **Missing runtime module / vendor chunk**
  - Dev run once produced a module-not-found error for a Supabase vendor chunk. This was transient and likely resolvable by clearing `.next` and restarting dev.

- **TypeScript typing/runtime shape issues**
  - `frontend/components/duels/GlobalDuelMatchmaker.tsx`: unsafe access to `payload.old.id` (guarded by casting `(payload.old as any)?.id`).
  - `frontend/components/profile/ProfileExperience.tsx`: missing `user` mapping in `roleLabel` object causing a type/coverage error.

- **Incorrect import path**
  - `app/api/war/status/route.ts` imported a nonexistent `auth-server` path; fixed to existing `@/backend/middleware/auth`.

- **Dynamic server usage during SSG / Upstash Redis no-store fetches**
  - Multiple server-side modules and server components call `fetch(..., { cache: 'no-store' })` or invoke the Upstash REST Redis client during static generation (SSG). Next flagged these as `DYNAMIC_SERVER_USAGE` and several cache operations failed with warnings like "[cache] redis get failed for <key>".
  - Examples of files making `no-store` fetches:
    - `app/(auth)/login/page.tsx` — `fetch('/api/auth/me', { cache: 'no-store' })`
    - `frontend/lib/hooks/useProfile.ts` — `fetch('/api/auth/me', { cache: 'no-store' })`
    - `frontend/components/ui/Nav.tsx` — `fetch('/api/notifications?limit=20', { cache: 'no-store' })`
    - `frontend/components/duels/DuelScreenClient.tsx` — `fetch('/api/duels/${duel.id}/aftermath', { cache: 'no-store' })`
    - many other client hooks/components under `frontend/` using `cache: 'no-store'`.
  - Upstash Redis client usage files:
    - `src/lib/redis.ts`, `lib/redis.ts`, `backend/lib/upstash.ts` — Upstash REST client configured with `UPSTASH_REDIS_REST_URL` and token env vars.
  - The `backend/lib/cache.ts` wrapper logs `redis get/set/del failed` and was observed warning during static generation.

## Concrete error/warning examples (what was seen in logs)
- "useSearchParams() should be wrapped in a suspense boundary at page '/login'" — caused by calling `useSearchParams` in a page-level component.
- "Dynamic server usage: no-store fetch https://.../pipeline /api/faction" — multiple similar diagnostics for pipeline endpoints (Upstash / internal APIs) during SSG.
- Several `console.warn` messages from `backend/lib/cache.ts` like: `console.warn('[cache] redis get failed for ${key}:', err)`.

## Suggested remediation actions

- For lint / hook warnings
  - Escape unescaped characters in JSX (already fixed in `RoundHistory.tsx`).
  - Wrap functions used as stable dependencies in `useCallback` (applied to `refreshOpenChallenges`).

- For PageProps / login flow
  - Avoid passing UI-only props into App Router page entry components. Use URL query params and client-side reading for UI state (approach applied: signup redirects to `/auth/login?mode=signup`, and `login/page.tsx` reads `mode` client-side).

- For Suspense / useSearchParams
  - Do not call `useSearchParams` in server components or page-level server-rendered entry without Suspense; instead read query params client-side when the value is purely UI-only.

- For Upstash / dynamic server usage during SSG (recommended priorities)
  1. Identify which pages truly need dynamic/no-store data at build time.
  2. If data is static-friendly, change fetches to caching modes (`cache: 'force-cache'` or use ISR/revalidate) or use the `backend/lib/cache.ts` L2 caching paths to avoid no-store during SSG.
  3. If the data must be dynamic (per-request), mark the page as dynamic by adding at top of the page file: `export const dynamic = 'force-dynamic';` to explicitly opt out of SSG.
  4. For data that can be client-only, move the fetch to client-side hooks (`useEffect`) so SSG won't call Upstash during build.
  5. Ensure Upstash env vars are set in CI/build environment; Upstash client throws if env vars are missing.

- For transient dev vendor-chunk errors
  - If vendor chunk/module-not-found errors recur, delete the `.next` directory and restart dev to force regeneration of chunks.

## Files changed during the triage (high level)
- `components/duels/RoundHistory.tsx` — escaped quotes.
- `components/duels/DuelHubClient.tsx` — wrapped `refreshOpenChallenges` with `useCallback`.
- `app/(auth)/login/page.tsx` — removed prop usage; reads `mode` client-side via `useEffect`.
- `app/(auth)/signup/page.tsx` — changed to server `redirect('/auth/login?mode=signup')`.
- `app/api/war/status/route.ts` — fixed import to `@/backend/middleware/auth`.
- `frontend/components/duels/GlobalDuelMatchmaker.tsx` — guarded `payload.old.id` access.
- `frontend/components/profile/ProfileExperience.tsx` — added `user` mapping to `roleLabel`.

## Next recommended steps
1. Decide per-page whether to: a) make page dynamic, b) change fetch cache mode, or c) move fetches client-side. I can produce a per-file remediation list and apply conservative changes if you want.
2. Verify Upstash env vars exist in build environment (CI). If missing, provide values or guard code paths to avoid throwing during SSG.
3. Optionally, run a targeted build after applying the chosen fixes and confirm warnings cleared.

---
Generated by agent during iterative build/debug session.
