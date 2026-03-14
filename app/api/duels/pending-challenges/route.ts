import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'

export async function GET(request: NextRequest) {
    const auth = await requireAuth(request)
    if (isNextResponse(auth)) return auth

    const duels = await DuelModel.getPendingChallengesForUser(auth.user.id)
    return NextResponse.json({ data: duels })
}
