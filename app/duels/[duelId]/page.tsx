import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelScreenClient } from '@/components/duels/DuelScreenClient'
import { supabaseAdmin } from '@/backend/lib/supabase'
import type { Duel, DuelRound } from '@/backend/types'
import { resolveDuelRoundWithAdmin } from '@/backend/lib/duel-runtime'

async function resolveStuckRoundIfNeeded(duel: Duel) {
  await resolveDuelRoundWithAdmin(duel.id)
}

export default async function DuelPage({ params }: { params: { duelId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const duel = await DuelModel.getDuelById(params.duelId)
  if (!duel) {
    notFound()
  }

  if (duel.challenger_id !== user.id && duel.defender_id !== user.id && !duel.is_ranked) {
    redirect('/duels')
  }

  await resolveStuckRoundIfNeeded(duel)
  const refreshedDuel = (await DuelModel.getDuelById(params.duelId)) ?? duel

  const { data: rounds } = await supabaseAdmin
    .from('duel_rounds')
    .select('id, duel_id, round_number, challenger_move, challenger_override_character, challenger_move_submitted_at, defender_move, defender_move_submitted_at, round_started_at, round_deadline, reversal_available, reversal_deadline, reversal_used, challenger_damage_dealt, defender_damage_dealt, challenger_hp_after, defender_hp_after, special_events, narrative, narrative_is_fallback, resolved_at')
    .eq('duel_id', duel.id)
    .order('round_number', { ascending: true })
    .limit(10)

  const viewer = await DuelModel.getParticipant(user.id)
  if (!viewer) {
    redirect('/duels')
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <section className="section-wrap" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <DuelScreenClient
            initialDuel={refreshedDuel}
            initialRounds={(rounds as DuelRound[] | null) ?? []}
            viewer={{ id: viewer.id, character_name: viewer.character_name }}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
