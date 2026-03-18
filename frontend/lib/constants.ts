import type { Character, FactionId } from '@/backend/types'
import { CHARACTER_ASSIGNMENT_POOL } from '@/frontend/lib/bsd-character-update'
import { FACTION_META, PUBLIC_FACTION_ORDER } from '@/frontend/lib/launch'

export const FACTIONS = PUBLIC_FACTION_ORDER.map((id) => ({
  id,
  name: FACTION_META[id].name,
  name_jp: FACTION_META[id].nameJp,
  kanji: FACTION_META[id].kanji,
  description: FACTION_META[id].description,
  philosophy: FACTION_META[id].philosophy,
  theme: FACTION_META[id].theme,
  color: FACTION_META[id].color,
  is_joinable: FACTION_META[id].isJoinable,
  is_hidden: FACTION_META[id].isHidden,
  is_lore_locked: !FACTION_META[id].isJoinable,
  ap: 0,
  member_count: 0,
  waitlist_count: 0,
  slot_count: 0,
}))

export const CHARACTERS: Character[] = CHARACTER_ASSIGNMENT_POOL.map((character) => ({
  id: character.slug,
  slug: character.slug,
  name: character.name,
  name_jp: character.nameJp,
  name_reading: '',
  faction_id: character.faction as FactionId,
  ability_name: character.ability,
  ability_name_jp: character.abilityJp,
  ability_desc: character.ability,
  quote: '',
  description: '',
  author_note: '',
  real_author: character.name,
  real_author_years: '',
  notable_works: null,
  ability_type: null,
  duel_voice: null,
  literary_link: null,
  special_mechanic: null,
  stat_power: 50,
  stat_speed: 50,
  stat_intel: 50,
  stat_loyalty: 50,
  stat_control: 50,
  kanji_symbol: FACTION_META[character.faction].kanji,
  role_id: null,
  class_tag: 'BRUTE',
  is_lore_locked: !FACTION_META[character.faction].isJoinable,
  created_at: new Date().toISOString(),
}))

export const NAV_LINKS = [
  { href: '/global-chat', label: 'Global Chat' },
  { href: '/duels', label: 'Duels' },
  { href: '/archive', label: 'Archive' },
  { href: '/theories', label: 'Theories' },
  { href: '/records', label: 'Records' },
  { href: '/districts', label: 'Districts' },
  { href: '/guide', label: 'Guide' },
  { href: '/tickets', label: 'Support' },
] as const
