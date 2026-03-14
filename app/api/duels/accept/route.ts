import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { UserModel } from '@/backend/models/user.model'

const AcceptSchema = z.object({
  duel_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = AcceptSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid duel accept payload.' }, { status: 400 })
  }

  const duel = await DuelModel.getDuelById(parsed.data.duel_id)
  if (!duel || duel.defender_id !== auth.user.id) {
    return NextResponse.json({ error: 'Only the challenged defender can accept this duel.' }, { status: 400 })
  }

  if (duel.status !== 'pending') {
    return NextResponse.json({ error: 'This duel is no longer pending.' }, { status: 400 })
  }

  if (duel.challenge_expires_at && new Date(duel.challenge_expires_at).getTime() <= Date.now()) {
    await supabaseAdmin.from('duels').update({ status: 'declined' }).eq('id', duel.id)
    return NextResponse.json({ error: 'This challenge has expired.' }, { status: 410 })
  }

  const accepted = await DuelModel.acceptChallenge(duel)
  if ('error' in accepted) {
    return NextResponse.json({ error: accepted.error }, { status: 400 })
  }

  await UserModel.addAp(auth.user.id, 'duel_accepted', 0, {
    duel_id: duel.id,
    challenger_id: duel.challenger_id,
  })

  return NextResponse.json({ success: true, duel_id: accepted.data.id })
}
