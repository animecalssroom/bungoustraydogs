import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { UserModel } from '@/backend/models/user.model'

const AcceptOpenSchema = z.object({
  open_challenge_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = AcceptOpenSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid open challenge payload.' }, { status: 400 })
  }

  const defender = await DuelModel.getParticipant(auth.user.id)
  if (!defender) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  const accepted = await DuelModel.acceptOpenChallenge(parsed.data.open_challenge_id, defender)
  if ('error' in accepted) {
    return NextResponse.json({ error: accepted.error }, { status: 400 })
  }

  await UserModel.addAp(auth.user.id, 'duel_accepted', 0, {
    duel_id: accepted.data.id,
    open_challenge_id: parsed.data.open_challenge_id,
  })

  return NextResponse.json({ success: true, duel_id: accepted.data.id })
}
