import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache } from '@/backend/lib/cache'
import { ARCHIVE_FALLBACK_CATALOG } from '@/backend/lib/archive-catalog'
import type { Character, FactionId, ArchiveEntry, AbilityType, CharacterArchetype } from '@/backend/types'

function mapArchiveToCharacter(entry: ArchiveEntry): Character {
  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.character_name,
    name_jp: entry.character_name_jp ?? '',
    name_reading: '', 
    faction_id: entry.faction,
    ability_name: entry.ability_name,
    ability_name_jp: entry.ability_name_jp ?? '',
    ability_desc: entry.ability_description ?? '',
    quote: entry.narrative_hook ?? '',
    description: entry.lore_background ?? '',
    author_note: entry.registry_note ?? '',
    real_author: entry.real_author_name ?? '',
    real_author_years: entry.real_author_dates ?? '',
    notable_works: entry.notable_works,
    ability_type: entry.ability_type,
    duel_voice: entry.duel_voice,
    literary_link: entry.literary_link,
    special_mechanic: entry.special_mechanic,
    stat_power: entry.trait_power ?? 3,
    stat_speed: 3, 
    stat_intel: entry.trait_intel ?? 3,
    stat_loyalty: entry.trait_loyalty ?? 3,
    stat_control: entry.trait_control ?? 3,
    kanji_symbol: '',
    role_id: null,
    designation: entry.designation,
    clearance_level: entry.clearance_level,
    ability_analysis: entry.ability_analysis,
    lore_background: entry.lore_background,
    physical_evidence: entry.physical_evidence,
    narrative_hook: entry.narrative_hook,
    is_lore_locked: false,
    created_at: entry.created_at,
  }
}

export const CharacterModel = {
  async getAll(factionId?: FactionId): Promise<Character[]> {
    const localCharacters = ARCHIVE_FALLBACK_CATALOG.map(mapArchiveToCharacter)
    if (factionId) {
      return localCharacters.filter(c => c.faction_id === factionId)
    }
    return localCharacters
  },

  async getBySlug(slug: string): Promise<Character | null> {
    const local = ARCHIVE_FALLBACK_CATALOG.find(e => e.slug === slug)
    if (local) return mapArchiveToCharacter(local)

    return cache.getOrSet(`characters:slug:${slug}`, 600, async () => {
      const { data } = await supabaseAdmin
        .from('characters').select('*').eq('slug', slug).single()
      return (data ?? null) as Character | null
    })
  },
}
