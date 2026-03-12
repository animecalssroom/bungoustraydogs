import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import type { Profile } from '@/backend/types'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { RegistrySubmitForm } from '@/frontend/components/registry/RegistrySubmitForm'

async function getViewerProfile() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase.from('profiles').select('id, username, role, rank, faction, theme, bio, created_at, last_seen, character_match_id, character_name, character_ability, character_type, character_description, exam_completed').eq('id', user.id).maybeSingle()
  return (data as Profile | null) ?? null
}

export default async function RegistrySubmitPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  if (!['member', 'mod', 'owner'].includes(viewer.role) || viewer.rank < 2) {
    redirect('/registry')
  }

  return (
    <>
      <Nav />
      <main style={{ paddingTop: '96px', minHeight: '100vh' }}>
        <RegistrySubmitForm />
      </main>
      <Footer />
    </>
  )
}
