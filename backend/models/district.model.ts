import { createClient } from '@/frontend/lib/supabase/server'

export interface District {
  id: string
  name: string
  description: string
  slug: string
  color: string
  controlling_faction: string | null
  points_required: number
  current_points: number
  ap_pool: number
  created_at: string
  last_flip_at: string | null
  coordinates: { lat: number; lng: number } | null
}

const DISTRICT_SELECT = 'id, name, description, slug, color, controlling_faction, points_required, current_points, ap_pool, last_flip_at, coordinates'

export class DistrictModel {
  static async getAll(): Promise<District[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('districts')
      .select(DISTRICT_SELECT)
      .order('name')
    
    if (error) {
      console.error('Error fetching districts:', error)
      return []
    }
    
    return data as District[]
  }

  static async getById(id: string): Promise<District | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('districts')
      .select(DISTRICT_SELECT)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Error fetching district ${id}:`, error)
      return null
    }
    
    return data as District
  }

  static async setOwner(districtId: string, factionId: string) {
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    await supabaseAdmin
      .from('districts')
      .update({ controlling_faction: factionId, last_flip_at: new Date().toISOString() })
      .or(`id.eq.${districtId},slug.eq.${districtId}`)
  }
}
