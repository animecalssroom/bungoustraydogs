import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { invalidateNotificationsCache } from '@/backend/lib/notifications-cache'

const ChallengeSchema = z.object({
  defender_id: z.string().uuid(),
  message: z.string().trim().max(100).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const body = await request.json().catch(() => null)
  const parsed = ChallengeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid duel challenge payload.' }, { status: 400 })
  }

  const challenger = await DuelModel.getParticipant(auth.user.id)
  const defender = await DuelModel.getParticipant(parsed.data.defender_id)

  if (!challenger || !defender) {
    return NextResponse.json({ error: 'Defender not found in the registry.' }, { status: 400 })
  }

  let created
  if (defender.is_bot) {
    created = await DuelModel.createBotChallenge(challenger, defender, parsed.data.message)
  } else {
    created = await DuelModel.createChallenge(challenger, defender, parsed.data.message)
  }
  if ('error' in created) {
    const errorText = created.error ?? 'Unable to file the duel challenge.'
    const message =
      errorText.includes('relation "duels"') || errorText.includes("relation 'duels'")
        ? 'The duel registry tables are not live yet. Run the duel migration in Supabase first.'
        : errorText.includes('column') || errorText.includes('schema cache')
          ? 'The duel registry schema is out of date. Apply the latest duel migration in Supabase.'
          : errorText

    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (defender.is_bot) {
    const accepted = await DuelModel.acceptChallenge(created.data)
    if (!('error' in accepted)) {
      await supabaseAdmin.from('notifications').insert({
        user_id: challenger.id,
        type: 'duel_accepted',
        message: `${defender.character_name ?? defender.username} accepted your challenge immediately.`,
        reference_id: accepted.data.id,
        action_url: `/duels/${accepted.data.id}`,
        payload: {
          duel_id: accepted.data.id,
          bot_auto_accept: true,
        },
      })
      try { await invalidateNotificationsCache(challenger.id) } catch (err) { console.error('[notifications] invalidate error', err) }

      await supabaseAdmin.from('user_events').insert({
        user_id: defender.id,
        event_type: 'duel_accepted',
        ap_awarded: 0,
        faction: defender.faction,
        metadata: {
          duel_id: accepted.data.id,
          bot_auto_accept: true,
        },
      })

      return NextResponse.json({ success: true, duel_id: accepted.data.id, active: true })
    }
  }

  return NextResponse.json({ success: true, duel_id: created.data.id })
}
