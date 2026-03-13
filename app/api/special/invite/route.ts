import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { invalidateNotificationsCache } from '@/backend/lib/notifications-cache'
import { validate } from '@/backend/middleware/validate'

const InviteSchema = z.object({
  target_user_id: z.string().uuid(),
  target_username: z.string().optional(),
})

function canInvite(authProfile: { role: string; faction: string | null }) {
  return authProfile.role === 'mod' && authProfile.faction === 'special_div'
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isNextResponse(auth)) return auth

  if (!canInvite(auth.profile)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = validate(InviteSchema, body)
  if (!parsed.success) return parsed.response

  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('id, username, role, faction')
    .eq('id', parsed.data.target_user_id)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Target not found' }, { status: 404 })
  }

  if (target.faction === 'special_div') {
    return NextResponse.json(
      { error: 'User already designated.', target_username: target.username },
      { status: 409 },
    )
  }

  const nextRole =
    target.role === 'owner' || target.role === 'mod' ? target.role : 'member'

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      faction: 'special_div',
      role: nextRole,
      faction_assigned_at: now,
      character_name: null,
      character_match_id: null,
      character_ability: null,
      character_ability_jp: null,
      character_description: null,
      character_type: null,
      character_assigned_at: null,
      updated_at: now,
    })
    .eq('id', target.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await supabaseAdmin
    .from('observer_pool')
    .update({
      status: 'designated',
      reviewed_at: now,
      updated_at: now,
    })
    .eq('user_id', target.id)

  await supabaseAdmin.from('notifications').insert({
    user_id: target.id,
    message: 'You were not supposed to be here. Report to the Special Division registry.',
    type: 'special_division_invite',
    payload: {
      faction: 'special_div',
      redirect_to: '/faction/special_div',
    },
  })

  try { await invalidateNotificationsCache(target.id) } catch (err) { console.error('[notifications] invalidate error', err) }

  await supabaseAdmin.from('notifications').insert({
    user_id: auth.user.id,
    message: `${target.username} has been entered into the Special Division registry.`,
    type: 'special_division_transmitted',
    payload: {
      target_user_id: target.id,
      target_username: target.username,
    },
  })

  try { await invalidateNotificationsCache(auth.user.id) } catch (err) { console.error('[notifications] invalidate error', err) }

  await supabaseAdmin.from('faction_activity').insert({
    faction_id: 'special_div',
    event_type: 'member_designated',
    description: 'A new signature has been added to the Special Division registry.',
    actor_id: auth.user.id,
  })

  await supabaseAdmin.from('user_events').insert({
    user_id: target.id,
    event_type: 'special_division_designated',
    ap_awarded: 0,
    faction: 'special_div',
    metadata: {},
  })

  return NextResponse.json({
    success: true,
    target_username: target.username,
  })
}
