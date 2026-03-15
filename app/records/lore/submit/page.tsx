import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Profile } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/server'
import { LoreSubmitForm } from '@/frontend/components/lore/LoreSubmitForm'

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

export default async function LoreSubmitPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  // Rank 1+ can write
  if (!['member', 'mod', 'owner'].includes(viewer.role)) {
    redirect('/records?tab=lore')
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
            Records Hall &gt; Lore Hall
          </p>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
            The Literary Desk
          </p>
          <p className="section-sub" style={{ padding: 0 }}>
            Write essays, theory, symbolism, author context, and character studies here.
            Field Notes is the moderated in-world filing desk.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/records?tab=lore" className="btn-secondary">
              Back to Records
            </Link>
            <Link href="/guide" className="btn-secondary">
              Read City Guide
            </Link>
            {viewer.role === 'mod' || viewer.role === 'owner' ? (
              <Link href="/records/field-notes/submit" className="btn-secondary">
                File Field Note
              </Link>
            ) : (
              <Link href="/records?tab=field-notes" className="btn-secondary">
                Read Field Notes
              </Link>
            )}
          </div>
        </div>
      </div>
      <LoreSubmitForm viewerRank={viewer.rank} />
    </div>
  )
}
