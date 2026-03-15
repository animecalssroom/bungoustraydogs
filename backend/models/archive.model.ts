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
    duel_voice: entry.duel_voice ?? null,
    literary_link: entry.literary_link ?? null,
    special_mechanic: entry.special_mechanic ?? null,
    registry_note: entry.registry_note ?? null,
    designation: entry.designation ?? null,
    clearance_level: entry.clearance_level ?? null,
    ability_analysis: entry.ability_analysis ?? null,
    lore_background: entry.lore_background ?? null,
    physical_evidence: entry.physical_evidence ?? null,
    narrative_hook: entry.narrative_hook ?? null,
    status: entry.status ?? 'active',
    created_at: entry.created_at ?? '2026-03-12T00:00:00.000Z',
  }
}

export const ArchiveModel = {
  async getAll(): Promise<ArchiveEntry[]> {
    // Return local catalog immediately for free-tier architecture
    return ARCHIVE_FALLBACK_CATALOG
  },

  async getBySlug(slug: string): Promise<ArchiveEntry | null> {
    const local = ARCHIVE_FALLBACK_CATALOG.find((entry) => entry.slug === slug)
    if (local) return local
    
    try {
      const { data, error } = await supabaseAdmin
        .from('archive_entries')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        return null
      }

      return normalizeEntry(data)
    } catch {
      return null
    }
  },
}
