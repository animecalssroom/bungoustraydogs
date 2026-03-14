# BungouArchive — Character Assignment Pipeline Fix Prompt
## Feed this entire block to Copilot as a single prompt

---

## CONTEXT

BungouArchive (文豪アーカイブ) — BSD fan game.
Stack: Next.js 14 App Router, TypeScript, Supabase, Vercel, Gemini API.

**The problem:** Characters are not being assigned even after users complete enough events.
This prompt fixes the full character assignment pipeline end to end.

---

## THE SYSTEM — HOW IT SHOULD WORK

Character assignment fires when a user hits the event threshold.
It is NOT the same as the quiz. The quiz assigns faction. Character assignment is a separate,
deeper analysis that fires after the user has built up behavioral data on the site.

### Event threshold (UPDATED from old spec)
```
Standard threshold: 10 events
(Changed from 20 — 10 is enough for a small private game with 12-13 players)
```

### Events that count toward the threshold
```
daily_login      → +1 event
chat_message     → +1 event
archive_read     → +1 event
lore_post        → +1 event (on APPROVAL only, not submission)
duel_complete    → +1 event
arena_vote       → +1 event
```

### When does the check fire?
After EVERY event is recorded, check if the user now has ≥ 10 qualifying events
AND does not already have a `character_name` assigned.
If yes → trigger assignment.

---

## THE 8-AXIS TRAIT SYSTEM

Characters and users are scored on 8 axes (1–10 scale):
`justice · power · social · emotion · world · identity · method · loyalty`

### All 38 character trait vectors (pre-set, never change)
Store these in `character_profiles` table or as a constant. These are canon.

```ts
const CHARACTER_VECTORS: Record<string, { faction: string; traits: number[] }> = {
  // Format: [justice, power, social, emotion, world, identity, method, loyalty]
  'nakajima-atsushi':    { faction: 'agency',  traits: [6,5,6,8,8,6,5,7] },
  'osamu-dazai':         { faction: 'agency',  traits: [4,6,4,3,5,9,3,2] },
  'doppo-kunikida':      { faction: 'agency',  traits: [9,6,7,5,8,8,5,8] },
  'ranpo-edogawa':       { faction: 'agency',  traits: [7,2,5,2,7,6,2,5] },
  'akiko-yosano':        { faction: 'agency',  traits: [8,7,7,6,8,7,6,8] },
  'junichiro-tanizaki':  { faction: 'agency',  traits: [7,5,6,7,7,6,5,9] },
  'naomi-tanizaki':      { faction: 'agency',  traits: [5,4,5,8,6,5,4,9] },
  'kyouka-izumi':        { faction: 'agency',  traits: [7,7,5,7,7,7,6,8] },
  'kenji-miyazawa':      { faction: 'agency',  traits: [9,8,6,9,9,4,7,7] },
  'edgar-allan-poe':     { faction: 'guild',   traits: [6,4,2,6,5,5,2,4] },
  'nakahara-chuuya':     { faction: 'mafia',   traits: [5,9,7,7,4,4,8,9] },
  'ryunosuke-akutagawa': { faction: 'mafia',   traits: [3,9,4,8,2,3,8,7] },
  'kouyou-ozaki':        { faction: 'mafia',   traits: [5,7,8,4,4,6,5,7] },
  'gin-akutagawa':       { faction: 'mafia',   traits: [4,8,3,3,3,4,8,10] },
  'ichiyo-higuchi':      { faction: 'mafia',   traits: [6,3,4,9,6,5,4,10] },
  'michizou-tachihara':  { faction: 'mafia',   traits: [6,6,4,6,5,4,5,6] },
  'francis-fitzgerald':  { faction: 'guild',   traits: [4,8,9,5,4,7,6,6] },
  'lucy-montgomery':     { faction: 'guild',   traits: [5,5,3,8,6,5,4,6] },
  'john-steinbeck':      { faction: 'guild',   traits: [7,7,5,6,7,6,5,7] },
  'herman-melville':     { faction: 'guild',   traits: [5,9,7,3,4,4,8,5] },
  'mark-twain':          { faction: 'guild',   traits: [6,6,5,5,6,7,4,5] },
  'louisa-may-alcott':   { faction: 'guild',   traits: [7,5,7,7,7,6,4,8] },
  'teruko-okura':        { faction: 'hunting_dogs', traits: [2,9,6,2,2,3,9,4] },
  'tetchou-suehiro':     { faction: 'hunting_dogs', traits: [8,8,6,3,5,4,8,9] },
  'saigiku-jouno':       { faction: 'hunting_dogs', traits: [6,7,5,4,4,6,3,6] },
  'minoura-motoji':      { faction: 'special_div',  traits: [8,2,5,6,7,6,4,8] },
  'alexander-pushkin':   { faction: 'rats',    traits: [2,6,3,2,2,5,2,3] },
  'ivan-goncharov':      { faction: 'rats',    traits: [4,9,3,5,4,5,8,5] },
  'sigma':               { faction: 'decay',   traits: [6,4,3,8,6,8,4,6] },
  'bram-stoker':         { faction: 'decay',   traits: [2,9,4,2,2,2,9,3] },
  'agatha-christie':     { faction: 'clock_tower', traits: [6,5,8,2,5,6,1,5] },
  'rudyard-kipling':     { faction: 'clock_tower', traits: [5,7,7,3,4,5,6,4] },
  'oscar-wilde':         { faction: 'clock_tower', traits: [6,5,5,6,6,8,3,6] },
}

// RESERVED — never assignable through normal pipeline
const RESERVED_SLUGS = new Set([
  'mori-ogai',
  'yukichi-fukuzawa',
  'francis-fitzgerald',  // reserved for special conditions
  'fukuchi-ouchi',
  'fyodor-dostoevsky',
  'nikolai-gogol',
  'ango-sakaguchi',
  'sakunosuke-oda',
])
```

