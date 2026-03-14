import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import { SpecialDivisionConsole } from '@/frontend/components/admin/SpecialDivisionConsole'
import { SpecialDivisionModel } from '@/backend/models/special-division.model'
import type { Profile } from '@/backend/types'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'

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
    .select('id, username, role, rank, faction, theme, bio, created_at, last_seen, character_match_id, character_name, character_ability, character_type, character_description, exam_completed')
    .eq('id', user.id)
    .maybeSingle()

  return (data as Profile | null) ?? null
}

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
