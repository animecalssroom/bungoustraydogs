import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache } from '@/backend/lib/cache'
import { ARCHIVE_FALLBACK_CATALOG } from '@/backend/lib/archive-catalog'
import type { Character, FactionId, ArchiveEntry, AbilityType, CharacterArchetype } from '@/backend/types'

const CHARACTER_SELECT = 'id, slug, name, faction_id, class_tag, created_at'

function mapArchiveToCharacter(entry: any): Character {
  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.character_name || entry.name,
    name_jp: entry.character_name_jp || entry.name_jp,
    name_reading: entry.designation || entry.name_reading,
    faction_id: entry.faction || entry.faction_id,
    kanji_symbol: entry.kanji_symbol,
    role_id: entry.role_id,
    ability_name: entry.ability_name,
    ability_name_jp: entry.ability_name_jp,
    ability_type: entry.ability_type,
    description: entry.ability_description || entry.description,
    quote: entry.narrative_hook || entry.quote,
    real_author: entry.real_author_name || entry.real_author,
    real_author_years: entry.real_author_dates || entry.real_author_years,
    notable_works: entry.notable_works,
    stat_power: entry.trait_power || entry.stat_power,
    stat_intel: entry.trait_intel || entry.stat_intel,
    stat_loyalty: entry.trait_loyalty || entry.stat_loyalty,
    stat_control: entry.trait_control || entry.stat_control,
    author_note: entry.registry_note || entry.author_note,
    class_tag: entry.class_tag || 'BRUTE',
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
        .from('characters').select(CHARACTER_SELECT).eq('slug', slug).single()
      return (data ?? null) as Character | null
    })
  },
}