---

## STEP 1 — FIX: The event counter function

Create or fix `src/lib/assignment/checkAssignmentTrigger.ts`:

```ts
import { supabaseAdmin } from '@/backend/lib/supabase'
import { runCharacterAssignment } from './runCharacterAssignment'

const QUALIFYING_EVENTS = new Set([
  'daily_login',
  'chat_message',
  'archive_read',
  'lore_post',
  'duel_complete',
  'arena_vote',
])

const EVENT_THRESHOLD = 10

export async function checkAssignmentTrigger(userId: string): Promise<void> {
  // Skip if already assigned
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('character_name, faction')
    .eq('id', userId)
    .single()

  if (!profile || profile.character_name) return // already assigned
  if (!profile.faction) return // needs faction first

  // Count qualifying events
  const { count } = await supabaseAdmin
    .from('user_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('event_type', [...QUALIFYING_EVENTS])

  if (!count || count < EVENT_THRESHOLD) return

  // Threshold reached — fire assignment
  await runCharacterAssignment(userId)
}
```

**Call `checkAssignmentTrigger(userId)` after every event is recorded:**
- After `daily_login` event insert
- After `chat_message` event insert
- After `archive_read` event insert
- After `lore_post` event insert (on approval only)
- After `duel_complete` event insert
- After `arena_vote` event insert

---

## STEP 2 — FIX: The assignment runner

Create or fix `src/lib/assignment/runCharacterAssignment.ts`:

