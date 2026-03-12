import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import { SpecialDivisionModel } from '@/backend/models/special-division.model'

const RecommendSchema = z.object({
  userId: z.string().uuid(),
})

const ResolveSchema = z.object({
  action: z.enum(['approve', 'decline']),
})

async function requireSpecialDivisionAdmin(req: NextRequest) {
  const auth = await requireAuth(req)

  if (isNextResponse(auth)) {
    return auth
  }

  const canAccess =
    auth.profile.role === 'owner' ||
    (auth.profile.role === 'mod' && auth.profile.faction === 'special_div')

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return auth
}

async function requireOwner(req: NextRequest) {
  const auth = await requireAuth(req)

  if (isNextResponse(auth)) {
    return auth
  }

  if (auth.profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return auth
}

export const SpecialDivisionController = {
  async recommend(req: NextRequest) {
    const auth = await requireSpecialDivisionAdmin(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(RecommendSchema, body)
    if (!parsed.success) return parsed.response

    const result = await SpecialDivisionModel.recommendUser(parsed.data.userId, auth.profile)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  },

  async resolve(req: NextRequest, observerPoolId: string) {
    const auth = await requireOwner(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(ResolveSchema, body)
    if (!parsed.success) return parsed.response

    const result = await SpecialDivisionModel.resolveRecommendation(
      observerPoolId,
      parsed.data.action,
    )

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  },
}
