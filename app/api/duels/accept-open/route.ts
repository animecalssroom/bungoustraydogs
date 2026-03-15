import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { UserModel } from '@/backend/models/user.model'

const AcceptOpenSchema = z.object({
  open_challenge_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  // --- BOT AUTH BYPASS ---
  const secret = request.headers.get('x-bot-secret')
  const body = await request.json().catch(() => null)
  const isBot = secret && process.env.BOT_DUEL_SECRET && secret === process.env.BOT_DUEL_SECRET
  const botUserId = body?.bot_user_id

  let userId: string
  if (isBot && botUserId) {
    userId = botUserId
  } else {
    const auth = await requireAuth(request)
    if (isNextResponse(auth)) return auth
    userId = auth.user.id
  }

  const parsed = AcceptOpenSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid open challenge payload.' }, { status: 400 })
  }

  const defender = await DuelModel.getParticipant(userId)
  if (!defender) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  const accepted = await DuelModel.acceptOpenChallenge(parsed.data.open_challenge_id, defender)
  if ('error' in accepted) {
    return NextResponse.json({ error: accepted.error }, { status: 400 })
  }

  await UserModel.addAp(userId, 'duel_accepted', 0, {
    duel_id: accepted.data.id,
    open_challenge_id: parsed.data.open_challenge_id,
  })

  return NextResponse.json({ success: true, duel_id: accepted.data.id })
}
