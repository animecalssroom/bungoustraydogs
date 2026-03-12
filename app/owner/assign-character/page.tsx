import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { OwnerModel } from '@/backend/models/owner.model'
import { ReservedCharacterDesk } from '@/frontend/components/owner/ReservedCharacterDesk'
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

export default async function OwnerAssignCharacterPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  if (viewer.role !== 'owner') {
    redirect('/')
  }

  const data = await OwnerModel.getReservedAssignmentData()

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <section className="section-wrap" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
          <ReservedCharacterDesk
            users={data.users}
            reservedCharacters={data.reservedCharacters}
          />
        </section>
      </main>
      <Footer />
    </>
  )
}
