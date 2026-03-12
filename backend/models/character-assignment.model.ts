import { supabaseAdmin } from '@/backend/lib/supabase'
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
import { getAbilityTypeForCharacter } from '@/frontend/lib/ability-types'
import { FACTION_META, VISIBLE_FACTIONS, getCharacterReveal } from '@/frontend/lib/launch'

const DEFAULT_RESERVED_CHARACTER_SLUGS = new Set([
  'mori-ogai',
  'fukuzawa-yukichi',
  'fitzgerald',
  'fukuchi-ouchi',
  'fyodor-dostoevsky',
  'nikolai-gogol',
  'ango-sakaguchi',
])

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash'

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
  hasArenaSignal: boolean
  hasLoreSignal: boolean
  hasTransmissionSignal: boolean
}

const QUALIFYING_EVENT_TYPES = new Set([
  'quiz_complete',
  'faction_assignment',
  'arena_vote',
  'lore_post',
  'registry_post',
  'write_lore',
  'save_lore',
  'registry_save',
  'debate_upvote',
  'faction_event',
  'easter_egg',
  'join_faction',
])

const ACTIVE_SIGNAL_EVENT_TYPES = new Set([
  'arena_vote',
  'lore_post',
  'registry_post',
  'write_lore',
  'save_lore',
  'registry_save',
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

function candidateDistance(
  behaviorScores: BehaviorScores,
  candidate: CharacterCandidate,
) {
  return (
    Math.abs(behaviorScores.power - candidate.scoreProfile.power) +
    Math.abs(behaviorScores.intel - candidate.scoreProfile.intel) +
    Math.abs(behaviorScores.loyalty - candidate.scoreProfile.loyalty) +
    Math.abs(behaviorScores.control - candidate.scoreProfile.control)
  )
}

function parseGeminiJson(text: string) {
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned) as {
    character_slug?: string
    confidence?: number
    reasoning?: string
    registry_note?: string
  }
}

function getFallbackCandidates(
  faction: VisibleFactionId,
  reservedSlugs: Set<string>,
) {
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
  const { data, error } = await supabaseAdmin
    .from('reserved_characters')
    .select('slug')

  if (error || !data?.length) {
    return new Set(DEFAULT_RESERVED_CHARACTER_SLUGS)
  }

  return new Set(data.map((row) => row.slug))
}

async function loadCandidatesForFaction(faction: VisibleFactionId) {
  const reservedSlugs = await loadReservedCharacterSlugs()
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

async function loadRecentEventTypes(userId: string) {
  const { data } = await supabaseAdmin
    .from('user_events')
    .select('event_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []).map((row) => row.event_type)
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

      if (event.event_type === 'arena_vote') {
        summary.hasArenaSignal = true
      }

      if (
        event.event_type === 'lore_post' ||
        event.event_type === 'registry_post' ||
        event.event_type === 'write_lore' ||
        event.event_type === 'save_lore' ||
        event.event_type === 'registry_save'
      ) {
        summary.hasLoreSignal = true
      }

      if (
        event.event_type === 'faction_event' &&
        event.metadata?.source === 'transmission'
      ) {
        summary.hasTransmissionSignal = true
      }

      return summary
    },
    {
      qualifyingEventCount: 0,
      activeSignalCount: 0,
      hasArenaSignal: false,
      hasLoreSignal: false,
      hasTransmissionSignal: false,
    },
  )
}

function selectByDistance(
  behaviorScores: BehaviorScores,
  candidates: CharacterCandidate[],
) {
  return [...candidates].sort((left, right) => {
    const leftDistance = candidateDistance(behaviorScores, left)
    const rightDistance = candidateDistance(behaviorScores, right)

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance
    }

    return left.name.localeCompare(right.name)
  })[0]
}

async function selectByGemini(
  behaviorScores: BehaviorScores,
  candidates: CharacterCandidate[],
  recentEvents: string[],
  faction: VisibleFactionId,
) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || candidates.length === 0) {
    return null
  }

  const prompt = [
    'You are the Yokohama ability registry for Bungou Stray Dogs.',
    `Select exactly one best character match for a ${faction} faction member.`,
    '',
    `Behavior scores: power ${behaviorScores.power}, intel ${behaviorScores.intel}, loyalty ${behaviorScores.loyalty}, control ${behaviorScores.control}.`,
    `Arena votes: ${JSON.stringify(behaviorScores.arena_votes)}.`,
    `Duel style: ${JSON.stringify(behaviorScores.duel_style)}.`,
    `Lore topics: ${JSON.stringify(behaviorScores.lore_topics)}.`,
    `Recent events: ${recentEvents.join(', ') || 'none recorded'}.`,
    '',
    'Assignable characters:',
    ...candidates.map(
      (candidate) =>
        `- ${candidate.slug}: ${candidate.name} | ability type ${candidate.abilityType} | power ${candidate.scoreProfile.power} | intel ${candidate.scoreProfile.intel} | loyalty ${candidate.scoreProfile.loyalty} | control ${candidate.scoreProfile.control}`,
    ),
    '',
    'Return strict JSON only with these keys:',
    '{"character_slug":"slug","confidence":0.0,"reasoning":"one sentence","registry_note":"two short sentences"}',
  ].join('\n')

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
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!response.ok) {
      return null
    }

    const json = await response.json()
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim()

    if (!text) {
      return null
    }

    const parsed = parseGeminiJson(text)
    const candidate = candidates.find((entry) => entry.slug === parsed.character_slug)

    if (!candidate) {
      return null
    }

    return {
      candidate,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning ?? null,
      registryNote: parsed.registry_note ?? null,
    }
  } catch {
    return null
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
      .select('id, username, role, faction, character_match_id, behavior_scores')
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
    > | null) ?? null

    if (!profile || !profileCanAutoAssign(profile)) {
      return null
    }

    const eligibility = await getAssignmentEligibility(userId)

    if (
      eligibility.qualifyingEventCount < 10 ||
      eligibility.activeSignalCount < 3 ||
      !eligibility.hasArenaSignal ||
      (!eligibility.hasLoreSignal && !eligibility.hasTransmissionSignal) ||
      !isVisibleFaction(profile.faction)
    ) {
      return null
    }

    const [candidates, recentEvents] = await Promise.all([
      loadCandidatesForFaction(profile.faction),
      loadRecentEventTypes(userId),
    ])

    if (candidates.length === 0) {
      return null
    }

    const behaviorScores = normalizeBehaviorScores(profile.behavior_scores)
    const geminiMatch = await selectByGemini(
      behaviorScores,
      candidates,
      recentEvents,
      profile.faction,
    )
    const assigned = geminiMatch?.candidate ?? selectByDistance(behaviorScores, candidates)

    if (!assigned) {
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
        behavior_scores: behaviorScores,
        updated_at: assignedAt,
      })
      .eq('id', userId)

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'character_assigned',
      message: 'The city has updated your registry file.',
      payload: {
        character_slug: assigned.slug,
        faction: profile.faction,
        source: geminiMatch ? 'gemini' : 'distance',
      },
    })

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
      metadata: {
        character_slug: assigned.slug,
        faction: profile.faction,
        source: geminiMatch ? 'gemini' : 'distance',
      },
    })

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
