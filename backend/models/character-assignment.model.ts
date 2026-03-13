import { supabaseAdmin } from '@/backend/lib/supabase'
import { redis } from '@/lib/redis'
import type {
  AbilityType,
  BehaviorScores,
  Profile,
  VisibleFactionId,
} from '@/backend/types'
import { CHARACTER_ASSIGNMENT_POOL } from '@/frontend/lib/bsd-character-update'
import {
  applyBehaviorDelta,
  normalizeBehaviorScores,
} from '@/frontend/lib/behavior'
import { deriveAssignmentInsights } from '@/frontend/lib/assignment-rationale'
import { getAbilityTypeForCharacter } from '@/frontend/lib/ability-types'
import { FACTION_META, VISIBLE_FACTIONS, getCharacterReveal } from '@/frontend/lib/launch'

const DEFAULT_RESERVED_CHARACTER_SLUGS = new Set([
  'mori-ogai',
  'fukuzawa-yukichi',
  'francis-fitzgerald',
  'fitzgerald',
  'fukuchi-ouchi',
  'fyodor-dostoevsky',
  'nikolai-gogol',
  'ango-sakaguchi',
  'sakunosuke-oda',
])

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'
const ASSIGNMENT_THRESHOLD = 20
const FAST_TRACK_THRESHOLD = 10
const GEMINI_TIMEOUT_MS = 5000

const CHARACTER_SCORE_SEED: Record<
  string,
  {
    power: number
    intel: number
    loyalty: number
    control: number
  }
> = {
  'nakajima-atsushi': { power: 3, intel: 2, loyalty: 4, control: 2 },
  'dazai-osamu': { power: 2, intel: 5, loyalty: 2, control: 3 },
  'kunikida-doppo': { power: 3, intel: 4, loyalty: 4, control: 5 },
  'ranpo-edogawa': { power: 1, intel: 5, loyalty: 3, control: 4 },
  'akiko-yosano': { power: 4, intel: 3, loyalty: 4, control: 4 },
  'junichiro-tanizaki': { power: 2, intel: 3, loyalty: 4, control: 3 },
  'naomi-tanizaki': { power: 2, intel: 4, loyalty: 4, control: 4 },
  'kyouka-izumi': { power: 4, intel: 2, loyalty: 4, control: 3 },
  'kenji-miyazawa': { power: 5, intel: 1, loyalty: 5, control: 2 },
  'fukuzawa-yukichi': { power: 2, intel: 5, loyalty: 5, control: 5 },
  'nakahara-chuuya': { power: 5, intel: 3, loyalty: 5, control: 2 },
  'akutagawa-ryunosuke': { power: 5, intel: 3, loyalty: 4, control: 3 },
  'mori-ogai': { power: 3, intel: 5, loyalty: 5, control: 5 },
  'ozaki-kouyou': { power: 3, intel: 4, loyalty: 4, control: 4 },
  'gin-akutagawa': { power: 3, intel: 3, loyalty: 5, control: 5 },
  'higuchi-ichiyo': { power: 3, intel: 2, loyalty: 5, control: 3 },
  'tachihara-michizou': { power: 4, intel: 3, loyalty: 3, control: 3 },
  'edgar-allan-poe': { power: 1, intel: 5, loyalty: 2, control: 4 },
  fitzgerald: { power: 4, intel: 4, loyalty: 3, control: 4 },
  'lucy-montgomery': { power: 2, intel: 3, loyalty: 3, control: 4 },
  'john-steinbeck': { power: 4, intel: 2, loyalty: 4, control: 3 },
  'herman-melville': { power: 5, intel: 2, loyalty: 3, control: 2 },
  'mark-twain': { power: 3, intel: 3, loyalty: 3, control: 3 },
  'louisa-may-alcott': { power: 2, intel: 4, loyalty: 4, control: 5 },
  'teruko-okura': { power: 4, intel: 4, loyalty: 4, control: 5 },
  'tetchou-suehiro': { power: 5, intel: 2, loyalty: 5, control: 4 },
  'jouno-saigiku': { power: 3, intel: 5, loyalty: 3, control: 4 },
  'fukuchi-ouchi': { power: 5, intel: 4, loyalty: 4, control: 5 },
  'ango-sakaguchi': { power: 1, intel: 5, loyalty: 4, control: 5 },
  'minoura-motoji': { power: 1, intel: 4, loyalty: 4, control: 4 },
  'taneda-santoka': { power: 2, intel: 5, loyalty: 4, control: 5 },
  'fyodor-dostoevsky': { power: 3, intel: 5, loyalty: 1, control: 5 },
  'alexander-pushkin': { power: 3, intel: 3, loyalty: 2, control: 4 },
  'ivan-goncharov': { power: 5, intel: 2, loyalty: 2, control: 2 },
  'nikolai-gogol': { power: 4, intel: 4, loyalty: 1, control: 3 },
  sigma: { power: 2, intel: 5, loyalty: 2, control: 4 },
  'bram-stoker': { power: 5, intel: 2, loyalty: 1, control: 2 },
  'agatha-christie': { power: 2, intel: 5, loyalty: 4, control: 5 },
  'rudyard-kipling': { power: 3, intel: 4, loyalty: 4, control: 4 },
  'oscar-wilde': { power: 2, intel: 4, loyalty: 3, control: 4 },
}

