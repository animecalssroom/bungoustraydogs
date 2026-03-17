import { NextResponse } from 'next/server'
import { DuelModel } from '@/backend/models/duel.model'
import { resolveDuelRoundWithAdmin } from '@/backend/lib/duel-runtime'
import { createClient } from '@/frontend/lib/supabase/server'
import { supabaseAdmin } from '@/backend/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { duelId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Trigger resolution if deadline passed
  await resolveDuelRoundWithAdmin(params.duelId)

  // Fetch fresh data
  const [duel, roundsResult, cooldownsResult] = await Promise.all([
    DuelModel.getDuelById(params.duelId),
    supabaseAdmin
      .from('duel_rounds')
      .select('id, duel_id, round_number, challenger_move, defender_move, challenger_move_submitted_at, defender_move_submitted_at, round_started_at, round_deadline, resolved_at, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative')
      .eq('duel_id', params.duelId)
      .order('round_number', { ascending: true })
      .limit(10),
    supabaseAdmin
      .from('duel_cooldowns')
      .select('*')
      .eq('duel_id', params.duelId)
      .limit(20)
  ])

  return NextResponse.json({
    data: {
      duel,
      rounds: roundsResult.data ?? [],
      cooldowns: cooldownsResult.data ?? []
    }
  })
}
