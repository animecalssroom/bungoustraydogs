'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WaitlistEntry } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { useAuth } from '@/frontend/context/AuthContext'
import { useRealtimeProfile } from '@/frontend/lib/hooks/useRealtimeProfile'
import {
  FACTION_META,
  getCharacterReveal,
  resolvePostAuthPath,
} from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import { AssignmentFlagPanel } from '@/frontend/components/account/AssignmentFlagPanel'

export default function WaitlistPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user, profile, loading } = useAuth()
  const liveProfile = useRealtimeProfile(user?.id, profile)
  const [entry, setEntry] = useState<WaitlistEntry | null>(null)
  const [activationBanner, setActivationBanner] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!profile) return
    if (profile.role !== 'waitlist' || !profile.quiz_locked) {
      router.replace(resolvePostAuthPath(profile))
      return
    }

    let active = true

    const load = async () => {
      const { data } = await supabase
        .from('waitlist')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!active) return
      setEntry((data as WaitlistEntry | null) ?? null)
    }

    void load()

    const channel = supabase
      .channel(`waitlist:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!payload.new || Object.keys(payload.new).length === 0) {
            setEntry(null)
            return
          }

          setEntry((payload.new as WaitlistEntry) ?? null)
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [loading, user, profile, router, supabase])

  useEffect(() => {
    if (!liveProfile || liveProfile.role === 'waitlist') {
      return
    }

    setActivationBanner(true)

    const timeout = window.setTimeout(() => {
      router.replace(resolvePostAuthPath(liveProfile))
    }, 3000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [liveProfile, router])

  const activeProfile = liveProfile ?? profile
  const factionMeta = activeProfile?.faction ? FACTION_META[activeProfile.faction] : null
  const character = getCharacterReveal(activeProfile?.character_match_id)

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
              maxWidth: '760px',
              margin: '0 auto',
              padding: '3.5rem 3rem',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              textAlign: 'center',
            }}
          >
            {activationBanner && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.9rem 1rem',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.58rem',
                  letterSpacing: '0.12em',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}
              >
                A vacancy has opened. You are being activated.
              </div>
            )}

            <div
              style={{
                fontFamily: 'Noto Serif JP, serif',
                fontSize: '8rem',
                color: factionMeta?.color ?? 'var(--kanji)',
                lineHeight: 1,
              }}
            >
              {factionMeta?.kanji ?? '待'}
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
              {factionMeta?.name ?? 'Faction'} recognises you.
            </h1>
            <p
              style={{
                marginTop: '1rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.15rem',
                fontStyle: 'italic',
                color: 'var(--text2)',
              }}
            >
              A vacancy has not yet opened. The city is watching.
            </p>
            {character && (
              <p
                style={{
                  marginTop: '1rem',
                  fontFamily: 'IM Fell English, serif',
                  fontSize: '1.1rem',
                  color: factionMeta?.color ?? 'var(--accent)',
                }}
              >
                Assigned signature: {character.name} · {character.ability}
              </p>
            )}
            <p
              style={{
                marginTop: '1.4rem',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                color: 'var(--text3)',
                textTransform: 'uppercase',
              }}
            >
              Position {entry?.position ?? '—'} in queue
            </p>

            <div
              style={{
                marginTop: '1.75rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {['Assigned', 'Queued', 'Activated'].map((label, index) => {
                const activeIndex = activationBanner ? 2 : 1

                return (
                  <div
                    key={label}
                    style={{
                      padding: '0.6rem 0.9rem',
                      border: '1px solid var(--border2)',
                      background: index <= activeIndex ? 'var(--surface2)' : 'transparent',
                      color: index <= activeIndex ? 'var(--accent)' : 'var(--text4)',
                      fontFamily: 'Space Mono, monospace',
                      fontSize: '0.55rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                )
              })}
            </div>

            <p
              style={{
                marginTop: '2rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.05rem',
                fontStyle: 'italic',
                color: 'var(--text2)',
              }}
            >
              While you wait, the archive is open.
            </p>

            <div
              style={{
                marginTop: '1.25rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <Link href="/archive" className="btn-secondary">
                Read the Archive
              </Link>
              <Link href="/lore" className="btn-secondary">
                Read Lore
              </Link>
              <Link href="/arena" className="btn-secondary">
                View Arena
              </Link>
              {activeProfile?.faction && (
                <Link href={`/factions/${activeProfile.faction}`} className="btn-secondary">
                  View Faction Dossier
                </Link>
              )}
            </div>

            <AssignmentFlagPanel />
          </section>
        </section>
      </main>
      <Footer />
    </>
  )
}