type CharacterProfileRow = {
  slug: string
  name: string
  faction: string
  ability_name: string | null
  ability_name_jp: string | null
  ability_type: string | null
  trait_power: number
  trait_intel: number
  trait_loyalty: number
  trait_control: number
}

type CharacterCandidate = {
  slug: string
  name: string
  faction: VisibleFactionId
  ability: string | null
  abilityJp: string | null
  abilityType: AbilityType
  scoreProfile: {
    power: number
    intel: number
    loyalty: number
    control: number
  }
}

type AssignmentEligibility = {
  qualifyingEventCount: number
  activeSignalCount: number
  hasLoreSignal: boolean
  hasTransmissionSignal: boolean
}

type PromptContext = {
  factionLabel: string
  dominantQuizTrait: string
  behavioralDrift: string
  combatStyle: string
  archiveInterest: string
  activityPattern: string
  moveSpeed: string
  writingSample: string
}

type GeminiMatch = {
  candidate: CharacterCandidate
  confidence: number
  reasoning: string | null
  registryNote: string | null
}

const QUALIFYING_EVENT_TYPES = new Set([
  'quiz_complete',
  'faction_assignment',
  'duel_complete',
  'arena_vote',
  'lore_post',
  'registry_post',
  'registry_submit',
  'chat_message',
  'bulletin_post',
  'feed_view',
  'profile_view',
  'write_lore',
  'save_lore',
  'registry_save',
  'archive_view',
  'archive_read',
  'faction_checkin',
  'debate_upvote',
  'faction_event',
  'easter_egg',
  'join_faction',
])

const ACTIVE_SIGNAL_EVENT_TYPES = new Set([
  'duel_complete',
  'arena_vote',
  'lore_post',
  'registry_post',
  'registry_submit',
  'chat_message',
  'bulletin_post',
  'feed_view',
  'profile_view',
  'write_lore',
  'save_lore',
  'registry_save',
  'archive_view',
  'archive_read',
  'faction_checkin',
  'debate_upvote',
  'faction_event',
  'easter_egg',
  'join_faction',
])

function isVisibleFaction(value: string | null | undefined): value is VisibleFactionId {
  return Boolean(value && VISIBLE_FACTIONS.includes(value as VisibleFactionId))
}

function profileCanAutoAssign(profile: Pick<Profile, 'role' | 'faction' | 'character_match_id'>) {
  return (
    !profile.character_match_id &&
    isVisibleFaction(profile.faction) &&
    (profile.role === 'member' || profile.role === 'mod')
  )
}

function dominantBehaviorAxis(scores: BehaviorScores) {
  const pairs = [
    ['power', scores.power],
    ['intel', scores.intel],
    ['loyalty', scores.loyalty],
    ['control', scores.control],
  ] as const

  return [...pairs].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'control'
}

