import type { DuelMove } from '@/backend/types'

export function baseMoveDamage(move: DuelMove) {
  if (move === 'recover') return { damage: 0, heal: 20 }
  if (move === 'stance') return { damage: 12, heal: 0 }
  if (move === 'gambit') return { damage: 50, heal: 0 }
  if (move === 'special') return { damage: 35, heal: 0 }
  return { damage: 30, heal: 0 }
}
