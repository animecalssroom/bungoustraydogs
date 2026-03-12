import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import {
  sanitizeMultilineText,
  sanitizePlainText,
  sanitizeRelativePath,
} from '@/backend/lib/input-safety'
import { SupportModel } from '@/backend/models/support.model'

const TicketSchema = z.object({
  category: z.enum([
    'assignment',
    'intake',
    'faction',
    'registry',
    'lore',
    'account',
    'bug',
    'special_division',
  ]),
  subject: z.string().trim().min(4).max(120),
  details: z.string().trim().min(20).max(2000),
})

const FlagSchema = z.object({
  entityType: z.enum(['lore_post', 'registry_post', 'comment']),
  entityId: z.string().uuid(),
  targetPath: z.string().trim().min(1).max(300),
  targetLabel: z.string().trim().max(160).optional(),
  reason: z.string().trim().min(4).max(80),
  details: z.string().trim().max(1000).optional(),
})

const ResolveTicketSchema = z.object({
  status: z.enum(['in_review', 'resolved', 'dismissed']),
  note: z.string().trim().max(500).optional(),
})

const ResolveFlagSchema = z.object({
  action: z.enum(['dismiss', 'take_action']),
  note: z.string().trim().max(500).optional(),
})

export const SupportController = {
  async createTicket(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(TicketSchema, body)
    if (!parsed.success) return parsed.response

    const payload = {
      ...parsed.data,
      subject: sanitizePlainText(parsed.data.subject),
      details: sanitizeMultilineText(parsed.data.details),
    }

    const result = await SupportModel.createTicket(auth.profile, payload)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  },

  async createFlag(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(FlagSchema, body)
    if (!parsed.success) return parsed.response

    const payload = {
      ...parsed.data,
      reason: sanitizePlainText(parsed.data.reason),
      targetLabel: parsed.data.targetLabel
        ? sanitizePlainText(parsed.data.targetLabel)
        : undefined,
      targetPath: sanitizeRelativePath(parsed.data.targetPath),
      details: parsed.data.details
        ? sanitizeMultilineText(parsed.data.details)
        : undefined,
    }

    const result = await SupportModel.createContentFlag(auth.profile, payload)

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data }, { status: 201 })
  },

  async resolveTicket(req: NextRequest, ticketId: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(ResolveTicketSchema, body)
    if (!parsed.success) return parsed.response

    const payload = {
      ...parsed.data,
      note: parsed.data.note ? sanitizeMultilineText(parsed.data.note) : undefined,
    }

    const result = await SupportModel.resolveTicket(auth.profile, ticketId, payload)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Forbidden' ? 403 : 400 },
      )
    }

    return NextResponse.json({ data: result.data })
  },

  async resolveFlag(req: NextRequest, flagId: string) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(ResolveFlagSchema, body)
    if (!parsed.success) return parsed.response

    const payload = {
      ...parsed.data,
      note: parsed.data.note ? sanitizeMultilineText(parsed.data.note) : undefined,
    }

    const result = await SupportModel.resolveFlag(auth.profile, flagId, payload)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Forbidden' ? 403 : 400 },
      )
    }

    return NextResponse.json({ data: result.data })
  },
}