function registryNote(name: string, scores: BehaviorScores, reasoning?: string | null) {
  const dominantAxis = dominantBehaviorAxis(scores)
  const line =
    dominantAxis === 'power'
      ? 'The registry notes a direct, force-forward pattern in the file.'
      : dominantAxis === 'intel'
        ? 'The registry notes a strong analytical pattern in the file.'
        : dominantAxis === 'loyalty'
          ? 'The registry notes unusual consistency in faction loyalty.'
          : 'The registry notes a disciplined need for control.'

  const closing = reasoning ? ` ${reasoning}` : ''

  return `Ability signature confirms designation as ${name}. ${line}${closing}`.trim()
}

function candidateDistance(behaviorScores: BehaviorScores, candidate: CharacterCandidate) {
  return (
    Math.abs(behaviorScores.power - candidate.scoreProfile.power) +
    Math.abs(behaviorScores.intel - candidate.scoreProfile.intel) +
    Math.abs(behaviorScores.loyalty - candidate.scoreProfile.loyalty) +
    Math.abs(behaviorScores.control - candidate.scoreProfile.control)
  )
}

function rankCandidates(behaviorScores: BehaviorScores, candidates: CharacterCandidate[]) {
  return [...candidates].sort((left, right) => {
    const leftDistance = candidateDistance(behaviorScores, left)
    const rightDistance = candidateDistance(behaviorScores, right)

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance
    }

    return left.name.localeCompare(right.name)
  })
}

