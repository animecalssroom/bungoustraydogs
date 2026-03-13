import type { DuelMove } from '@/backend/types'

export type BotDuelStrategy =
  | 'PATIENT_DESTRUCTION'
  | 'COUNTER_WAIT'
  | 'GAMBIT_CHAOS'
  | 'CALCULATED_HEAL'
  | 'TRAP_THEN_WAIT'

export function chooseBotMove(strategy: BotDuelStrategy, round: number, hp: number): DuelMove {
  if (strategy === 'PATIENT_DESTRUCTION') {
    if (round === 1) return 'stance'
    if (round === 2) return 'strike'
    return 'strike'
  }

  if (strategy === 'COUNTER_WAIT') {
    return round <= 2 ? 'stance' : 'strike'
  }

  if (strategy === 'GAMBIT_CHAOS') {
    return round % 2 === 1 ? 'gambit' : 'strike'
  }

  if (strategy === 'CALCULATED_HEAL') {
    if (hp <= 30) return 'recover'
    return round % 2 === 0 ? 'stance' : 'strike'
  }

  return round <= 2 ? 'special' : 'stance'
}
