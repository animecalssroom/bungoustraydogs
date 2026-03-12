import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { OwnerConsole } from '@/frontend/components/owner/OwnerConsole'
import { OwnerModel } from '@/backend/models/owner.model'
import type { Profile } from '@/backend/types'

async function getViewerProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Profile | null) ?? null
}

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
    <>
      <Nav />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
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
      </main>
      <Footer />
    </>
  )
}
