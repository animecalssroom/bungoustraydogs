import { redirect } from 'next/navigation'
import { DuelModel } from '@/backend/models/duel.model'
import { DuelHubClient } from '@/components/duels/DuelHubClient'
import { getViewerUserId } from '@/frontend/lib/auth-server'

export default async function DuelsPage() {
  const userId = await getViewerUserId()

  if (!userId) {
    redirect('/login')
  }

  const profile = await DuelModel.getParticipant(userId)
  if (!profile) {
    redirect('/')
  }

  const [duels, history, openChallenges] = await Promise.all([
    DuelModel.getActiveForUser(userId),
    DuelModel.getHistoryForUser(userId),
    DuelModel.getOpenChallenges(userId, profile.faction),
  ])

  return (
    <section className="section-wrap" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <DuelHubClient
        userId={userId}
        initialDuels={duels}
        initialHistory={history}
        initialOpenChallenges={openChallenges}
      />
    </section>
  )
}
