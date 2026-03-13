import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'

const OpenChallengeSchema = z.object({
  message: z.string().trim().max(80).optional(),
})

const WithdrawOpenSchema = z.object({
  open_challenge_id: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const challenges = await DuelModel.getOpenChallenges(auth.user.id, auth.profile.faction)
  return NextResponse.json({ data: challenges })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = OpenChallengeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid open challenge payload.' }, { status: 400 })
  }

  const challenger = await DuelModel.getParticipant(auth.user.id)
  if (!challenger) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  }

  const created = await DuelModel.createOpenChallenge(challenger, parsed.data.message)
  if ('error' in created) {
    return NextResponse.json({ error: created.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: created.data })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = WithdrawOpenSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid open challenge withdrawal payload.' }, { status: 400 })
  }

  const withdrawn = await DuelModel.withdrawOpenChallenge(auth.user.id, parsed.data.open_challenge_id)
  if ('error' in withdrawn) {
    return NextResponse.json({ error: withdrawn.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: withdrawn.data })
}
