import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelScreenClient } from '@/components/duels/DuelScreenClient'
import { supabaseAdmin } from '@/backend/lib/supabase'
import { resolveDuelRoundWithAdmin } from '@/backend/lib/duel-runtime'
import type { DuelRound, Profile } from '@/backend/types/index'

// ─── Move limit constants ──────────────────────────────────────────────────
const GAMBIT_MAX_PER_DUEL = 2

export type MoveConstraints = {
  gambitsRemaining: number
  specialAvailable: boolean
}

function deriveMoveConstraints(
  rounds: DuelRound[],
  userId: string,
  challengerId: string,
): MoveConstraints {
  const isChallenger = userId === challengerId
  let gambitsUsed = 0
  let specialUsed = false

  for (const r of rounds) {
    const move = isChallenger ? r.challenger_move : r.defender_move
    if (!move) continue
    // Use lowerCase for robustness in move comparison
    const moveLower = move.toLowerCase()
    if (moveLower === 'gambit') gambitsUsed++
    if (moveLower === 'special') specialUsed = true
  }

  return {
    gambitsRemaining: Math.max(0, GAMBIT_MAX_PER_DUEL - gambitsUsed),
    specialAvailable: !specialUsed,
  }
}

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

export default async function DuelPage({
  params,
}: {
  params: { duelId: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch duel + viewer in parallel
  const [duel, viewer] = await Promise.all([
    DuelModel.getDuelById(params.duelId),
    DuelModel.getParticipant(user.id),
  ])

  if (!duel) notFound()
  if (!viewer) redirect('/duels')

  const isParticipant =
    duel.challenger_id === user.id || duel.defender_id === user.id

  // Non-participants can only view ranked duels or completed duels
  if (!isParticipant && !duel.is_ranked && duel.status !== 'complete') {
    redirect('/duels')
  }

  // Resolve stuck round + fetch rounds in parallel
  const [, roundsResult] = await Promise.all([
    resolveDuelRoundWithAdmin(duel.id),
    supabaseAdmin
      .from('duel_rounds')
      .select(ROUNDS_SELECT)
      .eq('duel_id', duel.id)
      .order('round_number', { ascending: true })
      .limit(10),
  ])

  // Re-fetch after resolution so HP/status is fresh
  const refreshedDuel = (await DuelModel.getDuelById(params.duelId)) ?? duel
  const rounds = (roundsResult.data as DuelRound[] | null) ?? []

  const moveConstraints: MoveConstraints = isParticipant
    ? deriveMoveConstraints(rounds, user.id, duel.challenger_id ?? '')
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