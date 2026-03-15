import { createClient } from '@/frontend/lib/supabase/server'

export interface Chronicle {
  id: string
  title: string
  title_jp?: string
  slug: string
  content: string
  excerpt?: string
  author_id?: string
  category?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export class ChronicleModel {
  static async getAll(publishedOnly = true): Promise<Chronicle[]> {
    const supabase = createClient()
    let query = supabase.from('chronicles').select('*').order('created_at', { ascending: false })
    
    if (publishedOnly) {
      query = query.eq('is_published', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching chronicles:', error)
      return []
    }
    
    return data as Chronicle[]
  }

  static async getBySlug(slug: string): Promise<Chronicle | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('chronicles')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      console.error(`Error fetching chronicle ${slug}:`, error)
      return null
    }
    
    return data as Chronicle
  }
}
