import { redirect } from 'next/navigation'
import { SpecialDivisionConsole } from '@/frontend/components/admin/SpecialDivisionConsole'
import { SpecialDivisionModel } from '@/backend/models/special-division.model'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'
import { getViewerProfile } from '@/frontend/lib/auth-server'


export default async function Page() {
  const viewer = await getViewerProfile()
  if (!viewer) {
    redirect('/login')
  }
  const canAccess =
    viewer.role === 'owner' ||
    (viewer.role === 'mod' && viewer.faction === 'special_div')
  if (!canAccess) {
    redirect('/')
  }
  const dashboard = await SpecialDivisionModel.getDashboard()
  return (
    <ErrorBoundary>
      <div style={{ paddingTop: '36px' }}>
        <section className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
          <SpecialDivisionConsole
            unplaceable={dashboard.unplaceable}
            longTermWaitlist={dashboard.longTermWaitlist}
            tickets={dashboard.tickets}
            contentFlags={dashboard.contentFlags}
          />
        </section>
      </div>
    </ErrorBoundary>
  )
}
