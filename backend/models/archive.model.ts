import { ARCHIVE_FALLBACK_CATALOG } from '@/backend/lib/archive-catalog'
import { supabaseAdmin } from '@/backend/lib/supabase'
import type { ArchiveEntry, AbilityType, FactionId } from '@/backend/types'

function normalizeEntry(entry: Partial<ArchiveEntry> & { slug: string }): ArchiveEntry {
  return {
    id: entry.id ?? entry.slug,
    slug: entry.slug,
    character_name: entry.character_name ?? 'Unknown File',
    character_name_jp: entry.character_name_jp ?? null,
    faction: (entry.faction as FactionId) ?? 'agency',
    ability_name: entry.ability_name ?? 'Classified Ability',
    ability_name_jp: entry.ability_name_jp ?? null,
    ability_type: (entry.ability_type as AbilityType | null) ?? null,
    ability_description: entry.ability_description ?? null,
    trait_power: entry.trait_power ?? null,
    trait_intel: entry.trait_intel ?? null,
    trait_loyalty: entry.trait_loyalty ?? null,
    trait_control: entry.trait_control ?? null,
    real_author_name: entry.real_author_name ?? null,
    real_author_dates: entry.real_author_dates ?? null,
    real_author_bio: entry.real_author_bio ?? null,
    literary_movement: entry.literary_movement ?? null,
    notable_works: entry.notable_works ?? null,
    ability_literary_connection: entry.ability_literary_connection ?? null,
    registry_note: entry.registry_note ?? null,
    status: entry.status ?? 'active',
    created_at: entry.created_at ?? '2026-03-12T00:00:00.000Z',
  }
}

export const ArchiveModel = {
  async getAll(): Promise<ArchiveEntry[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('archive_entries')
        .select('*')
        .order('character_name')

      if (error || !data?.length) {
        return ARCHIVE_FALLBACK_CATALOG
      }

      return data.map((entry) => normalizeEntry(entry))
    } catch {
      return ARCHIVE_FALLBACK_CATALOG
    }
  },

  async getBySlug(slug: string): Promise<ArchiveEntry | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('archive_entries')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return ARCHIVE_FALLBACK_CATALOG.find((entry) => entry.slug === slug) ?? null
      }

      return normalizeEntry(data)
    } catch {
      return ARCHIVE_FALLBACK_CATALOG.find((entry) => entry.slug === slug) ?? null
    }
  },
}
