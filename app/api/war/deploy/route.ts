import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { WarRedisModel, WarzoneRole, DefenceStance } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const { warId, role, stance } = await request.json() as { warId: string, role: WarzoneRole, stance: DefenceStance }
    
    if (!warId || !role || !stance) {
      return NextResponse.json({ error: 'Incomplete deployment coordinates.' }, { status: 400 })
    }

    const profile = await UserModel.getById(auth.user.id)
    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })

    // 1. Check Faction Participation
    const { data: war } = await supabaseAdmin
      .from('faction_wars')
      .select('faction_a_id, faction_b_id')
      .eq('id', warId)
      .single()

    if (!war || (profile.faction !== war.faction_a_id && profile.faction !== war.faction_b_id)) {
      return NextResponse.json({ error: 'Unauthorized: Your faction is not engaged in this conflict.' }, { status: 403 })
    }

    // 2. Check Recovery & Deployment Lock
    if (await WarRedisModel.isRecovering(auth.user.id)) {
      return NextResponse.json({ error: 'Cannot deploy: Physical integrity compromised.' }, { status: 403 })
    }

    const activeWarId = await WarRedisModel.isUserAlreadyDeployed(auth.user.id)
    if (activeWarId && activeWarId !== warId) {
      return NextResponse.json({ 
        error: 'Deployment Failure: Operative already stationed in another active conflict.',
        activeWarId 
      }, { status: 403 })
    }

    // 2. Perform Deployment
    await WarRedisModel.deployPlayer(auth.user.id, warId, role, stance)
    
    // 3. Log Transmission
    const roleLabel = role.toUpperCase() === 'GUARD' ? 'DEFENSIVE POSITION' : 'VANGUARD LINE'
    const msg = `[DEPLOY] @${profile.username} [${profile.character_class}] has entered the Warzone. Assigned to ${roleLabel} with ${stance.toUpperCase()} stance.`
    await WarRedisModel.pushTransmission(warId, msg, 'system')

    return NextResponse.json({ success: true, message: msg })
  } catch (error: any) {
    console.error('[DEPLOY_API] Error:', error)
    return NextResponse.json({ error: 'Deployment failure: Link to Command Center severed.' }, { status: 500 })
  }
}
