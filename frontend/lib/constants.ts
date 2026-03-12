import type { Character, FactionId } from '@/backend/types'
import { CHARACTER_ASSIGNMENT_POOL } from '@/frontend/lib/bsd-character-update'
import { FACTION_META, PUBLIC_FACTION_ORDER } from '@/frontend/lib/launch'

export const THEME_DATA = {
  light: {
    kanji: '文豪',
    label: '夜明け · Dawn · Agency Hours',
    quote:
      '"No matter how many mistakes you make, no matter how slow your progress - you are still ahead of everyone who is not trying."',
    attr: 'Doppo Kunikida · 国木田独歩',
  },
  dark: {
    kanji: '暗黒',
    label: '深夜 · Midnight · Mafia Hours',
    quote:
      '"Humans are foolish creatures. They seek strength yet shatter at the slightest blow."',
    attr: 'Ryunosuke Akutagawa · 芥川龍之介',
  },
  neutral: {
    kanji: '黄昏',
    label: '黄昏 · Twilight · Neutral Hours',
    quote:
      '"The world belongs to those willing to pay the price. I simply know my worth."',
    attr: 'F. Scott Fitzgerald · フィッツジェラルド',
  },
} as const

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
  stat_power: 50,
  stat_speed: 50,
  stat_control: 50,
  kanji_symbol: FACTION_META[character.faction].kanji,
  role_id: null,
  is_lore_locked: !FACTION_META[character.faction].isJoinable,
  created_at: '',
}))

export const NAV_LINKS = [
  { href: '/archive', label: 'Archive' },
  { href: '/registry', label: 'Registry' },
] as const
