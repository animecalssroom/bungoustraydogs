import type { DuelMove, FactionId, Profile } from '@/backend/types'

export const DUEL_ALLOWED_ROLES = new Set<Profile['role']>(['member', 'mod', 'owner'])
export const DUEL_REGULAR_FACTIONS = new Set<FactionId>([
  'agency',
  'mafia',
  'guild',
  'hunting_dogs',
  'special_div',
])
export const DUEL_PUBLIC_FACTIONS = new Set<FactionId>([
  'agency',
  'mafia',
  'guild',
  'hunting_dogs',
])
export const DUEL_MOVES: DuelMove[] = ['strike', 'stance', 'gambit', 'special', 'recover']
export const PENDING_DUEL_LIMIT = 3
export const DUEL_ROUND_DURATION_MS = 2 * 60 * 1000
export const DUEL_MAX_ROUNDS = 10
export const DUEL_SUDDEN_DEATH_ROUND = 11

export function canUseDuelSystem(profile: Pick<Profile, 'role' | 'faction'> | null | undefined) {
  return Boolean(
    profile &&
      DUEL_ALLOWED_ROLES.has(profile.role) &&
      profile.faction &&
      DUEL_REGULAR_FACTIONS.has(profile.faction),
  )
}

export function canIssueFactionChallenge(
  challenger: Pick<Profile, 'role' | 'faction'> | null | undefined,
  defender: Pick<Profile, 'role' | 'faction'> | null | undefined,
) {
  if (!canUseDuelSystem(challenger) || !canUseDuelSystem(defender)) {
    return false
  }

  return challenger?.faction !== defender?.faction
}

export function computeDuelMaxHp(characterSlug: string | null | undefined) {
  if (characterSlug === 'francis-fitzgerald' || characterSlug === 'fitzgerald') {
    return 130
  }

  if (characterSlug === 'herman-melville') {
    return 120
  }

  return 100
}

export function duelIdentityLabel(profile: Pick<Profile, 'faction' | 'character_name'>) {
  if (profile.character_name) {
    return profile.character_name
  }

  return profile.faction ? `${profile.faction.replace(/_/g, ' ')} operative` : 'unregistered operative'
}

export function formatRemainingTime(expiresAt: string | null | undefined, now = Date.now()) {
  if (!expiresAt) {
    return 'expired'
  }

  const delta = new Date(expiresAt).getTime() - now

  if (delta <= 0) {
    return 'expired'
  }

  const totalMinutes = Math.floor(delta / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  }

  return `${minutes}m remaining`
}

export function getMoveCategory(move: DuelMove | null | undefined) {
  if (move === 'recover') return 'recover'
  if (move === 'special') return 'special'
  if (move === 'gambit') return 'gamble'
  if (move === 'stance') return 'defend'
  return 'attack'
}
