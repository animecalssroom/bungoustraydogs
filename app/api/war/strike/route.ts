import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { FactionWarModel } from '@/backend/models/faction-war.model'
import { WarRedisModel } from '@/backend/models/war-redis.model'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const { defenderId, warId, approach } = await request.json()
    
    if (!defenderId || !warId || !approach) {
      return NextResponse.json({ error: 'Incomplete combat coordinates.' }, { status: 400 })
    }

    // 1. Role Enforcement: Only Vanguards can strike
    const deployment = await WarRedisModel.getPlayerDeployment(auth.user.id, warId)
    if (deployment?.role !== 'vanguard') {
      return NextResponse.json({ error: 'Combat capability restricted: Only operatives in VANGUARD formation can initiate strikes.' }, { status: 403 })
    }

    const result = await FactionWarModel.resolveShadowDuel(
      auth.user.id,
      defenderId,
      warId,
      approach
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[STRIKE_API] Error:', error)
    return NextResponse.json({ error: error.message || 'Combat link severed.' }, { status: 500 })
  }
}
