import { createClient } from '@/frontend/lib/supabase/server'

export interface District {
  id: string
  name: string
  description: string
  created_at: string
}

export class DistrictModel {
  static async getAll(): Promise<District[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('districts')
      .select('*')
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
      .select('*')
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
      .update({ controlling_faction: factionId })
      .eq('id', districtId)
  }
}