```ts
import { supabaseAdmin } from '@/backend/lib/supabase'
import { assignCharacterWithGemini } from './geminiAssignment'
import { assignCharacterByDistance } from './distanceAssignment'

export async function runCharacterAssignment(userId: string): Promise<void> {
  // Double-check not already assigned (race condition guard)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, faction, behavior_scores, trait_scores, avg_move_speed_minutes,
      quiz_scores, character_name
    `)
    .eq('id', userId)
    .single()

  if (!profile || profile.character_name) return

  // Gather data to send to Gemini
  const behaviorScores = profile.behavior_scores ?? {}
  const traitScores    = profile.trait_scores    ?? {}

  // Top 3 archive reads (lore_topics)
  const { data: archiveEvents } = await supabaseAdmin
    .from('user_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event_type', 'archive_read')
    .limit(50)

  const slugCounts: Record<string, number> = {}
  for (const e of archiveEvents ?? []) {
    const slug = (e.metadata as any)?.slug
    if (slug) slugCounts[slug] = (slugCounts[slug] ?? 0) + 1
  }
  const loreTopics = Object.entries(slugCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => slug)

  // Duel style counts
  const duelStyle = (behaviorScores as any)?.duel_style ?? { gambit: 0, strike: 0, stance: 0 }

  // Most recent 5 event types
  const { data: recentEvents } = await supabaseAdmin
    .from('user_events')
    .select('event_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  const recentEventTypes = (recentEvents ?? []).map((e) => e.event_type)

  // Earliest registry post for writing sample
  const { data: registryPosts } = await supabaseAdmin
    .from('registry_posts')
    .select('content')
    .eq('author_id', userId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(1)
  const writingSample = registryPosts?.[0]?.content?.slice(0, 200) ?? null

  // Dominant quiz trait
  const scores = profile.quiz_scores ?? traitScores ?? {}
  const quizDominantTrait = Object.entries(scores as Record<string, number>)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Combined trait vector: 60% exam + 40% behavior
  const AXES = ['justice', 'power', 'social', 'emotion', 'world', 'identity', 'method', 'loyalty']
  const compositeVector: Record<string, number> = {}
  for (const axis of AXES) {
    const exam     = (traitScores as any)?.[axis]     ?? 5
    const behavior = (behaviorScores as any)?.[axis]  ?? 5
    compositeVector[axis] = exam * 0.6 + behavior * 0.4
  }

  const assignmentData = {
    compositeVector,
    loreTopics,
    duelStyle,
    avgMoveSpeed: profile.avg_move_speed_minutes ?? null,
    writingSample,
    recentEvents: recentEventTypes,
    quizDominantTrait,
    faction: profile.faction,
  }

  // Try Gemini first, fall back to distance
  let result = await assignCharacterWithGemini(assignmentData)
  if (!result) {
    result = assignCharacterByDistance(assignmentData.compositeVector, profile.faction)
  }

  if (!result) {
    console.error('[assignment] Both Gemini and distance fallback failed for', userId)
    return
  }

  // Find secondary match (second closest by distance)
  const secondary = findSecondaryMatch(compositeVector, result.slug, profile.faction)

  // Write to profile
  await supabaseAdmin
    .from('profiles')
    .update({
      character_name:          result.name,
      character_match_id:      result.slug,
      character_ability:       result.ability ?? null,
      character_ability_jp:    result.ability_jp ?? null,
      character_description:   result.description ?? null,
      character_type:          result.type ?? null,
      character_assigned_at:   new Date().toISOString(),
      secondary_character_slug: secondary?.slug ?? null,
      secondary_character_name: secondary?.name ?? null,
    })
    .eq('id', userId)

  // Record assignment event
  await supabaseAdmin.from('user_events').insert({
    user_id: userId,
    event_type: 'character_assigned',
    ap_awarded: 0,
    metadata: { slug: result.slug, name: result.name },
  })

  // Notify the user
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'character_assigned',
    message: `The city has registered your ability. You have been matched with ${result.name}.`,
    payload: { slug: result.slug, name: result.name },
    action_url: `/profile`,
  })

  console.log(`[assignment] Assigned ${result.name} to user ${userId}`)
}
```

---

## STEP 3 — FIX: Gemini assignment

Create or fix `src/lib/assignment/geminiAssignment.ts`:

```ts
const RESERVED_SLUGS = new Set([
  'mori-ogai', 'yukichi-fukuzawa', 'francis-fitzgerald',
  'fukuchi-ouchi', 'fyodor-dostoevsky', 'nikolai-gogol',
  'ango-sakaguchi', 'sakunosuke-oda',
])

