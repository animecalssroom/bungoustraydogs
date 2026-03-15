import { supabaseAdmin } from '@/backend/lib/supabase'
import { cache } from '@/backend/lib/cache'
import type { LorePost, LoreCategory } from '@/backend/types'

export const LoreModel = {
  async getAll(category?: LoreCategory): Promise<LorePost[]> {
    const key = category ? `lore:list:${category}` : 'lore:list:all'
    return cache.getOrSet(key, 3600, async () => {
      let query = supabaseAdmin
        .from('lore_posts')
        .select('*, profiles(username, avatar_url, role)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50)
      if (category) query = query.eq('category', category)
      const { data } = await query
      return (data ?? []) as LorePost[]
    })
  },

  async getBySlug(slug: string): Promise<LorePost | null> {
    return cache.getOrSet(`lore:slug:${slug}`, 3600, async () => {
      const { data } = await supabaseAdmin
        .from('lore_posts')
        .select('*, profiles(username, avatar_url, role)')
        .eq('slug', slug).eq('is_published', true).single()
      return (data ?? null) as LorePost | null
    })
  },

  async create(post: Omit<LorePost, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'save_count'>): Promise<LorePost | null> {
    const { data } = await supabaseAdmin.from('lore_posts').insert(post).select().single()
    if (data) {
      await cache.invalidate('lore:list:all')
      if (post.category) await cache.invalidate(`lore:list:${post.category}`)
      await cache.invalidate(`lore:slug:${post.slug}`)
    }
    return data
  },

  async incrementViews(id: string) {
    await supabaseAdmin.rpc('increment_view', { post_id: id })
  },
}
