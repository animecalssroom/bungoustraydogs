import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { WarRedisModel } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const { searchParams } = new URL(request.url)
  const warId = searchParams.get('warId')

  if (!warId) {
    return NextResponse.json({ error: 'Missing warId.' }, { status: 400 })
  }

  try {
    const districtId = searchParams.get('districtId')
    const { data: profile } = await supabaseAdmin.from('profiles').select('faction').eq('id', auth.user.id).single()
    const userFaction = profile?.faction

    const [integrity, transmissions, deployment, isRecovering, userChar, isRevealed] = await Promise.all([
      WarRedisModel.getIntegrity(warId),
      WarRedisModel.getTransmissions(warId),
      WarRedisModel.getPlayerDeployment(auth.user.id, warId),
      WarRedisModel.isRecovering(auth.user.id),
      supabaseAdmin
        .from('user_characters')
        .select('*, characters(class_tag)')
        .eq('user_id', auth.user.id)
        .eq('is_equipped', true)
        .maybeSingle(),
      districtId && userFaction ? WarRedisModel.isDistrictRevealed(districtId, userFaction) : Promise.resolve(false)
    ])

    return NextResponse.json({
      integrity,
      transmissions,
      deployment,
      isRecovering,
      isRevealed,
      class_tag: (userChar?.data as any)?.characters?.class_tag || 'BRUTE',
      userFaction: userFaction || null
    })
  } catch (error: any) {
    console.error('[WAR_EXPERIENCE_API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tactical data.' }, { status: 500 })
  }
}
