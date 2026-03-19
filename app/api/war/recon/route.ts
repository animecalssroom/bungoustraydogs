import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { WarRedisModel } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { canUseWarRecon, getReconAbilityOutcome } from '@/backend/lib/war-abilities'
import { resolveWarOperative } from '@/backend/lib/war-operative'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const { districtId, warId } = await request.json()
    if (!districtId || !warId) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 })
    }

    const profile = await UserModel.getById(auth.user.id)
    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })

    const { data: war } = await supabaseAdmin
      .from('faction_wars')
      .select('id, faction_a_id, faction_b_id, status')
      .eq('id', warId)
      .maybeSingle()

    if (!war || war.status === 'complete' || (profile.faction !== war.faction_a_id && profile.faction !== war.faction_b_id)) {
      return NextResponse.json({ error: 'Your faction is not cleared for this conflict.' }, { status: 403 })
    }

    const deployment = await WarRedisModel.getPlayerDeployment(auth.user.id, warId)
    if (!deployment) {
      return NextResponse.json({ error: 'Deploy to the district before attempting recon.' }, { status: 403 })
    }

    const operative = await resolveWarOperative(auth.user.id)
    if (!operative.slug) {
      return NextResponse.json({ error: 'No active character signature detected.' }, { status: 403 })
    }

    const canRecon = canUseWarRecon(operative.slug, operative.class_tag)
    if (!canRecon) {
      return NextResponse.json({ error: 'Operative is not authorized for recon signatures.' }, { status: 403 })
    }

    if (operative.recovery_until && new Date(operative.recovery_until).getTime() > Date.now()) {
      return NextResponse.json({ error: 'Signature unstable. User is in recovery.' }, { status: 403 })
    }

    // 3. Perform Recon
    const reconAbility = getReconAbilityOutcome(operative.slug, operative.class_tag)
    await WarRedisModel.revealDistrict(districtId, profile.faction!, {
      durationSeconds: reconAbility.durationSeconds,
      sourceSlug: operative.slug,
      revealFields: reconAbility.revealFields,
    })
    
    // 4. Log Transmission
    const msg = `[RECON] @${profile.username} [${operative.name ?? profile.character_class}] decrypted Sector ${districtId.toUpperCase()}. ${reconAbility.note ?? 'Enemy guard placements are revealed.'}`
    await WarRedisModel.pushTransmission(warId, msg, 'recon')

    return NextResponse.json({ success: true, message: msg })
  } catch (error: any) {
    console.error('[RECON_API] Error:', error)
    return NextResponse.json({ error: 'System integrity failure during Recon.' }, { status: 500 })
  }
}
