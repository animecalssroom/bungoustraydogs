import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { UserModel } from '@/backend/models/user.model'
import { WarRedisModel } from '@/backend/models/war-redis.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  try {
    const { targetUserId, warId } = await request.json()
    if (!targetUserId || !warId) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 })
    }

    const profile = await UserModel.getById(auth.user.id)
    const target = await UserModel.getById(targetUserId)
    
    if (!profile || !target) return NextResponse.json({ error: 'Operative data missing.' }, { status: 404 })

    // 1. Check Role and target recovery
    const [{ data: userChar }, { data: targetChar }] = await Promise.all([
      supabaseAdmin
        .from('user_characters')
        .select('*, characters(*)')
        .eq('user_id', auth.user.id)
        .eq('is_equipped', true)
        .maybeSingle(),
      supabaseAdmin
        .from('user_characters')
        .select('*, characters(*)')
        .eq('user_id', targetUserId)
        .eq('is_equipped', true)
        .maybeSingle()
    ])

    if (!userChar?.characters || !targetChar?.characters) {
      return NextResponse.json({ error: 'Operative data missing or character not equipped.' }, { status: 404 })
    }

    const charInfo = userChar.characters as any
    const targetCharInfo = targetChar.characters as any

    if (charInfo.class_tag !== 'SUPPORT') {
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
    
    // 3. Log Transmission
    const msg = `[SUPPORT] @${profile.username} [${charInfo.class_tag}] successfully stabilized signature @${target.username}. Operative returned to field.`
    await WarRedisModel.pushTransmission(warId, msg, 'reinforce')

    return NextResponse.json({ success: true, message: msg })
  } catch (error: any) {
    console.error('[REVIVE_API] Error:', error)
    return NextResponse.json({ error: 'System integrity failure during Revive.' }, { status: 500 })
  }
}
