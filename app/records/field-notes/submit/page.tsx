import { redirect } from 'next/navigation'
import { createClient } from '@/frontend/lib/supabase/server'
import type { Profile } from '@/backend/types'
import { RegistrySubmitForm } from '@/frontend/components/registry/RegistrySubmitForm'
import Link from 'next/link'

async function getViewerProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return (data as Profile | null) ?? null
}

export default async function FieldNotesSubmitPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  // Rank 2+ for field notes
  if (!(viewer.role === 'mod' || viewer.role === 'owner' || viewer.rank >= 2)) {
    redirect('/records/lore/submit')
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
          <p className="section-eyebrow" style={{ marginBottom: '0.4rem', opacity: 0.6 }}>
            Records Hall &gt; Field Notes
          </p>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
            Field Notes Filing Desk
          </p>
          <p className="section-sub" style={{ padding: 0 }}>
            Field Notes are a staff-authored filing lane. Use this desk for in-world
            reports, incident filings, classified dossiers, and Chronicle-bound records.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <Link href="/records?tab=field-notes" className="btn-secondary">
              Back to Records
            </Link>
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
