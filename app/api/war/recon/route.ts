import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { WarRedisModel } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

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

    // 1. Check Class and Recovery
    // Fetch character-specific data from the new schema
    const { data: userChar } = await supabaseAdmin
      .from('user_characters')
      .select('*, characters(*)')
      .eq('user_id', auth.user.id)
      .eq('is_equipped', true)
      .maybeSingle()

    if (!userChar?.characters) {
      return NextResponse.json({ error: 'No active character signature detected.' }, { status: 403 })
    }

    const charInfo = userChar.characters as any
    if (charInfo.class_tag !== 'INTEL') {
      return NextResponse.json({ error: 'Operative class not authorized for RECON signatures. Requires INTEL.' }, { status: 403 })
    }

    if (userChar.recovery_until && new Date(userChar.recovery_until).getTime() > Date.now()) {
      return NextResponse.json({ error: 'Signature unstable. User is in recovery.' }, { status: 403 })
    }

    // 3. Perform Recon
    await WarRedisModel.revealDistrict(districtId, profile.faction!)
    
    // 4. Log Transmission
    const msg = `[RECON] @${profile.username} [${profile.character_class}] decrypted Sector ${districtId.toUpperCase()}. Enemy positions revealed for 12h.`
    await WarRedisModel.pushTransmission(warId, msg, 'recon')

    return NextResponse.json({ success: true, message: msg })
  } catch (error: any) {
    console.error('[RECON_API] Error:', error)
    return NextResponse.json({ error: 'System integrity failure during Recon.' }, { status: 500 })
  }
}
