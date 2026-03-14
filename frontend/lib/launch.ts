import type {
  BSDTheme,
  FactionId,
  Profile,
  VisibleFactionId,
} from '@/backend/types'
import { CHARACTER_ASSIGNMENT_POOL } from '@/frontend/lib/bsd-character-update'

export interface FactionMeta {
  name: string
  nameJp: string
  kanji: string
  philosophy: string
  description: string
  color: string
  theme: BSDTheme
  isJoinable: boolean
  isHidden: boolean
}

export const VISIBLE_FACTIONS: VisibleFactionId[] = [
  'agency',
  'mafia',
  'guild',
  'hunting_dogs',
] as const

export const PUBLIC_FACTION_ORDER: FactionId[] = [
  'mafia',
  'agency',
  'guild',
  'hunting_dogs',
  'special_div',
  'rats',
  'decay',
  'clock_tower',
]

const PRIVATE_FACTION_ROUTE_ALIASES: Record<string, FactionId> = {
  agency: 'agency',
  mafia: 'mafia',
  guild: 'guild',
  dogs: 'hunting_dogs',
  special: 'special_div',
  hunting_dogs: 'hunting_dogs',
  special_div: 'special_div',
}

export const FACTION_META: Record<FactionId, FactionMeta> = {
  agency: {
    name: 'Armed Detective Agency',
    nameJp: '武装探偵社',
    kanji: '探',
    philosophy:
      'The city does not distinguish between the guilty and the desperate. We do. The Armed Detective Agency exists in the space between law and mercy - cases too dangerous for the police, too human for the military. We carry the weight of Yokohama\'s twilight. Some call it heroism. We call it Tuesday.',
    description:
      'Justice is not handed to you. You build it, case by case, with what little you have.',
    color: '#8b6020',
    theme: 'light',
    isJoinable: true,
    isHidden: false,
  },
  mafia: {
    name: 'Port Mafia',
    nameJp: 'ポートマフィア',
    kanji: '港',
    philosophy:
      'Order is maintained by those willing to be its shadow. The Port Mafia does not pretend to be righteous. We are the reason Yokohama sleeps at night - not because the darkness is gone, but because we control it. You serve the city by serving us. This is not a choice. It is an assessment.',
    description:
      'Power is the only language Yokohama understands. The Port Mafia speaks it fluently.',
    color: '#cc1a1a',
    theme: 'dark',
    isJoinable: true,
    isHidden: false,
  },
  guild: {
    name: 'The Guild',
    nameJp: 'ザ・ギルド',
    kanji: '富',
    philosophy:
      'Power without resources is theater. The Guild understands what others refuse to admit - that ability without capital is merely talent, and talent is abundant. We do not fight for Yokohama. We invest in it. Your presence here is either an asset or a liability. Demonstrate which.',
    description:
      'The Guild treats influence like capital and strategy like art.',
    color: '#c8a020',
    theme: 'neutral',
    isJoinable: true,
    isHidden: false,
  },
  hunting_dogs: {
    name: 'Hunting Dogs',
    nameJp: '猟犬部隊',
    kanji: '犬',
    philosophy:
      'The law is not a suggestion. The Hunting Dogs are the government\'s answer to those who believe otherwise. We are not merciful. We are not cruel. We are precise. Yokohama\'s ability users exist within a framework they did not create and cannot escape. Neither can you. Neither can we.',
    description:
      'The military does not question its orders. It executes them.',
    color: '#4a6a8a',
    theme: 'dark',
    isJoinable: true,
    isHidden: false,
  },
  special_div: {
    name: 'Special Division',
    nameJp: '特務課',
    kanji: '務',
    philosophy:
      'You were not supposed to be here. The quiz had no answer for you - which means the city sees something the factions cannot. The Special Division does not recruit. It observes. You have been observed. What happens next is not up to you.',
    description:
      'Between the law and the lawless, someone still has to keep the file open.',
    color: '#4a5a6a',
    theme: 'light',
    isJoinable: false,
    isHidden: true,
  },
  rats: {
    name: 'Rats in the House of the Dead',
    nameJp: '死の家の鼠',
    kanji: '鼠',
    philosophy: 'Sin is a system. So is purification.',
    description:
      'A sealed theological file tied to extermination, guilt, and controlled collapse.',
    color: '#6a1a6a',
    theme: 'dark',
    isJoinable: false,
    isHidden: true,
  },
  decay: {
    name: 'Decay of the Angel',
    nameJp: '天人五衰',
    kanji: '衰',
    philosophy: 'Freedom begins when structure breaks.',
    description:
      'A destabilizing registry signature marked for catastrophe, theater, and sabotage.',
    color: '#3a5a7a',
    theme: 'neutral',
    isJoinable: false,
    isHidden: true,
  },
  clock_tower: {
    name: 'Order of the Clock Tower',
    nameJp: '時計塔',
    kanji: '塔',
    philosophy: 'Control is patience in formal dress.',
    description:
      'An overseas file where aristocratic control and long-range planning override sentiment.',
    color: '#5a4a2a',
    theme: 'neutral',
    isJoinable: false,
    isHidden: true,
  },
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

export function createCaseNumber(userId: string) {
  const numeric = 1000 + (hashString(userId) % 9000)
  return String(numeric)
}

export function getCharacterReveal(slug: string | null | undefined) {
  if (!slug) {
    return null
  }

  return CHARACTER_ASSIGNMENT_POOL.find((character) => character.slug === slug) ?? null
}

export function normalizePrivateFactionRouteId(routeId: string): FactionId | null {
  return PRIVATE_FACTION_ROUTE_ALIASES[routeId] ?? null
}

export function toPrivateFactionRouteId(faction: FactionId): string {
  if (faction === 'hunting_dogs') {
    return 'dogs'
  }

  if (faction === 'special_div') {
    return 'special'
  }

  return faction
}

export function privateFactionPath(faction: FactionId) {
  return `/faction/${toPrivateFactionRouteId(faction)}`
}

export function resolvePostAuthPath(profile: Profile | null) {
  if (!profile) {
    return '/login'
  }

  if (!profile.username_confirmed) {
    return '/onboarding/username'
  }

  if (profile.role === 'owner') {
    return '/owner'
  }

  if (profile.quiz_completed && profile.role === 'user') {
    return '/onboarding/result'
  }

  if (!profile.quiz_completed) {
    return '/onboarding/quiz'
  }

  if (profile.role === 'observer') {
    return '/observer'
  }

  if (profile.role === 'waitlist') {
    return '/waitlist'
  }

  if ((profile.role === 'member' || profile.role === 'mod') && profile.faction) {
    return privateFactionPath(profile.faction)
  }

  return '/'
}
