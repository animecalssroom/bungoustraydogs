import type { BehaviorScores, Profile } from '@/backend/types'
import { normalizeBehaviorScores } from '@/frontend/lib/behavior'

type SpecialDivisionProvisional = {
  slug: string
  name: string
  note: string
}

const SPECIAL_DIVISION_SCORE_SEED: Array<{
  slug: string
  name: string
  power: number
  intel: number
  loyalty: number
  control: number
}> = [
  {
    slug: 'minoura-motoji',
    name: 'Motoji Minoura',
    power: 2,
    intel: 4,
    loyalty: 5,
    control: 4,
  },
  {
    slug: 'taneda-santoka',
    name: 'Santoka Taneda',
    power: 2,
    intel: 5,
    loyalty: 5,
    control: 5,
  },
]

function distance(
  scores: BehaviorScores,
  candidate: (typeof SPECIAL_DIVISION_SCORE_SEED)[number],
) {
  return (
    Math.abs(scores.power - candidate.power) +
    Math.abs(scores.intel - candidate.intel) +
    Math.abs(scores.loyalty - candidate.loyalty) +
    Math.abs(scores.control - candidate.control)
  )
}

export function getSpecialDivisionProvisionalDesignation(
  profile:
    | {
        faction: Profile['faction']
        character_match_id: Profile['character_match_id']
        behavior_scores?: Profile['behavior_scores']
      }
    | null
    | undefined,
): SpecialDivisionProvisional | null {
  if (!profile || profile.faction !== 'special_div' || profile.character_match_id) {
    return null
  }

  const scores = normalizeBehaviorScores(profile.behavior_scores)
  const hasSignal = scores.power || scores.intel || scores.loyalty || scores.control

  if (!hasSignal) {
    return null
  }

  const best = [...SPECIAL_DIVISION_SCORE_SEED].sort((left, right) => {
    const leftDistance = distance(scores, left)
    const rightDistance = distance(scores, right)

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance
    }

    return left.name.localeCompare(right.name)
  })[0]

  return {
    slug: best.slug,
    name: best.name,
    note: `Current activity pattern aligns most closely with ${best.name}. Manual confirmation remains pending.`,
  }
}
