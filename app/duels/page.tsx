import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelHubClient } from '@/components/duels/DuelHubClient'

export default async function DuelsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await DuelModel.getParticipant(user.id)
  if (!profile) {
    redirect('/')
  }

  const [duels, history, openChallenges] = await Promise.all([
    DuelModel.getActiveForUser(user.id),
    DuelModel.getHistoryForUser(user.id),
    DuelModel.getOpenChallenges(user.id, profile.faction),
  ])

  return (
    <section className="section-wrap" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <DuelHubClient
        userId={user.id}
        initialDuels={duels}
        initialHistory={history}
        initialOpenChallenges={openChallenges}
      />
    </section>
  )
}
