import { NextRequest, NextResponse } from 'next/server'
import { requireUserId, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { cache as appCache } from '@/backend/lib/cache'

export async function GET(request: NextRequest) {
    const userId = await requireUserId(request)
    if (isNextResponse(userId)) return userId

    const duels = await appCache.getOrSet(`duels:pending:${userId}`, 5, async () =>
      DuelModel.getPendingChallengesForUser(userId),
    )
    return NextResponse.json({ data: duels })
}
