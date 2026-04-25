import { notFound, redirect } from 'next/navigation'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelScreenClient } from '@/components/duels/DuelScreenClient'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { resolveDuelRoundWithAdmin } from '@/backend/lib/duel-runtime'
import type { DuelRound, Profile } from '@/backend/types/index'
import { GAMBIT_MAX_PER_DUEL, deriveMoveConstraints } from '@/lib/duels/shared'
import type { MoveConstraints } from '@/backend/types/index'
import { getViewerUserId } from '@/frontend/lib/auth-server'

const ROUNDS_SELECT = [
  'id', 'duel_id', 'round_number',
  'challenger_move', 'challenger_override_character', 'challenger_move_submitted_at',
  'defender_move', 'defender_move_submitted_at',
  'round_started_at', 'round_deadline', 'is_sudden_death',
  'reversal_available', 'reversal_deadline', 'reversal_used',
  'challenger_damage_dealt', 'defender_damage_dealt',
  'challenger_hp_after', 'defender_hp_after',
  'special_events', 'narrative', 'narrative_is_fallback', 'resolved_at',
].join(', ')

/** Only trigger resolution if the active round is actually past its deadline */
function shouldResolve(rounds: DuelRound[]): boolean {
  const activeRound = rounds.find(r => !r.resolved_at)
  if (!activeRound?.round_deadline) return false
  return new Date(activeRound.round_deadline).getTime() < Date.now()
}

export default async function DuelPage({
  params,
}: {
  params: { duelId: string }
}) {
  const userId = await getViewerUserId()
  if (!userId) redirect('/login')

  const [duel, viewer] = await Promise.all([
    DuelModel.getDuelById(params.duelId),
    DuelModel.getParticipant(userId),
  ])

  if (!duel) notFound()
  if (!viewer) redirect('/duels')

  const isParticipant =
    duel.challenger_id === userId || duel.defender_id === userId

  if (!isParticipant && !duel.is_ranked && duel.status !== 'complete') {
    redirect('/duels')
  }

  // Fetch rounds first
  const roundsResult = await supabaseAdmin
    .from('duel_rounds')
    .select(ROUNDS_SELECT)
    .eq('duel_id', duel.id)
    .order('round_number', { ascending: true })
    .limit(10)

  let rounds = (roundsResult.data as DuelRound[] | null) ?? []

  // ── KEY FIX: Only call the resolver when deadline has actually passed ──
  let refreshedDuel = duel
  if (duel.status === 'active' && shouldResolve(rounds)) {
    const didResolve = await resolveDuelRoundWithAdmin(duel.id)
    if (didResolve) {
      // Re-fetch only what changed
      const [newDuel, newRoundsResult] = await Promise.all([
        DuelModel.getDuelById(params.duelId),
        supabaseAdmin
          .from('duel_rounds')
          .select(ROUNDS_SELECT)
          .eq('duel_id', duel.id)
          .order('round_number', { ascending: true })
          .limit(10),
      ])
      refreshedDuel = newDuel ?? duel
      rounds = (newRoundsResult.data as DuelRound[] | null) ?? rounds
    }
  }

  const moveConstraints: MoveConstraints = isParticipant
    ? deriveMoveConstraints(rounds, userId, duel.challenger_id ?? '')
    : { gambitsRemaining: 0, specialAvailable: false }

  return (
    <section
      className="section-wrap"
      style={{ paddingTop: '3rem', paddingBottom: '5rem' }}
    >
      <DuelScreenClient
        initialDuel={refreshedDuel}
        initialRounds={rounds}
        viewer={{
          id: viewer.id,
          character_name: viewer.character_name,
          character_ability: viewer.character_ability
        } as Pick<Profile, 'id' | 'character_name' | 'character_ability'>}
        moveConstraints={moveConstraints}
      />
    </section>
  )
}