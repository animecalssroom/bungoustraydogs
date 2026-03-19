import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { WarRedisModel } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { getReviveAbilityOutcome, getWarAbilityProfile } from '@/backend/lib/war-abilities'
import { resolveWarOperative } from '@/backend/lib/war-operative'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const { targetUserId, warId } = await request.json()
    if (!targetUserId || !warId) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 })
    }

    const { data: war } = await supabaseAdmin
      .from('faction_wars')
      .select('faction_a_id, faction_b_id, status')
      .eq('id', warId)
      .maybeSingle()

    if (!war || war.status === 'complete') {
      return NextResponse.json({ error: 'War not found.' }, { status: 404 })
    }

    const profile = await UserModel.getById(auth.user.id)
    const target = await UserModel.getById(targetUserId)
    
    if (!profile || !target) return NextResponse.json({ error: 'Operative data missing.' }, { status: 404 })

    // 1. Check Role and target recovery
    const [healerOperative, { data: targetChar }] = await Promise.all([
      resolveWarOperative(auth.user.id),
      supabaseAdmin
        .from('user_characters')
        .select('*, characters(*)')
        .eq('user_id', targetUserId)
        .eq('is_equipped', true)
        .maybeSingle()
    ])

    if (!healerOperative.slug || !targetChar?.characters) {
      return NextResponse.json({ error: 'Operative data missing or character not equipped.' }, { status: 404 })
    }

    const charInfo = healerOperative
    const targetCharInfo = targetChar.characters as any

    const healerAbility = getWarAbilityProfile(charInfo.slug, charInfo.class_tag)
    if (!healerAbility.support && charInfo.class_tag !== 'SUPPORT') {
      return NextResponse.json({ error: 'Class not authorized for REVIVE protocols. Requires SUPPORT.' }, { status: 403 })
    }

    if (profile.faction !== target.faction) {
        return NextResponse.json({ error: 'Cannot stabilize hostile signatures.' }, { status: 403 })
    }

    if (!targetChar.recovery_until || new Date(targetChar.recovery_until).getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Target signature is already active.' }, { status: 400 })
    }

    // 2. Perform Revive
    await supabaseAdmin
      .from('user_characters')
      .update({ recovery_until: null })
      .eq('id', targetChar.id)

    const reviveAbility = getReviveAbilityOutcome(charInfo.slug, charInfo.class_tag)

    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .update({ recovery_until: null, recovery_status: 'active' })
        .eq('id', targetUserId),
      WarRedisModel.clearRecovery(targetUserId),
      reviveAbility.integrityBonus > 0
        ? WarRedisModel.updateIntegrity(
            warId,
            profile.faction === war.faction_a_id ? -reviveAbility.integrityBonus : reviveAbility.integrityBonus,
          )
        : Promise.resolve(50),
    ])
    
    // 3. Log Transmission
    const msg = `[SUPPORT] @${profile.username} [${charInfo.class_tag}] successfully stabilized signature @${target.username}. Operative returned to field.${reviveAbility.note ? ` ${reviveAbility.note}` : ''}`
    await WarRedisModel.pushTransmission(warId, msg, 'reinforce')

    return NextResponse.json({ success: true, message: msg })
  } catch (error: any) {
    console.error('[REVIVE_API] Error:', error)
    return NextResponse.json({ error: 'System integrity failure during Revive.' }, { status: 500 })
  }
}
