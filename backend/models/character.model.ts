import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache } from '@/backend/lib/cache'
import type { Character, FactionId } from '@/backend/types'

export const CharacterModel = {
  async getAll(factionId?: FactionId): Promise<Character[]> {
    const key = factionId ? `characters:list:${factionId}` : 'characters:list:all'
    return cache.getOrSet(key, 300, async () => {
      let query = supabaseAdmin.from('characters').select('*').order('name')
      if (factionId) query = query.eq('faction_id', factionId)
      const { data } = await query
      return (data ?? []) as Character[]
    })
  },

  async getBySlug(slug: string): Promise<Character | null> {
    return cache.getOrSet(`characters:slug:${slug}`, 600, async () => {
      const { data } = await supabaseAdmin
        .from('characters').select('*').eq('slug', slug).single()
      return (data ?? null) as Character | null
    })
  },
}
