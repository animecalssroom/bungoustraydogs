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
  ranks: string[]
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
      'The Agency exists because some cases are too violent for police, too human for military. They are licensed ability users who take on crimes involving the supernatural that others cannot or will not touch. Bound not by law but by extraordinary conviction, they occupy a space that shouldn\'t exist to protect those the city has forgotten.',
    description:
      'Justice is not handed to you. You build it, case by case, with what little you have.',
    color: '#8b6020',
    theme: 'light',
    isJoinable: true,
    isHidden: false,
    ranks: ['Unaffiliated Detective', 'Field Operative', 'Senior Operative', 'Lead Detective', 'Special Investigator', 'Executive Agent'],
  },
  mafia: {
    name: 'Port Mafia',
    nameJp: 'ポートマフィア',
    kanji: '港',
    philosophy:
      'The Mafia maintains Yokohama\'s order by being the most organised expression of its darkness. Controlling the port and the underground, they do not pretend to be righteous, but they are the reason the city survives its own shadows. Hierarchy is absolute, loyalty is life, and order has a price they are always willing to collect.',
    description:
      'Power is the only language Yokohama understands. The Port Mafia speaks it fluently.',
    color: '#cc1a1a',
    theme: 'dark',
    isJoinable: true,
    isHidden: false,
    ranks: ['Foot Soldier', 'Operative', 'Lieutenant', 'Captain', 'Executive', 'Black Hand'],
  },
  guild: {
    name: 'The Guild',
    nameJp: 'ザ・ギルド',
    kanji: '富',
    philosophy:
      'The Guild treats influence like capital and strategy like art. Originally an overseas interest seeking the Book, they have evolved into a transactional power that acknowledges resources as the only true foundation for change. They do not fight for honor or tradition; they invest in outcomes and manage the city as an asset.',
    description:
      'The Guild treats influence like capital and strategy like art.',
    color: '#c8a020',
    theme: 'neutral',
    isJoinable: true,
    isHidden: false,
    ranks: ['Associate', 'Contractor', 'Acquisitions Agent', 'Senior Partner', 'Director', 'Founding Member'],
  },
  hunting_dogs: {
    name: 'Hunting Dogs',
    nameJp: '猟犬部隊',
    kanji: '犬',
    philosophy:
      'Japan\'s government answer to ability users who believe the law doesn\'t apply to them. Surgically enhanced and undefeated, the Hunting Dogs exist to maintain the framework of society through precise, disciplined force. They are loyal to the institution of the law, placing duty above preference and sacrifice above sentiment.',
    description:
      'The military does not question its orders. It executes them.',
    color: '#4a6a8a',
    theme: 'dark',
    isJoinable: true,
    isHidden: false,
    ranks: ['Recruit', 'Enlisted', 'Sergeant', 'Lieutenant', 'Commander', 'First Hound'],
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
    ranks: ['Flagged', 'Monitored', 'Cleared', 'Operative', 'Handler', 'Controller'],
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
    ranks: ['Initiate', 'Cell Member', 'Zealot', 'High Rat', 'The Infallible', 'The Cleansed'],
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
    ranks: ['Actor', 'Saboteur', 'Spectacle', 'Master of Chaos', 'The Free', 'God of Ruin'],
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
    ranks: ['Page', 'Squire', 'Knight', 'Vanguard', 'Sentinel', 'Tower Guardian'],
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
