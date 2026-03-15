import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/backend/middleware/auth'
import { DuelModel } from '@/backend/models/duel.model'
import { supabaseAdmin } from '@/backend/lib/supabase'

export const dynamic = 'force-dynamic'

function buildFallbackSummary(duel: Awaited<ReturnType<typeof DuelModel.getDuelById>>) {
  if (!duel) {
    return 'The registry cannot locate this duel record.'
  }

  const challenger = duel.challenger_character ?? 'Operative'
  const defender = duel.defender_character ?? 'Operative'

  if (!duel.winner_id || !duel.loser_id) {
    return `The duel between ${challenger} and ${defender} closes without a decisive finish. The registry records the result as unresolved.`
  }

  const winner = duel.winner_id === duel.challenger_id ? challenger : defender
  const loser = duel.loser_id === duel.challenger_id ? challenger : defender
  const comeback = (duel.winner_id === duel.challenger_id && duel.challenger_came_back) || (duel.winner_id === duel.defender_id && duel.defender_came_back)

  if (comeback) {
    return `${winner} drags the duel back from the edge and closes the file over ${loser}. Yokohama records the reversal without appeal.`
  }

  return `${winner} forces ${loser} out of the exchange and closes the duel in their favor. The registry files the outcome for Yokohama to remember.`
}

function computeOutcome(duel: NonNullable<Awaited<ReturnType<typeof DuelModel.getDuelById>>>, viewerId: string) {
  if (!duel.winner_id || !duel.loser_id) {
    return { result: 'draw' as const, apLabel: '+5 AP' }
  }

  const viewerWon = duel.winner_id === viewerId
  const comeback = (viewerWon && duel.winner_id === duel.challenger_id && duel.challenger_came_back) || (viewerWon && duel.winner_id === duel.defender_id && duel.defender_came_back)

  if (viewerWon) {
    return { result: 'victory' as const, apLabel: comeback ? '+75 AP' : '+50 AP' }
  }

  return { result: 'defeat' as const, apLabel: '-20 AP' }
}

export async function GET(request: NextRequest, { params }: { params: { duelId: string } }) {
  const auth = await requireAuth(request)
  if (isNextResponse(auth)) return auth

  const duel = await DuelModel.getDuelById(params.duelId)
  if (!duel) {
    return NextResponse.json({ error: 'Duel not found.' }, { status: 404 })
  }

  if (duel.challenger_id !== auth.user.id && duel.defender_id !== auth.user.id && !duel.is_ranked) {
    return NextResponse.json({ error: 'This duel is not on your file.' }, { status: 403 })
  }

  const notification = await supabaseAdmin
    .from('notifications')
    .select('message')
    .eq('user_id', auth.user.id)
    .eq('type', 'duel_complete')
    .eq('reference_id', duel.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const summary = notification.data?.message?.trim() || buildFallbackSummary(duel)
  const outcome = computeOutcome(duel, auth.user.id)

  return NextResponse.json({
    data: {
      summary,
      result: outcome.result,
      apLabel: outcome.apLabel,
    },
  })
}
