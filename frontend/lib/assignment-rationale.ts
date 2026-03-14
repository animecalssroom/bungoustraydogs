import type { BehaviorScores, UserEventType } from '@/backend/types'
import { normalizeBehaviorScores } from '@/frontend/lib/behavior'

const AXIS_LABELS: Record<'power' | 'intel' | 'loyalty' | 'control', string> = {
  power: 'direct force and decisive action',
  intel: 'analysis, pattern recognition, and file reading',
  loyalty: 'consistent faction alignment and follow-through',
  control: 'discipline, restraint, and deliberate pacing',
}

const EVENT_LABELS: Partial<Record<UserEventType, string>> = {
  chat_message: 'transmission activity',
  archive_read: 'archive review',
  archive_view: 'archive review',
  profile_view: 'profile review',
  write_lore: 'lore writing',
  lore_post: 'approved lore records',
  registry_submit: 'registry filing',
  registry_post: 'approved registry records',
  registry_save: 'registry saving',
  faction_checkin: 'faction presence logs',
  feed_view: 'faction feed review',
  arena_vote: 'arena decision',
  daily_login: 'daily return',
  bulletin_post: 'bulletin directive',
  join_faction: 'faction entry',
  duel_accepted: 'duel acceptance',
  duel_complete: 'combat engagement',
}

function topRecordEntry(record: Record<string, number>) {
  const entries = Object.entries(record).filter(([, value]) => value > 0)

  if (!entries.length) {
    return null
  }

  return entries.sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1]
    }

    return left[0].localeCompare(right[0])
  })[0]
}

function humanize(value: string) {
  return value.replace(/_/g, ' ')
}

function getDominantAxis(scores: BehaviorScores) {
  const ranked: Array<['power' | 'intel' | 'loyalty' | 'control', number]> = [
    ['power', scores.power],
    ['intel', scores.intel],
    ['loyalty', scores.loyalty],
    ['control', scores.control],
  ]

  ranked.sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1]
    }

    return left[0].localeCompare(right[0])
  })

  return ranked[0]?.[0] ?? 'control'
}

export function deriveAssignmentInsights(
  value: BehaviorScores | Record<string, unknown> | null | undefined,
  recentEvents: string[] = [],
) {
  const behaviorSnapshot = normalizeBehaviorScores(value)
  const dominantAxis = getDominantAxis(behaviorSnapshot)
  const topLoreTopic = topRecordEntry(behaviorSnapshot.lore_topics)
  const topDuelStyle = topRecordEntry(behaviorSnapshot.duel_style)
  const recentSignals = [...new Set(recentEvents)]
    .filter((eventType) => eventType && eventType !== 'character_assigned')
    .slice(0, 4)

  const duelCount = (recentEvents.filter(e => e === 'duel_complete' || e === 'duel_accepted').length)
  const duelEvidence = duelCount >= 2 ? `Active combat record: ${duelCount} recent duels.` : null

  const evidence = [
    `Primary signal: ${AXIS_LABELS[dominantAxis]}.`,
    duelEvidence,
    topLoreTopic
      ? `Most repeated topic: ${humanize(topLoreTopic[0])}.`
      : null,
    topDuelStyle
      ? `Preferred combat style: ${humanize(topDuelStyle[0])}.`
      : null,
    recentSignals.length
      ? `Recent file activity: ${recentSignals
          .map((eventType) => EVENT_LABELS[eventType as UserEventType] ?? humanize(eventType))
          .join(', ')}.`
      : null,
  ].filter((line): line is string => Boolean(line))

  return {
    dominantAxis,
    behaviorSnapshot: {
      power: behaviorSnapshot.power,
      intel: behaviorSnapshot.intel,
      loyalty: behaviorSnapshot.loyalty,
      control: behaviorSnapshot.control,
    },
    topLoreTopic: topLoreTopic?.[0] ?? null,
    topDuelStyle: topDuelStyle?.[0] ?? null,
    evidence,
  }
}
