import type { BehaviorScores, UserEventType } from '@/backend/types'

export const DEFAULT_BEHAVIOR_SCORES: BehaviorScores = {
  power: 0,
  intel: 0,
  loyalty: 0,
  control: 0,
  arena_votes: {},
  duel_style: {
    gambit: 0,
    strike: 0,
    stance: 0,
  },
  lore_topics: {},
}

type BehaviorDelta = {
  power?: number
  intel?: number
  loyalty?: number
  control?: number
  arenaVoteKey?: string | null
  duelStyle?: 'gambit' | 'strike' | 'stance' | null
  loreTopic?: string | null
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function safeRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function clampScore(value: number) {
  return Math.max(0, value)
}

export function normalizeBehaviorScores(
  value: BehaviorScores | Record<string, unknown> | null | undefined,
): BehaviorScores {
  const input = safeRecord(value)
  const duelStyle = safeRecord(input.duel_style)

  return {
    power: safeNumber(input.power),
    intel: safeNumber(input.intel),
    loyalty: safeNumber(input.loyalty),
    control: safeNumber(input.control),
    arena_votes: Object.entries(safeRecord(input.arena_votes)).reduce<
      Record<string, number>
    >((scores, [key, nextValue]) => {
      scores[key] = safeNumber(nextValue)
      return scores
    }, {}),
    duel_style: {
      gambit: safeNumber(duelStyle.gambit),
      strike: safeNumber(duelStyle.strike),
      stance: safeNumber(duelStyle.stance),
    },
    lore_topics: Object.entries(safeRecord(input.lore_topics)).reduce<
      Record<string, number>
    >((scores, [key, nextValue]) => {
      scores[key] = safeNumber(nextValue)
      return scores
    }, {}),
  }
}

export function calculateBehaviorDelta(
  eventType: UserEventType,
  metadata: Record<string, unknown> = {},
): BehaviorDelta {
  switch (eventType) {
    case 'quiz_complete':
      return { control: 1, intel: 1 }
    case 'faction_assignment':
      return { loyalty: 1, control: 1 }
    case 'chat_message':
      return { loyalty: 1 }
    case 'bulletin_post':
      return { loyalty: 1, control: 1 }
    case 'feed_view':
      return { intel: 1 }
    case 'profile_view':
      return { intel: 1 }
    case 'arena_vote':
      return {
        power: 1,
        intel: 1,
        arenaVoteKey:
          typeof metadata.character_id === 'string' ? metadata.character_id : null,
      }
    case 'lore_post':
      return {
        intel: 1,
        loyalty: 2,
        loreTopic:
          typeof metadata.category === 'string' ? metadata.category : null,
      }
    case 'registry_post':
    case 'write_lore':
      return {
        intel: 2,
        control: 1,
        loreTopic:
          typeof metadata.category === 'string' ? metadata.category : null,
      }
    case 'registry_submit': {
      const postType = typeof metadata.post_type === 'string' ? metadata.post_type : 'incident_report'
      const continuingThread = Boolean(metadata.thread_id)
      const base =
        postType === 'field_note'
          ? { intel: 1, control: 1 }
          : postType === 'classified_report'
            ? { intel: 2, control: 2 }
            : postType === 'chronicle_submission'
              ? { intel: 3, control: 3 }
              : { intel: 1, control: 2 }

      return continuingThread ? { ...base, loyalty: 1 } : base
    }
    case 'save_lore':
    case 'registry_save':
      return { intel: 1 }
    case 'archive_view':
    case 'archive_read':
      return {
        intel: 1,
        loreTopic:
          typeof metadata.slug === 'string' && metadata.slug.trim()
            ? metadata.slug.trim()
            : null,
      }
    case 'faction_checkin':
      return { loyalty: 1, control: 1 }
    case 'daily_login':
      return { loyalty: 1 }
    case 'duel_accepted':
      return { power: 1, loyalty: 1 }
    case 'duel_complete':
      return { power: 2 }
    case 'login_streak':
      return { loyalty: 1, control: 1 }
    case 'debate_upvote':
      return { control: 1 }
    case 'faction_event':
      return {
        power: 1,
        loyalty: 1,
        duelStyle:
          metadata.duel_style === 'gambit' ||
          metadata.duel_style === 'strike' ||
          metadata.duel_style === 'stance'
            ? metadata.duel_style
            : null,
      }
    case 'easter_egg':
      return { intel: 1 }
    case 'join_faction':
      return { loyalty: 1 }
    case 'character_assigned':
      return {}
    default:
      return {}
  }
}

export function applyBehaviorDelta(
  current: BehaviorScores | Record<string, unknown> | null | undefined,
  eventType: UserEventType,
  metadata: Record<string, unknown> = {},
) {
  const next = normalizeBehaviorScores(current)
  const delta = calculateBehaviorDelta(eventType, metadata)

  next.power += delta.power ?? 0
  next.intel += delta.intel ?? 0
  next.loyalty += delta.loyalty ?? 0
  next.control += delta.control ?? 0

  next.power = clampScore(next.power)
  next.intel = clampScore(next.intel)
  next.loyalty = clampScore(next.loyalty)
  next.control = clampScore(next.control)

  if (delta.arenaVoteKey) {
    next.arena_votes[delta.arenaVoteKey] =
      (next.arena_votes[delta.arenaVoteKey] ?? 0) + 1
  }

  if (delta.duelStyle) {
    next.duel_style[delta.duelStyle] += 1
  }

  if (delta.loreTopic) {
    next.lore_topics[delta.loreTopic] =
      (next.lore_topics[delta.loreTopic] ?? 0) + 1
  }

  return next
}
