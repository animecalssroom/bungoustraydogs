'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { useAuth } from '@/frontend/context/AuthContext'
import {
  privateFactionPath,
  resolvePostAuthPath,
} from '@/frontend/lib/launch'
import { Nav } from '@/frontend/components/ui/Nav'

interface ResultPayload {
  caseNumber: string
  factionId?: 'agency' | 'mafia' | 'guild' | 'hunting_dogs' | null
  resolution: {
    faction: 'agency' | 'mafia' | 'guild' | 'hunting_dogs' | null
    reason: 'assigned' | 'observer'
    scores: {
      agency: number
      mafia: number
      guild: number
      hunting_dogs: number
    }
  }
  faction: {
    name: string
    nameJp: string
    kanji: string
    color: string
    philosophy: string
  } | null
}

const FACTION_PHILOSOPHIES: Record<'agency' | 'mafia' | 'guild' | 'hunting_dogs', string> = {
  agency:
    "The city does not distinguish between the guilty and the desperate. We do. The Armed Detective Agency exists in the space between law and mercy - cases too dangerous for the police, too human for the military. We carry the weight of Yokohama's twilight. Some call it heroism. We call it Tuesday.",
  mafia:
    'Order is maintained by those willing to be its shadow. The Port Mafia does not pretend to be righteous. We are the reason Yokohama sleeps at night - not because the darkness is gone, but because we control it. You serve the city by serving us. This is not a choice. It is an assessment.',
  guild:
    'Power without resources is theater. The Guild understands what others refuse to admit - that ability without capital is merely talent, and talent is abundant. We do not fight for Yokohama. We invest in it. Your presence here is either an asset or a liability. Demonstrate which.',
  hunting_dogs:
    "The law is not a suggestion. The Hunting Dogs are the government's answer to those who believe otherwise. We are not merciful. We are not cruel. We are precise. Yokohama's ability users exist within a framework they did not create and cannot escape. Neither can you. Neither can we.",
}

const FACTION_SEALS: Record<'agency' | 'mafia' | 'guild' | 'hunting_dogs', string> = {
  agency: 'AGENCY',
  mafia: 'MAFIA',
  guild: 'GUILD',
  hunting_dogs: 'DOGS',
}

