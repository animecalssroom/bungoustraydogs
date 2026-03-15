import { getRankTitle } from '@/backend/types'

export interface RankInfo {
  rank: number
  title: string
  currentAP: number
  nextThreshold: number
  previousThreshold: number
  percentage: number
  isMaxRank: boolean
  remainingAP: number
}

const FALLBACK_THRESHOLDS = [
  { rank: 1, ap_required: 0 },
  { rank: 2, ap_required: 100 },
  { rank: 3, ap_required: 500 },
  { rank: 4, ap_required: 1500 },
  { rank: 5, ap_required: 4000 },
  { rank: 6, ap_required: 10000 },
]

export function getRankInfo(
  apTotal: number,
  explicitRank?: number,
  faction?: string | null,
): RankInfo {
  let current = FALLBACK_THRESHOLDS[0]
  let next = FALLBACK_THRESHOLDS[1] ?? null

  for (let index = 0; index < FALLBACK_THRESHOLDS.length; index += 1) {
    if (apTotal >= FALLBACK_THRESHOLDS[index].ap_required) {
      current = FALLBACK_THRESHOLDS[index]
      next = FALLBACK_THRESHOLDS[index + 1] ?? null
    }
  }

  const isMaxRank = !next
  const previousThreshold = current.ap_required
  const nextThreshold = next?.ap_required ?? current.ap_required
  const span = Math.max(nextThreshold - previousThreshold, 1)
  const percentage = isMaxRank
    ? 100
    : Math.min(((apTotal - previousThreshold) / span) * 100, 100)
  const rank = explicitRank ?? current.rank

  return {
    rank,
    title: getRankTitle(rank, faction),
    currentAP: apTotal,
    nextThreshold,
    previousThreshold,
    percentage,
    isMaxRank,
    remainingAP: isMaxRank ? 0 : Math.max(nextThreshold - apTotal, 0),
  }
}
