import { redirect } from 'next/navigation'
import { OwnerConsole } from '@/frontend/components/owner/OwnerConsole'
import { OwnerModel } from '@/backend/models/owner.model'
import { getViewerProfile } from '@/frontend/lib/auth-server'


export default async function OwnerPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  if (viewer.role !== 'owner') {
    redirect('/')
  }

  const dashboard = await OwnerModel.getDashboard()

  return (
    <div style={{ paddingTop: '36px' }}>
      <section className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
        <OwnerConsole
          users={dashboard.users}
          flags={dashboard.flags}
          slots={dashboard.slots}
          events={dashboard.events}
          reservedCharacters={dashboard.reservedCharacters}
          specialDivisionRecommendations={dashboard.specialDivisionRecommendations}
          supportTickets={dashboard.supportTickets}
          contentFlags={dashboard.contentFlags}
        />
      </section>
    </div>
  )
}