export default function QuizResultPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [state, setState] = useState<{
    loading: boolean
    error: string
    payload: ResultPayload | null
  }>({
    loading: true,
    error: '',
    payload: null,
  })
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (profile && !profile.username_confirmed) {
      router.replace('/onboarding/username')
      return
    }
    if (profile && !profile.quiz_completed) {
      router.replace('/onboarding/quiz')
      return
    }
    if (profile?.quiz_locked && profile.quiz_completed) {
      router.replace(resolvePostAuthPath(profile))
      return
    }

    let active = true

    const load = async () => {
      const response = await fetch('/api/onboarding/quiz/result', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!active) return

      if (!response.ok) {
        setState({
          loading: false,
          error: json.error ?? 'Failed to resolve assignment.',
          payload: null,
        })
        return
      }

      window.setTimeout(() => {
        if (!active) return

        setState({
          loading: false,
          error: '',
          payload: json.data ?? null,
        })
      }, 180)
    }

    void load()
    return () => {
      active = false
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (state.loading || !state.payload?.faction) {
      return
    }

    gsap.set('.result-accept-btn', { scale: 0.92 })

    const timeline = gsap.timeline()
    timeline.to('.result-faction-name', { opacity: 1, y: 0, duration: 0.5 }, 1.5)
    timeline.to('.result-philosophy', { opacity: 1, y: 0, duration: 0.5 }, 2.5)
    timeline.to(
      '.result-accept-btn',
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.6)' },
      3.0,
    )

    return () => {
      timeline.kill()
    }
  }, [state.loading, state.payload])

  const accept = async () => {
    setAccepting(true)
    const response = await fetch('/api/onboarding/assignment/accept', {
      method: 'POST',
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setState((current) => ({
        ...current,
        error: json.error ?? 'Failed to accept assignment.',
      }))
      setAccepting(false)
      return
    }

    if (json.data?.outcome === 'waitlist') {
      router.push('/waitlist')
      return
    }

    if (json.data?.outcome === 'observer') {
      router.push('/observer')
      return
    }

    // Poll for updated profile before redirecting to faction/private area
    let pollCount = 0
    const maxPolls = 18 // ~5 seconds
    let profileReady = false
    let lastProfile = null
    while (pollCount < maxPolls && !profileReady) {
      try {
        const resp = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await resp.json()
        lastProfile = data?.data
        if (lastProfile?.quiz_completed && lastProfile?.quiz_locked && lastProfile?.faction) {
          profileReady = true
          break
        }
      } catch (err) {
        console.error('Polling error in result page', err)
        // Optionally, you could set an error state here:
        // setState((current) => ({ ...current, error: 'Polling error: ' + (err?.message || err) }))
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
      pollCount++
    }
    if (lastProfile?.faction) {
      router.push(privateFactionPath(lastProfile.faction))
      return
    }
    router.push('/')
  }

  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg)',
          padding: '96px 24px 32px',
        }}
      >
        <section
          style={{
            width: '100%',
            maxWidth: '700px',
            padding: '3.5rem 3rem',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            textAlign: 'center',
          }}
        >
        {state.loading ? (
          <>
            <p
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.22em',
                color: 'var(--text3)',
                textTransform: 'uppercase',
              }}
            >
              Calculating registry placement...
            </p>
            <div
              style={{
                marginTop: '2rem',
                fontFamily: 'Noto Serif JP, serif',
                fontSize: '8rem',
                color: 'var(--kanji)',
              }}
            >
              判定
            </div>
          </>
        ) : state.payload?.faction ? (
          <>
            <p
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.22em',
                color: 'var(--text3)',
                textTransform: 'uppercase',
              }}
            >
              能力者判定 · Case #{state.payload.caseNumber}
            </p>
            <div
              style={{
                marginTop: '1.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '180px',
                minHeight: '180px',
                padding: '1.25rem',
                border: `1px solid ${state.payload.faction.color}`,
                color: state.payload.faction.color,
                background: 'color-mix(in srgb, var(--surface2) 78%, transparent)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '1.2rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              {state.payload.factionId
                ? FACTION_SEALS[state.payload.factionId]
                : 'Filed'}
            </div>
            <p
              style={{
                fontFamily: 'Noto Serif JP, serif',
                fontSize: '0.75rem',
                letterSpacing: '0.28em',
                color: 'var(--text3)',
                marginTop: '0.6rem',
              }}
            >
              {state.payload.faction.nameJp}
            </p>
            <h1
              className="result-faction-name"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.2rem',
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: '0.8rem',
              }}
            >
              {state.payload.faction.name}
            </h1>
            <p
              className="result-philosophy"
              style={{
                maxWidth: '520px',
                margin: '0.9rem auto 0',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                lineHeight: 1.8,
                color: 'var(--text2)',
              }}
            >
              {state.payload.factionId
                ? FACTION_PHILOSOPHIES[state.payload.factionId]
                : state.payload.faction.philosophy}
            </p>
            <p
              style={{
                marginTop: '1.5rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.2rem',
                fontStyle: 'italic',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}
            >
              The city has determined your allegiance. Your character file will be
              assigned after more of your activity has been recorded.
            </p>
            {state.error && (
              <p
                style={{
                  marginTop: '1rem',
                  color: 'var(--accent)',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.6rem',
                }}
              >
                {state.error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void accept()}
              disabled={accepting}
              className="btn-primary result-accept-btn"
              style={{ marginTop: '2rem' }}
            >
              {accepting ? 'Recording...' : 'Accept your assignment'}
            </button>
          </>
        ) : state.payload ? (
          <>
            <p
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.62rem',
                letterSpacing: '0.22em',
                color: 'var(--text3)',
                textTransform: 'uppercase',
              }}
            >
              Registry Case #{state.payload.caseNumber}
            </p>
            <div
              style={{
                marginTop: '1.4rem',
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
                fontFamily: 'Cinzel, serif',
                fontSize: '2rem',
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: '1rem',
              }}
            >
              The city cannot determine your allegiance yet.
            </h1>
            <p
              style={{
                marginTop: '1.2rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.15rem',
                fontStyle: 'italic',
                color: 'var(--text2)',
                lineHeight: 1.7,
              }}
            >
              Your file remains under observation. Public records stay open while
              the city watches.
            </p>
            <p
              style={{
                marginTop: '1rem',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.58rem',
                letterSpacing: '0.08em',
                color: 'var(--text4)',
                textTransform: 'uppercase',
              }}
            >
              Your answers split too evenly across the city&apos;s factions for a stable assignment.
            </p>
            {state.error && (
              <p
                style={{
                  marginTop: '1rem',
                  color: 'var(--accent)',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.6rem',
                }}
              >
                {state.error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void accept()}
              disabled={accepting}
              className="btn-primary"
              style={{ marginTop: '2rem' }}
            >
              {accepting ? 'Recording...' : 'Accept your assignment'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
              {state.error || 'Unable to load the registry result.'}
            </p>
          </>
        )}
        </section>
      </main>
    </>
  )
}
