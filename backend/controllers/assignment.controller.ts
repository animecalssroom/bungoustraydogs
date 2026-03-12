import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { validate } from '@/backend/middleware/validate'
import { AssignmentModel } from '@/backend/models/assignment.model'

const CreateFlagSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || undefined),
})

export const AssignmentController = {
  async getMine(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    const flag = await AssignmentModel.getLatestFlag(auth.user.id)
    return NextResponse.json({ data: flag })
  },

  async create(req: NextRequest) {
    const auth = await requireAuth(req)
    if (isNextResponse(auth)) return auth

    if (!AssignmentModel.canFlag(auth.profile)) {
      return NextResponse.json(
        { error: 'This file cannot request reassignment review.' },
        { status: 409 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = validate(CreateFlagSchema, body)
    if (!parsed.success) return parsed.response

    const flag = await AssignmentModel.createFlag(auth.profile, parsed.data.notes ?? null)
    return NextResponse.json({ data: flag }, { status: 201 })
  },
}
