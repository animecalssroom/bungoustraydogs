import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { SupportModel } from '@/backend/models/support.model'
import { TicketDesk } from '@/frontend/components/support/TicketDesk'

export const dynamic = 'force-dynamic'

export default async function TicketPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const desk = await SupportModel.getUserDesk(user.id)

  return (
    <section className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <TicketDesk initialTickets={desk.tickets} initialFlags={desk.flags} />
    </section>
  )
}
