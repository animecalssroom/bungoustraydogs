import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'

const WithdrawSchema = z.object({
  duel_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = WithdrawSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid duel withdrawal payload.' }, { status: 400 })
  }

  const duel = await DuelModel.getDuelById(parsed.data.duel_id)
  if (!duel || duel.challenger_id !== auth.user.id) {
    return NextResponse.json({ error: 'Only the challenger can withdraw this duel.' }, { status: 400 })
  }

  if (duel.status !== 'pending') {
    return NextResponse.json({ error: 'This duel is no longer pending.' }, { status: 400 })
  }

  const withdrawn = await DuelModel.withdrawChallenge(duel.id)
  if ('error' in withdrawn) {
    return NextResponse.json({ error: withdrawn.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
