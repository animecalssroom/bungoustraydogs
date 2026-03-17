import { createClient } from '@/frontend/lib/supabase/server'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache as backendCache } from '@/backend/lib/cache'
import { ChronicleEntry } from '@/backend/types'

const CHRONICLE_SELECT = 'id, entry_number, title, content, entry_type, faction_focus, author_id, is_featured, created_at, published_at'

export const ChronicleModel = {
  async getAll(): Promise<ChronicleEntry[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chronicle_entries')
      .select(CHRONICLE_SELECT)
      .order('entry_number', { ascending: false })

    if (error) {
      console.error('Error fetching chronicle entries:', error)
      return []
    }

    return data as ChronicleEntry[]
  },

  async getPublished(): Promise<ChronicleEntry[]> {
    return backendCache.getOrSet('chronicle:published', 600, async () => {
      const { data, error } = await supabaseAdmin
        .from('chronicle_entries')
        .select(CHRONICLE_SELECT)
        .not('published_at', 'is', null)
        .order('entry_number', { ascending: false })

      if (error || !data) {
        console.error('Error fetching published chronicle entries:', error)
        return [] as ChronicleEntry[]
      }

      return data as ChronicleEntry[]
    })
  },

  async getById(id: string): Promise<ChronicleEntry | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chronicle_entries')
      .select(CHRONICLE_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching chronicle entry by id:', error)
      return null
    }

    return data as ChronicleEntry | null
  },

  async create(params: {
    title: string
    title_jp?: string
    content: string
    excerpt?: string
    category?: string
    faction_focus?: string
  }) {
    const { supabaseAdmin } = await import('@/backend/lib/supabase')
    
    // Get latest entry number
    const { data: latest } = await supabaseAdmin
      .from('chronicle_entries')
      .select('entry_number')
      .order('entry_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    const nextNumber = (latest?.entry_number || 0) + 1

    const { data, error } = await supabaseAdmin
      .from('chronicle_entries')
      .insert({
        entry_number: nextNumber,
        title: params.title,
        content: params.content,
        entry_type: params.category || 'chapter',
        faction_focus: params.faction_focus,
        published_at: new Date().toISOString()
      })
      .select(CHRONICLE_SELECT)
      .single()
    
    if (error) throw error
    return data as ChronicleEntry
  }
}
