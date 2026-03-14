import { NextRequest, NextResponse } from 'next/server'
import { LoreModel } from '@/backend/models/lore.model'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { AP_VALUES } from '@/backend/types'
import type { LoreCategory } from '@/backend/types'
import { z } from 'zod'
import { validate } from '@/backend/middleware/validate'
import { countWords } from '@/backend/lib/registry'
import {
  sanitizeMultilineText,
  sanitizePlainText,
  sanitizeSlug,
  sanitizeTagList,
} from '@/backend/lib/input-safety'

const CreateLoreSchema = z.object({
  title: z.string().min(5).max(120),
  slug: z.string().min(3).max(100),
  content: z.string().min(10).max(12000),
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).max(5).optional(),
  category: z.enum(['deep_dive', 'theory', 'character_study', 'arc_review', 'ability_analysis', 'real_author']),
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
    return NextResponse.json({ data: post })
  },

  async incrementViews(slug: string) {
    const post = await LoreModel.getBySlug(slug)
    if (post) {
      await LoreModel.incrementViews(post.id)
    }
    return NextResponse.json({ data: { success: true } })
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

    const title = sanitizePlainText(result.data.title)
    const slug = sanitizeSlug(result.data.slug)
    const excerpt = result.data.excerpt ? sanitizePlainText(result.data.excerpt) : null
    const content = sanitizeMultilineText(result.data.content)
    const tags = sanitizeTagList(result.data.tags)
    const wordCount = countWords(content)
    const maxWords = auth.profile.rank >= 2 ? 500 : 200

    if (wordCount < 50) {
      return NextResponse.json(
        { error: `Lore entries require at least 50 words. Current count: ${wordCount}.` },
        { status: 400 },
      )
    }

    if (wordCount > maxWords) {
      return NextResponse.json(
        {
          error:
            auth.profile.rank >= 2
              ? `Rank 2 and above can publish up to 500 words per lore entry. Split longer essays into a continuation entry.`
              : `Rank 1 lore entries are capped at 200 words. Split longer essays into a continuation entry after ranking up.`,
        },
        { status: 400 },
      )
    }

    if (title.length < 5 || slug.length < 3) {
      return NextResponse.json(
        { error: 'The literary desk could not normalize that title or slug.' },
        { status: 400 },
      )
    }

    const post = await LoreModel.create({
      ...result.data,
      title,
      slug,
      content,
      author_id: auth.user.id,
      excerpt,
      tags,
      read_time: result.data.read_time ?? Math.max(1, Math.ceil(wordCount / 180)),
      is_published: true,
      is_staff_pick: false,
    })

    if (!post) return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    await UserModel.addAp(auth.user.id, 'write_lore', AP_VALUES.write_lore, {
      category: result.data.category,
      tags,
      post_id: post.id,
    })
    return NextResponse.json({ data: post })
  },
}
