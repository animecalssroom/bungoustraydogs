'use client'

import Link from 'next/link'
import type { RegistryPost } from '@/backend/types'
import { ErrorBoundary } from '@/frontend/components/ui/ErrorBoundary'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { RegistryFeed } from '@/frontend/components/registry/RegistryFeed'

export default function RegistryPageClient({ posts }: { posts: RegistryPost[] }) {
  return (
    <ErrorBoundary>
      <Nav />
      <main style={{ paddingTop: '60px' }}>
        <div className="section-head">
          <p className="section-eyebrow">City Registry · Yokohama Filed Reports</p>
          <h1 className="section-title">
            Filed Reports. <em>Remembered Disturbances.</em>
          </h1>
          <div className="ink-divider" />
          <p className="section-sub">
            Registry is the in-world records desk: incident filings, field notes,
            classified reports, and Chronicle submissions reviewed into the city file.
          </p>
        </div>
        <div className="section-wrap" style={{ paddingBottom: '2.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <section
              style={{
                border: '1px solid var(--border)',
                background: 'var(--card)',
                padding: '1.5rem',
              }}
            >
              <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
                Use Registry For
              </p>
              <p className="section-sub" style={{ padding: 0 }}>
                In-world filings: case numbers, factions, districts, sightings,
                incident accounts, and operational records reviewed by mods.
              </p>
            </section>
            <section
              style={{
                border: '1px solid var(--border)',
                background: 'var(--card)',
                padding: '1.5rem',
              }}
            >
              <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
                Not Lore Essays
              </p>
              <p className="section-sub" style={{ padding: 0 }}>
                If the piece is interpretation, theory, symbolism, or literary analysis,
                it belongs in Lore rather than the Registry.
              </p>
            </section>
            <section
              style={{
                border: '1px solid var(--border)',
                background: 'var(--card)',
                padding: '1.5rem',
              }}
            >
              <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
                Filing Ladder
              </p>
              <p className="section-sub" style={{ padding: 0 }}>
                Registry filing is currently restricted to moderators and the owner.
                Public users should write in Lore, then use Registry as a read-and-save record surface.
              </p>
              <div style={{ marginTop: '1rem' }}>
                <Link href="/guide" className="btn-secondary">
                  Learn How The City Works
                </Link>
              </div>
            </section>
          </div>
        </div>
        <RegistryFeed initialPosts={posts} />
      </main>
      <Footer />
    </ErrorBoundary>
  )
}
