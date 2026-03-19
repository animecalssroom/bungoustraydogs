import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { WarRedisModel, WarzoneRole, DefenceStance } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { resolveWarOperative } from '@/backend/lib/war-operative'
import { cache as appCache } from '@/backend/lib/cache'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const { warId, role, stance } = await request.json() as { warId: string, role: WarzoneRole, stance: DefenceStance }
    const reject = (status: number, error: string, extra?: Record<string, unknown>) => {
      console.warn('[DEPLOY_API] rejected', {
        userId: auth.user.id,
        warId,
        role,
        stance,
        status,
        error,
        ...extra,
      })
      return NextResponse.json({ error, ...extra }, { status })
    }
    
    if (!warId || !role || !stance) {
      return reject(400, 'Incomplete deployment coordinates.')
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, faction, character_class, recovery_status, recovery_until')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (!profile) {
      return reject(404, 'Profile not found.')
    }

    // 1. Check Faction Participation
    const { data: war } = await supabaseAdmin
      .from('faction_wars')
      .select('id, faction_a_id, faction_b_id, status')
      .eq('id', warId)
      .single()

    if (!war || war.status === 'complete' || (profile.faction !== war.faction_a_id && profile.faction !== war.faction_b_id)) {
      return reject(403, 'Unauthorized: Your faction is not engaged in this conflict.', {
        profileFaction: profile.faction,
        factionA: war?.faction_a_id ?? null,
        factionB: war?.faction_b_id ?? null,
        warStatus: war?.status ?? null,
      })
    }

    // 2. Check Recovery & Deployment Lock
    const operative = await resolveWarOperative(auth.user.id)
    const activeWarId = await WarRedisModel.isUserAlreadyDeployed(auth.user.id)
    if (activeWarId && activeWarId !== warId) {
      const { data: lockedWar } = await supabaseAdmin
        .from('faction_wars')
        .select('id, status')
        .eq('id', activeWarId)
        .maybeSingle()

      if (lockedWar && lockedWar.status !== 'complete') {
        return reject(403, 'Deployment Failure: Operative already stationed in another active conflict.', {
          activeWarId
        })
      }

      await WarRedisModel.clearPlayerDeployment(auth.user.id, activeWarId)
    }

    const hasActiveRecovery =
      Boolean(operative.recovery_until && new Date(operative.recovery_until).getTime() > Date.now())

    if (hasActiveRecovery && profile.recovery_status === 'defeated' && activeWarId !== warId) {
      await Promise.all([
        supabaseAdmin
          .from('profiles')
          .update({ recovery_until: null, recovery_status: 'active' })
          .eq('id', auth.user.id),
        supabaseAdmin
          .from('user_characters')
          .update({ recovery_until: null })
          .eq('user_id', auth.user.id)
          .eq('is_equipped', true),
        WarRedisModel.clearRecovery(auth.user.id),
      ])
    }

    const refreshedOperative = hasActiveRecovery && profile.recovery_status === 'defeated' && activeWarId !== warId
      ? await resolveWarOperative(auth.user.id)
      : operative

    if (!refreshedOperative.slug) {
      return reject(403, 'Equip a character before deploying to a warzone.')
    }

    if (
      refreshedOperative.recovery_until &&
      new Date(refreshedOperative.recovery_until).getTime() > Date.now() &&
      (activeWarId === warId || profile.recovery_status === 'mia')
    ) {
      return reject(403, 'Cannot deploy: Physical integrity compromised.', {
        recoveryUntil: refreshedOperative.recovery_until,
        source: refreshedOperative.source,
        recoveryStatus: profile.recovery_status ?? null,
      })
    }

    // 2. Perform Deployment
    await WarRedisModel.deployPlayer(auth.user.id, warId, role, stance)
    await Promise.all([
      appCache.invalidate(`war:experience:${warId}:feed:${auth.user.id}`),
      appCache.invalidate(`war:experience:${warId}:null:${auth.user.id}`),
    ])
    
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
