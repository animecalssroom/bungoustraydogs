import { supabaseAdmin } from '@/backend/lib/supabase'
import type { LorePost, LoreCategory } from '@/backend/types'

export const LoreModel = {
  async getAll(category?: LoreCategory): Promise<LorePost[]> {
    let query = supabaseAdmin
      .from('lore_posts')
      .select('*, profiles(username, avatar_url, role)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    if (category) query = query.eq('category', category)
    const { data } = await query
    return data ?? []
  },
  
  async getBySlug(slug: string): Promise<LorePost | null> {
    const { data } = await supabaseAdmin
      .from('lore_posts')
      .select('*, profiles(username, avatar_url, role)')
      .eq('slug', slug).eq('is_published', true).single()
    return data
  },
  
  async create(post: Omit<LorePost, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'save_count'>): Promise<LorePost | null> {
    const { data } = await supabaseAdmin.from('lore_posts').insert(post).select().single()
    return data
  },
  
  async incrementViews(id: string) {
    await supabaseAdmin.rpc('increment_view', { post_id: id })
  },
}
