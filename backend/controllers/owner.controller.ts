import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import { OwnerModel } from '@/backend/models/owner.model'
import type { VisibleFactionId } from '@/backend/types'

const VISIBLE_FACTION_ENUM = [
  'agency',
  'mafia',
  'guild',
  'hunting_dogs',
] as const satisfies readonly VisibleFactionId[]

const ActivateWaitlistSchema = z.object({
  faction: z.enum(VISIBLE_FACTION_ENUM),
})

const ResolveFlagSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('confirm'),
  }),
  z.object({
    action: z.literal('reassign'),
    faction: z.enum(VISIBLE_FACTION_ENUM),
  }),
])

const AssignReservedCharacterSchema = z.object({
  userId: z.string().uuid(),
  slug: z.string().min(1),
})

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

export const OwnerController = {
  async activateWaitlist(req: NextRequest) {
    const auth = await requireOwner(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(ActivateWaitlistSchema, body)
    if (!parsed.success) return parsed.response

    const activated = await OwnerModel.activateNextWaitlist(parsed.data.faction)

    if (!activated) {
      return NextResponse.json(
        { error: 'No waitlist file can be activated for that faction right now.' },
        { status: 409 },
      )
    }

    return NextResponse.json({ data: activated })
  },

  async resolveAssignmentFlag(req: NextRequest, flagId: string) {
    const auth = await requireOwner(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(ResolveFlagSchema, body)
    if (!parsed.success) return parsed.response

    const updated = await OwnerModel.resolveAssignmentFlag(
      flagId,
      parsed.data.action,
      parsed.data.action === 'reassign' ? parsed.data.faction : undefined,
    )

    if (!updated) {
      return NextResponse.json({ error: 'Assignment flag not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: updated })
  },

  async deleteUser(req: NextRequest, userId: string) {
    const auth = await requireOwner(req)
    if (isNextResponse(auth)) return auth

    if (auth.user.id === userId) {
      return NextResponse.json(
        { error: 'Owner cannot delete the active owner account from this panel.' },
        { status: 400 },
      )
    }

    try {
      const deleted = await OwnerModel.deleteUserCompletely(userId)
      return NextResponse.json({ data: deleted })
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Unable to delete user.',
        },
        { status: 400 },
      )
    }
  },

  async assignReservedCharacter(req: NextRequest) {
    const auth = await requireOwner(req)
    if (isNextResponse(auth)) return auth

    const body = await req.json().catch(() => null)
    const parsed = validate(AssignReservedCharacterSchema, body)

    if (!parsed.success) {
      return parsed.response
    }

    const result = await OwnerModel.assignReservedCharacter(
      parsed.data.userId,
      parsed.data.slug,
    )

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json(result)
  },
}