function parseGeminiSlug(text: string) {
  return text.replace(/```/g, '').trim().replace(/^"|"$/g, '')
}

function getFallbackCandidates(faction: VisibleFactionId, reservedSlugs: Set<string>) {
  return CHARACTER_ASSIGNMENT_POOL.filter(
    (character) =>
      character.faction === faction &&
      !reservedSlugs.has(character.slug) &&
      Boolean(CHARACTER_SCORE_SEED[character.slug]) &&
      Boolean(getAbilityTypeForCharacter(character.slug)),
  )
    .map<CharacterCandidate>((character) => ({
      slug: character.slug,
      name: character.name,
      faction,
      ability: character.ability ?? null,
      abilityJp: character.abilityJp ?? null,
      abilityType: getAbilityTypeForCharacter(character.slug) as AbilityType,
      scoreProfile: CHARACTER_SCORE_SEED[character.slug],
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function loadReservedCharacterSlugs() {
  const { data, error } = await supabaseAdmin.from('reserved_characters').select('slug')

  if (error || !data?.length) {
    return new Set(DEFAULT_RESERVED_CHARACTER_SLUGS)
  }

  return new Set([...DEFAULT_RESERVED_CHARACTER_SLUGS, ...data.map((row) => row.slug)])
}

async function loadCandidatesForFaction(faction: VisibleFactionId, reservedSlugs: Set<string>) {
  const { data, error } = await supabaseAdmin
    .from('character_profiles')
    .select('*')
    .eq('faction', faction)

  if (error || !data?.length) {
    return getFallbackCandidates(faction, reservedSlugs)
  }

  const rows = (data as CharacterProfileRow[])
    .filter((row) => !reservedSlugs.has(row.slug))
    .map<CharacterCandidate | null>((row) => {
      const abilityType =
        (row.ability_type as AbilityType | null) ?? getAbilityTypeForCharacter(row.slug)

      if (!abilityType) {
        return null
      }

      const reveal = getCharacterReveal(row.slug)

      return {
        slug: row.slug,
        name: row.name,
        faction,
        ability: row.ability_name ?? reveal?.ability ?? null,
        abilityJp: row.ability_name_jp ?? reveal?.abilityJp ?? null,
        abilityType,
        scoreProfile: {
          power: row.trait_power,
          intel: row.trait_intel,
          loyalty: row.trait_loyalty,
          control: row.trait_control,
        },
      }
    })
    .filter((candidate): candidate is CharacterCandidate => Boolean(candidate))
    .sort((left, right) => left.name.localeCompare(right.name))

  return rows.length ? rows : getFallbackCandidates(faction, reservedSlugs)
}

async function loadRecentEvents(userId: string, limit = 25) {
  const { data } = await supabaseAdmin
    .from('user_events')
    .select('event_type, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (
    (data as Array<{
      event_type: string
      metadata: Record<string, unknown> | null
      created_at: string
    }> | null) ?? []
  )
}

function isFastTrackDominant(scores: BehaviorScores) {
  const values = [scores.power, scores.intel, scores.loyalty, scores.control]
  const max = Math.max(...values)
  const maxIndex = values.indexOf(max)
  return values.every((value, index) => (index === maxIndex ? true : max >= value * 2))
}

function isDuelStyleDominant(scores: BehaviorScores) {
  const values = [scores.duel_style.gambit, scores.duel_style.strike, scores.duel_style.stance]
  const total = values.reduce((sum, value) => sum + value, 0)

  if (total < 5) {
    return false
  }

  const max = Math.max(...values)
  const maxIndex = values.indexOf(max)
  return values.every((value, index) => (index === maxIndex ? true : max >= value * 2))
}

async function getAssignmentEligibility(userId: string): Promise<AssignmentEligibility> {
  const { data } = await supabaseAdmin
    .from('user_events')
    .select('event_type, metadata')
    .eq('user_id', userId)

  const events =
    (data as Array<{ event_type: string; metadata: Record<string, unknown> | null }> | null) ??
    []

  return events.reduce<AssignmentEligibility>(
    (summary, event) => {
      if (QUALIFYING_EVENT_TYPES.has(event.event_type)) {
        summary.qualifyingEventCount += 1
      }

      if (ACTIVE_SIGNAL_EVENT_TYPES.has(event.event_type)) {
        summary.activeSignalCount += 1
      }

      if (
        event.event_type === 'lore_post' ||
        event.event_type === 'registry_post' ||
        event.event_type === 'registry_submit' ||
        event.event_type === 'write_lore' ||
        event.event_type === 'save_lore' ||
        event.event_type === 'registry_save'
      ) {
        summary.hasLoreSignal = true
      }

      if (
        event.event_type === 'chat_message' ||
        (event.event_type === 'faction_event' && event.metadata?.source === 'transmission')
      ) {
        summary.hasTransmissionSignal = true
      }

      return summary
    },
    {
      qualifyingEventCount: 0,
      activeSignalCount: 0,
      hasLoreSignal: false,
      hasTransmissionSignal: false,
    },
  )
}

function getTraitLabel(trait: string) {
  return trait.charAt(0).toUpperCase() + trait.slice(1)
}

function getDominantQuizTrait(
  quizScores: Record<string, number> | null | undefined,
  behaviorScores: BehaviorScores,
) {
  const source = quizScores ?? {
    power: behaviorScores.power,
    intel: behaviorScores.intel,
    loyalty: behaviorScores.loyalty,
    control: behaviorScores.control,
  }

  const ranked = ['power', 'intel', 'loyalty', 'control'].sort(
    (left, right) => (source[right] ?? 0) - (source[left] ?? 0),
  )

  return getTraitLabel(ranked[0] ?? 'control')
}

function getBehavioralDrift(
  behaviorScores: BehaviorScores,
  quizScores: Record<string, number> | null | undefined,
) {
  const drifts = ['power', 'intel', 'loyalty', 'control']
    .map((trait) => ({
      trait,
      delta: (behaviorScores[trait as keyof BehaviorScores] as number) - (quizScores?.[trait] ?? 0),
    }))
    .sort((left, right) => right.delta - left.delta)
    .filter((entry) => entry.delta > 0)

  if (!drifts.length) {
    return 'little visible drift from the quiz baseline yet'
  }

  return drifts
    .slice(0, 2)
    .map((entry) => `${getTraitLabel(entry.trait)} +${entry.delta}`)
    .join(', ')
}

function describeCombatStyle(behaviorScores: BehaviorScores) {
  const duelStyle = behaviorScores.duel_style
  const total = duelStyle.gambit + duelStyle.strike + duelStyle.stance

  if (!total) {
    return 'no combat record yet'
  }

  const stanceFrequency =
    duelStyle.stance === 0
      ? 'never defends'
      : duelStyle.stance >= Math.max(duelStyle.gambit, duelStyle.strike)
        ? 'often defends'
        : 'rarely defends'

  if (duelStyle.gambit === duelStyle.strike) {
    return `balanced between Gambit (${duelStyle.gambit}) and Strike (${duelStyle.strike}), ${stanceFrequency}`
  }

  const favored = duelStyle.gambit > duelStyle.strike ? 'Gambit' : 'Strike'
  return `favors ${favored} (${favored === 'Gambit' ? duelStyle.gambit : duelStyle.strike} uses) over ${favored === 'Gambit' ? `Strike (${duelStyle.strike})` : `Gambit (${duelStyle.gambit})`}, ${stanceFrequency}`
}

function describeArchiveInterest(behaviorScores: BehaviorScores) {
  const topTopics = Object.entries(behaviorScores.lore_topics)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)

  if (!topTopics.length) {
    return 'no archive reading recorded yet'
  }

  return topTopics.map(([slug, count]) => `has read ${slug} ${count}x`).join(', ')
}

function describeActivityPattern(
  events: Array<{ event_type: string; created_at: string }>,
) {
  if (!events.length) {
    return 'low recorded activity so far'
  }

  const chatCount = events.filter((event) => event.event_type === 'chat_message').length
  const registryCount = events.filter((event) =>
    ['registry_post', 'registry_submit', 'registry_save'].includes(event.event_type),
  ).length
  const days = new Set(events.map((event) => event.created_at.slice(0, 10))).size

  const cadence = days >= 4 ? 'consistent daily logins' : days >= 2 ? 'intermittent activity' : 'sporadic logins'
  const social = chatCount >= 3 ? 'heavy chat presence' : chatCount > 0 ? 'light chat presence' : 'minimal chat'
  const registry =
    registryCount >= 3 ? 'Registry-focused' : registryCount > 0 ? 'some Registry engagement' : 'low Registry engagement'

  return `${cadence}, ${social}, ${registry}`
}

function describeMoveSpeed(avgMoveSpeedMinutes: number | null | undefined) {
  if (typeof avgMoveSpeedMinutes !== 'number' || !Number.isFinite(avgMoveSpeedMinutes)) {
    return 'no duel data yet'
  }

  const rounded = Math.round(avgMoveSpeedMinutes * 10) / 10

  if (avgMoveSpeedMinutes < 3) {
    return `fast submitter (avg ${rounded} min) - impulsive`
  }

  if (avgMoveSpeedMinutes > 15) {
    return `slow submitter (avg ${rounded} min) - deliberate`
  }

  return `considered submitter (avg ${rounded} min)`
}

function dominantTraitHint(candidate: CharacterCandidate) {
  const pairs = [
    ['power', candidate.scoreProfile.power],
    ['intel', candidate.scoreProfile.intel],
    ['loyalty', candidate.scoreProfile.loyalty],
    ['control', candidate.scoreProfile.control],
  ] as const
  const top = [...pairs].sort((left, right) => right[1] - left[1]).slice(0, 2)
  return top.map(([trait]) => trait).join('/')
}

async function loadPromptContext(
  userId: string,
  profile: Pick<Profile, 'faction' | 'quiz_scores' | 'avg_move_speed_minutes'>,
  behaviorScores: BehaviorScores,
  recentEvents: Array<{ event_type: string; created_at: string }>,
): Promise<PromptContext> {
  const [{ data: earliestPost }] = await Promise.all([
    supabaseAdmin
      .from('registry_posts')
      .select('content')
      .eq('author_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    factionLabel: profile.faction ? FACTION_META[profile.faction].name : 'Unknown faction',
    dominantQuizTrait: getDominantQuizTrait(profile.quiz_scores, behaviorScores),
    behavioralDrift: getBehavioralDrift(behaviorScores, profile.quiz_scores),
    combatStyle: describeCombatStyle(behaviorScores),
    archiveInterest: describeArchiveInterest(behaviorScores),
    activityPattern: describeActivityPattern(recentEvents),
    moveSpeed: describeMoveSpeed(profile.avg_move_speed_minutes),
    writingSample:
      typeof earliestPost?.content === 'string' && earliestPost.content.trim()
        ? earliestPost.content.trim().slice(0, 200)
        : 'none yet',
  }
}

async function selectByGemini(
  behaviorScores: BehaviorScores,
  candidates: CharacterCandidate[],
  faction: VisibleFactionId,
  fallback: CharacterCandidate,
  reservedSlugs: Set<string>,
  promptContext: PromptContext,
) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || candidates.length === 0) {
    return {
      match: null,
      fallbackReason: !apiKey ? 'Gemini API key missing.' : 'No eligible candidates available.',
    }
  }

  const prompt = [
    `You are assigning a Bungo Stray Dogs ability user to their character within ${promptContext.factionLabel}.`,
    '',
    'Available characters in this faction (not reserved):',
    ...candidates.map((candidate) => `- ${candidate.slug}: ${dominantTraitHint(candidate)}`),
    '',
    'This user\'s behavioral profile:',
    '',
    `Combat style: ${promptContext.combatStyle}`,
    `Archive interest: ${promptContext.archiveInterest}`,
    `Activity pattern: ${promptContext.activityPattern}`,
    'Trait profile from quiz + behavior:',
    `- Dominant trait from quiz: ${promptContext.dominantQuizTrait}`,
    `- Behavioral drift since quiz: ${promptContext.behavioralDrift}`,
    `- Current scores: Power ${behaviorScores.power} / Intel ${behaviorScores.intel} / Loyalty ${behaviorScores.loyalty} / Control ${behaviorScores.control}`,
    `Move speed: ${promptContext.moveSpeed}`,
    `Writing sample: ${promptContext.writingSample}`,
    '',
    `Based on this behavioral profile, which character in ${promptContext.factionLabel} fits them most?`,
    'Reason from their actual behavior patterns. Return ONLY the character slug. No explanation.',
  ].join('\n')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      return {
        match: null,
        fallbackReason: `Gemini API request failed with status ${response.status}.`,
      }
    }

    const json = await response.json()
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim()

    const slug = text ? parseGeminiSlug(text) : ''

    if (!slug) {
      return { match: null, fallbackReason: 'Gemini returned no candidate text.' }
    }

    if (reservedSlugs.has(slug)) {
      return { match: null, fallbackReason: `Gemini returned reserved slug "${slug}".` }
    }

    const candidate = candidates.find((entry) => entry.slug === slug)

    if (!candidate || candidate.faction !== faction) {
      return { match: null, fallbackReason: 'Gemini returned an invalid candidate slug.' }
    }

    return {
      match: {
        candidate,
        confidence: 0.5,
        reasoning: null,
        registryNote: null,
      } satisfies GeminiMatch,
      fallbackReason: null,
    }
  } catch (error) {
    return {
      match: null,
      fallbackReason:
        error instanceof Error ? `Gemini request failed: ${error.message}` : 'Gemini request failed.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export const CharacterAssignmentModel = {
  updateBehaviorProfile(
    current: Profile['behavior_scores'],
    eventType: Parameters<typeof applyBehaviorDelta>[1],
    metadata: Record<string, unknown> = {},
  ) {
    return applyBehaviorDelta(current, eventType, metadata)
  },

  async getEventCount(userId: string) {
    const eligibility = await getAssignmentEligibility(userId)
    return eligibility.qualifyingEventCount
  },

  async assignIfEligible(userId: string) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, faction, character_match_id, behavior_scores, quiz_scores, avg_move_speed_minutes')
      .eq('id', userId)
      .maybeSingle()

    const profile = (data as Pick<
      Profile,
      | 'id'
      | 'username'
      | 'role'
      | 'faction'
      | 'character_match_id'
      | 'behavior_scores'
      | 'quiz_scores'
      | 'avg_move_speed_minutes'
    > | null) ?? null

    if (!profile || !profileCanAutoAssign(profile)) {
      return null
    }

    const eligibility = await getAssignmentEligibility(userId)
    const behaviorScores = normalizeBehaviorScores(profile.behavior_scores)
    const reachedFastTrack =
      eligibility.qualifyingEventCount >= FAST_TRACK_THRESHOLD &&
      (isFastTrackDominant(behaviorScores) || isDuelStyleDominant(behaviorScores))

    if (
      eligibility.qualifyingEventCount < FAST_TRACK_THRESHOLD ||
      (!reachedFastTrack && eligibility.qualifyingEventCount < ASSIGNMENT_THRESHOLD) ||
      eligibility.activeSignalCount < 3 ||
      (!eligibility.hasLoreSignal && !eligibility.hasTransmissionSignal) ||
      !isVisibleFaction(profile.faction)
    ) {
      return null
    }

    const reservedSlugs = await loadReservedCharacterSlugs()
    const [candidates, recentEvents] = await Promise.all([
      loadCandidatesForFaction(profile.faction, reservedSlugs),
      loadRecentEvents(userId),
    ])

    if (candidates.length === 0) {
      return null
    }

    const rankedCandidates = rankCandidates(behaviorScores, candidates)
    const fallback = rankedCandidates[0]
    const secondary = rankedCandidates[1] ?? null

    if (!fallback || reservedSlugs.has(fallback.slug)) {
      return null
    }

    const promptContext = await loadPromptContext(userId, profile, behaviorScores, recentEvents)
    const recentEventTypes = recentEvents.slice(0, 10).map((event) => event.event_type)
    const assignmentInsights = deriveAssignmentInsights(behaviorScores, recentEventTypes)
    const geminiResult = await selectByGemini(
      behaviorScores,
      candidates,
      profile.faction,
      fallback,
      reservedSlugs,
      promptContext,
    )
    const geminiMatch = geminiResult.match

    if (!geminiMatch && geminiResult.fallbackReason) {
      console.error('[character-assignment] Falling back to distance assignment:', geminiResult.fallbackReason)
    }

    const assigned = geminiMatch?.candidate ?? fallback

    if (!assigned || assigned.faction !== profile.faction || reservedSlugs.has(assigned.slug)) {
      return null
    }

    const assignedAt = new Date().toISOString()
    const nextDescription =
      geminiMatch?.registryNote ??
      registryNote(
        assigned.name,
        behaviorScores,
        geminiMatch?.reasoning ?? 'Assigned by trait-distance fallback.',
      )

    await supabaseAdmin
      .from('profiles')
      .update({
        character_name: assigned.name,
        character_match_id: assigned.slug,
        character_ability: assigned.ability,
        character_ability_jp: assigned.abilityJp,
        character_description: nextDescription,
        character_type: assigned.abilityType,
        character_assigned_at: assignedAt,
        secondary_character_slug: secondary?.slug ?? null,
        secondary_character_name: secondary?.name ?? null,
        behavior_scores: behaviorScores,
        updated_at: assignedAt,
      })
      .eq('id', userId)

    const assignmentPayload = {
      character_slug: assigned.slug,
      character_name: assigned.name,
      secondary_character_slug: secondary?.slug ?? null,
      secondary_character_name: secondary?.name ?? null,
      ability_type: assigned.abilityType,
      faction: profile.faction,
      source: geminiMatch ? 'gemini' : 'distance',
      confidence: geminiMatch?.confidence ?? null,
      reasoning: geminiMatch?.reasoning ?? null,
      registry_note: nextDescription,
      dominant_axis: assignmentInsights.dominantAxis,
      behavior_snapshot: assignmentInsights.behaviorSnapshot,
      evidence: assignmentInsights.evidence,
      recent_events: recentEventTypes,
      prompt_context: promptContext,
      fast_tracked: reachedFastTrack,
      event_threshold: reachedFastTrack ? FAST_TRACK_THRESHOLD : ASSIGNMENT_THRESHOLD,
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'character_assigned',
      message: 'The city has updated your registry file.',
      payload: assignmentPayload,
    })
    try { await import('@/backend/lib/notifications-cache').then(m=>m.invalidateNotificationsCache(userId)) } catch (err) { console.error('[notifications] invalidate error', err) }

    await supabaseAdmin.from('faction_activity').insert({
      faction_id: profile.faction,
      event_type: 'character_assigned',
      description: `Ability signature confirmed - ${assigned.name}`,
      actor_id: userId,
    })

    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type: 'character_assigned',
      ap_awarded: 0,
      faction: profile.faction,
      metadata: assignmentPayload,
    })

    try {
      await redis.del(`event_summary:${userId}`)
    } catch (e) {
      /* ignore cache-bust error */
    }

    return {
      eventCount: eligibility.qualifyingEventCount,
      character: assigned,
      faction: FACTION_META[profile.faction],
      description: nextDescription,
      source: geminiMatch ? 'gemini' : 'distance',
      confidence: geminiMatch?.confidence ?? 0.5,
      reasoning: geminiMatch?.reasoning ?? 'Assigned by trait-distance fallback.',
    }
  },
}
