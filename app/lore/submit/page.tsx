import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoreSubmitForm } from '@/frontend/components/lore/LoreSubmitForm'
import { getViewerProfile } from '@/frontend/lib/auth-server'


export default async function LoreSubmitPage() {
  const viewer = await getViewerProfile()

  if (!viewer) {
    redirect('/login')
  }

  if (!['member', 'mod', 'owner'].includes(viewer.role)) {
    redirect('/lore')
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
            Literary Desk
          </p>
          <p className="section-sub" style={{ padding: 0 }}>
            Write essays, theory, symbolism, author context, and character studies here.
            Registry is the moderated in-world filing desk and is reserved for staff-authored case reports.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/guide" className="btn-secondary">
              Read City Guide
            </Link>
            {viewer.role === 'mod' || viewer.role === 'owner' ? (
              <Link href="/registry/submit" className="btn-secondary">
                Open Registry Desk
              </Link>
            ) : (
              <Link href="/registry" className="btn-secondary">
                Read Registry
              </Link>
            )}
          </div>
        </div>
      </div>
      <LoreSubmitForm viewerRank={viewer.rank} />
    </div>
  )
}
