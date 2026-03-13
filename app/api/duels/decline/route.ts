import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'

const DeclineSchema = z.object({
  duel_id: z.string().uuid(),
  reason: z.string().trim().max(240).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = DeclineSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid duel decline payload.' }, { status: 400 })
  }

  const duel = await DuelModel.getDuelById(parsed.data.duel_id)
  if (!duel || duel.defender_id !== auth.user.id) {
    return NextResponse.json({ error: 'Only the challenged defender can decline this duel.' }, { status: 400 })
  }

  if (duel.status !== 'pending') {
    return NextResponse.json({ error: 'This duel is no longer pending.' }, { status: 400 })
  }

  const declined = await DuelModel.declineChallenge(duel.id, parsed.data.reason)
  if ('error' in declined) {
    return NextResponse.json({ error: declined.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
