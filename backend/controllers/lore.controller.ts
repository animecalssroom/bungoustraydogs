import { NextRequest, NextResponse } from 'next/server'
import { LoreModel } from '@/backend/models/lore.model'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { AP_VALUES } from '@/backend/types'
import type { LoreCategory } from '@/backend/types'
import { z } from 'zod'
import { validate } from '@/backend/middleware/validate'

const CreateLoreSchema = z.object({
  title: z.string().min(5).max(120),
  slug: z.string().min(3).max(100),
  content: z.string().min(100),
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).max(5).optional(),
  category: z.enum(['deep_dive','theory','character_study','arc_review','ability_analysis','real_author']),
  read_time: z.number().min(1).max(60).optional(),
})

export const LoreController = {
  async getAll(req: NextRequest) {
    const category = req.nextUrl.searchParams.get('category') as LoreCategory | null
    const posts = await LoreModel.getAll(category ?? undefined)
    return NextResponse.json({ data: posts })
  },
  
  async getBySlug(slug: string) {
    const post = await LoreModel.getBySlug(slug)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await LoreModel.incrementViews(post.id)
    return NextResponse.json({ data: post })
  },
  
  async create(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (!['member', 'mod', 'owner'].includes(auth.profile.role)) {
      return NextResponse.json(
        { error: 'Complete faction assignment before publishing lore.' },
        { status: 403 },
      )
    }
    
    const body = await req.json()
    const result = validate(CreateLoreSchema, body)
    if (!result.success) return result.response
    
    const post = await LoreModel.create({
      ...result.data,
      author_id: auth.user.id,
      excerpt: result.data.excerpt ?? null,
      tags: result.data.tags ?? [],
      read_time: result.data.read_time ?? 5,
      is_published: true,
      is_staff_pick: false,
    })
    
    if (!post) return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    await UserModel.addAp(auth.user.id, 'lore_post', AP_VALUES.lore_post, {
      category: result.data.category,
      tags: result.data.tags ?? [],
      post_id: post.id,
    })
    return NextResponse.json({ data: post })
  },
}
