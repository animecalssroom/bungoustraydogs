import { redirect } from 'next/navigation'
import { SupportModel } from '@/backend/models/support.model'
import { TicketDesk } from '@/frontend/components/support/TicketDesk'
import { getViewerUserId } from '@/frontend/lib/auth-server'

export const dynamic = 'force-dynamic'

export default async function TicketPage() {
  const userId = await getViewerUserId()

  if (!userId) {
    redirect('/login')
  }

  const desk = await SupportModel.getUserDesk(userId)

  return (
    <section className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <TicketDesk initialTickets={desk.tickets} initialFlags={desk.flags} />
    </section>
  )
}