export async function assignCharacterWithGemini(data: {
  compositeVector: Record<string, number>
  loreTopics: string[]
  duelStyle: { gambit: number; strike: number; stance: number }
  avgMoveSpeed: number | null
  writingSample: string | null
  recentEvents: string[]
  quizDominantTrait: string | null
  faction: string | null
}): Promise<{ slug: string; name: string; ability?: string; ability_jp?: string; description?: string; type?: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const speedLabel =
    data.avgMoveSpeed === null ? 'unknown' :
    data.avgMoveSpeed < 3  ? 'fast/impulsive' :
    data.avgMoveSpeed > 15 ? 'slow/deliberate' : 'measured'

  const prompt = `You are the Yokohama Ability Registry character matching system.

A user in faction "${data.faction}" has reached the event threshold. Match them to a character.

USER TRAIT VECTOR (1–10 scale):
Justice: ${data.compositeVector.justice?.toFixed(1)}
Power Style: ${data.compositeVector.power?.toFixed(1)}
Social Role: ${data.compositeVector.social?.toFixed(1)}
Emotional Drive: ${data.compositeVector.emotion?.toFixed(1)}
World View: ${data.compositeVector.world?.toFixed(1)}
Identity: ${data.compositeVector.identity?.toFixed(1)}
Method: ${data.compositeVector.method?.toFixed(1)}
Loyalty: ${data.compositeVector.loyalty?.toFixed(1)}

BEHAVIORAL DATA:
- Most read characters: ${data.loreTopics.join(', ') || 'none'}
- Duel style: gambit=${data.duelStyle.gambit}, strike=${data.duelStyle.strike}, stance=${data.duelStyle.stance}
- Move speed: ${speedLabel}
- Writing sample: ${data.writingSample ?? 'none available'}
- Recent activity: ${data.recentEvents.join(', ')}
- Dominant quiz trait: ${data.quizDominantTrait ?? 'none'}

AVAILABLE CHARACTERS (slugs only — match to one of these):
nakajima-atsushi, osamu-dazai, doppo-kunikida, ranpo-edogawa, akiko-yosano,
junichiro-tanizaki, kyouka-izumi, kenji-miyazawa, edgar-allan-poe,
nakahara-chuuya, ryunosuke-akutagawa, kouyou-ozaki, gin-akutagawa,
ichiyo-higuchi, michizou-tachihara, lucy-montgomery, john-steinbeck,
herman-melville, mark-twain, louisa-may-alcott, teruko-okura,
tetchou-suehiro, saigiku-jouno, minoura-motoji, alexander-pushkin,
ivan-goncharov, sigma, bram-stoker, agatha-christie, rudyard-kipling, oscar-wilde

RULES:
- You MUST choose a character from the faction "${data.faction}" unless no good match exists there
- NEVER return: mori-ogai, yukichi-fukuzawa, francis-fitzgerald, fukuchi-ouchi, fyodor-dostoevsky, nikolai-gogol, ango-sakaguchi, sakunosuke-oda
- Return ONLY valid JSON. No markdown. No explanation.

Return exactly this JSON:
{"slug": "character-slug-here"}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      },
    )

    if (!res.ok) return null

    const json = await res.json()
    const raw = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '').join('').trim()
    if (!raw) return null

    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()) as { slug: string }
    const slug = parsed.slug?.toLowerCase().trim()

    if (!slug || RESERVED_SLUGS.has(slug)) return null

    // Fetch character details from DB
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    const { data: charData } = await supabaseAdmin
      .from('character_profiles')
      .select('slug, name, ability_name, ability_name_jp, ability_desc, ability_type')
      .eq('slug', slug)
      .maybeSingle()

    if (!charData) return null

    return {
      slug: charData.slug,
      name: charData.name,
      ability: charData.ability_name ?? undefined,
      ability_jp: charData.ability_name_jp ?? undefined,
      description: charData.ability_desc ?? undefined,
      type: charData.ability_type ?? undefined,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
```

---

## STEP 4 — FIX: Distance fallback

Create or fix `src/lib/assignment/distanceAssignment.ts`:

```ts
import { CHARACTER_VECTORS, RESERVED_SLUGS } from './characterVectors'
import { supabaseAdmin } from '@/backend/lib/supabase'

const AXES = ['justice', 'power', 'social', 'emotion', 'world', 'identity', 'method', 'loyalty']

function euclidean(a: Record<string, number>, b: number[]): number {
  return Math.sqrt(
    AXES.reduce((sum, axis, i) => {
      return sum + Math.pow((a[axis] ?? 5) - (b[i] ?? 5), 2)
    }, 0)
  )
}

export function assignCharacterByDistance(
  compositeVector: Record<string, number>,
  faction: string | null,
): { slug: string } | null {
  // Filter: same faction first, exclude reserved
  const candidates = Object.entries(CHARACTER_VECTORS)
    .filter(([slug, c]) => !RESERVED_SLUGS.has(slug) && c.faction === faction)

  // If no faction matches, open up to all non-reserved
  const pool = candidates.length > 0
    ? candidates
    : Object.entries(CHARACTER_VECTORS).filter(([slug]) => !RESERVED_SLUGS.has(slug))

  const ranked = pool
    .map(([slug, c]) => ({ slug, distance: euclidean(compositeVector, c.traits) }))
    .sort((a, b) => a.distance - b.distance)

  return ranked[0] ? { slug: ranked[0].slug } : null
}

export function findSecondaryMatch(
  compositeVector: Record<string, number>,
  primarySlug: string,
  faction: string | null,
): { slug: string; name: string } | null {
  const pool = Object.entries(CHARACTER_VECTORS)
    .filter(([slug]) => !RESERVED_SLUGS.has(slug) && slug !== primarySlug)

  const ranked = pool
    .map(([slug, c]) => ({ slug, distance: euclidean(compositeVector, c.traits) }))
    .sort((a, b) => a.distance - b.distance)

  if (!ranked[0]) return null
  // Name lookup happens in the caller from DB
  return { slug: ranked[0].slug, name: ranked[0].slug }
}
```

Create `src/lib/assignment/characterVectors.ts` — paste the full `CHARACTER_VECTORS` constant and `RESERVED_SLUGS` set from Step 2 above into this file.

---

## STEP 5 — VERIFY: Run this after wiring everything up

```sql
-- Check assignment events fired
SELECT user_id, metadata, created_at
FROM user_events
WHERE event_type = 'character_assigned'
ORDER BY created_at DESC;

-- Check profiles have characters
SELECT username, faction, character_name, character_match_id, character_assigned_at
FROM profiles
WHERE faction IS NOT NULL
AND character_name IS NULL
ORDER BY created_at;

-- Force-trigger assignment check for a specific user (run in Supabase SQL editor)
-- This shows their event count
SELECT event_type, COUNT(*) as count
FROM user_events
WHERE user_id = '<paste user id>'
AND event_type IN ('daily_login','chat_message','archive_read','lore_post','duel_complete','arena_vote')
GROUP BY event_type;
```

---

## WHAT NOT TO CHANGE

- Character trait vectors (canon — defined above, do not edit)
- Reserved slug list (these characters are never auto-assigned)
- AP values or rank thresholds
- The quiz/exam system (separate from character assignment)
- Faction assignment (handled by quiz, not by this pipeline)
- The `behavior_scores` column structure — it exists and has data, just wire it into the composite vector calculation