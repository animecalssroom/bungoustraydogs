import { supabaseAdmin } from '@/backend/lib/supabase'
import type { Character, FactionId } from '@/backend/types'

export const CharacterModel = {
  async getAll(factionId?: FactionId): Promise<Character[]> {
    let query = supabaseAdmin.from('characters').select('*').order('name')
    if (factionId) query = query.eq('faction_id', factionId)
    const { data } = await query
    return data ?? []
  },
  
  async getBySlug(slug: string): Promise<Character | null> {
    const { data } = await supabaseAdmin
      .from('characters').select('*').eq('slug', slug).single()
    return data
  },
}
