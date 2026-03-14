import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import type { Profile } from '@/backend/types'
import { RegistrySubmitForm } from '@/frontend/components/registry/RegistrySubmitForm'
import Link from 'next/link'

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

  if (!(viewer.role === 'mod' || viewer.role === 'owner')) {
    redirect('/lore/submit')
  }

  return (
    <div style={{ paddingTop: '36px' }}>
      <div className="section-wrap" style={{ paddingBottom: '1.5rem' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            background: 'var(--card)',
            padding: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
            Registry Filing Desk
          </p>
          <p className="section-sub" style={{ padding: 0 }}>
            Registry submissions are a staff-authored filing lane. Use this desk for in-world
            field notes, incident reports, classified dossiers, and Chronicle-bound records.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <Link href="/guide" className="btn-secondary">
              Read Contribution Guide
            </Link>
          </div>
        </div>
      </div>
      <RegistrySubmitForm viewerRank={viewer.rank} />
    </div>
  )
}
