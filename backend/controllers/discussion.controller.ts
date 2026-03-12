import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import { sanitizeMultilineText } from '@/backend/lib/input-safety'
import { DiscussionModel } from '@/backend/models/discussion.model'

const CommentCreateSchema = z.object({
  content: z.string().min(2).max(1200),
})

export const DiscussionController = {
  async getLoreComments(slug: string) {
    const comments = await DiscussionModel.getLoreComments(slug)
    return NextResponse.json({ data: comments })
  },

  async addLoreComment(req: NextRequest, slug: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => ({}))
    const parsed = validate(CommentCreateSchema, body)
    if (!parsed.success) return parsed.response

    const content = sanitizeMultilineText(parsed.data.content)
    if (content.length < 2) {
      return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 })
    }

    const result = await DiscussionModel.addLoreComment(auth.profile, slug, content)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  },

  async getRegistryComments(caseNumber: string) {
    const comments = await DiscussionModel.getRegistryComments(caseNumber)
    return NextResponse.json({ data: comments })
  },

  async addRegistryComment(req: NextRequest, caseNumber: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => ({}))
    const parsed = validate(CommentCreateSchema, body)
    if (!parsed.success) return parsed.response

    const content = sanitizeMultilineText(parsed.data.content)
    if (content.length < 2) {
      return NextResponse.json({ error: 'Comment is too short.' }, { status: 400 })
    }

    const result = await DiscussionModel.addRegistryComment(
      auth.profile,
      caseNumber,
      content,
    )
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  },
}
