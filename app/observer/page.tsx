'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/frontend/context/AuthContext'
import { navigateToResolvedPath } from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'

export default function ObserverPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (profile && profile.role !== 'observer') {
      navigateToResolvedPath(profile, { replace: true })
    }
  }, [loading, user, profile, router])

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '96px 24px 32px',
        }}
      >
        <section className="section-wrap" style={{ paddingBottom: '4rem' }}>
          <section
            style={{
              width: '100%',
              maxWidth: '720px',
              margin: '0 auto',
              padding: '3.5rem 3rem',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'Noto Serif JP, serif',
                fontSize: '8rem',
                color: 'var(--kanji)',
                lineHeight: 1,
              }}
            >
              観
            </div>
            <h1
              style={{
                marginTop: '1rem',
                fontFamily: 'Cinzel, serif',
                fontSize: '2.2rem',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              The city cannot determine your allegiance yet.
            </h1>
            <p
              style={{
                marginTop: '1rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.15rem',
                fontStyle: 'italic',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}
            >
              You remain under observation. Public records stay open to you, but the
              inner rooms do not.
            </p>
            <div
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <Link href="/archive" className="btn-secondary">
                Browse Characters
              </Link>
              <Link href="/lore" className="btn-secondary">
                Browse Lore
              </Link>
              <Link href="/" className="btn-primary">
                Return to Archive
              </Link>
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </>
  )
}
