'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { SpecialDivisionCandidate } from '@/backend/models/special-division.model'
import { FACTION_META } from '@/frontend/lib/launch'

interface SpecialDivisionConsoleProps {
  unplaceable: SpecialDivisionCandidate[]
  longTermWaitlist: SpecialDivisionCandidate[]
}

function formatRelativeDays(value: string) {
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)),
  )

  if (elapsed === 0) return 'today'
  if (elapsed === 1) return '1 day ago'
  return `${elapsed} days ago`
}

function renderScores(scores: Record<string, number>) {
  const ordered = ['agency', 'mafia', 'guild', 'dogs'] as const

  return ordered
    .map((key) => `${key} ${scores[key] ?? 0}`)
    .join(' · ')
}

export function SpecialDivisionConsole({
  unplaceable,
  longTermWaitlist,
}: SpecialDivisionConsoleProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const refresh = () => startTransition(() => router.refresh())

  const recommend = async (userId: string) => {
    setError('')

    const response = await fetch('/api/admin/special-division/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to recommend this file.')
      return
    }

    refresh()
  }

  const renderRow = (candidate: SpecialDivisionCandidate) => (
    <article
      key={`${candidate.source}:${candidate.user_id}`}
      style={{
        border: '1px solid var(--border2)',
        background: 'var(--surface2)',
        padding: '1.2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.1rem',
              color: 'var(--text)',
            }}
          >
            @{candidate.username}
          </h3>
          <p
            style={{
              marginTop: '0.45rem',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.55rem',
              color: 'var(--text3)',
            }}
          >
            Joined {formatRelativeDays(candidate.joined_at)}
            {candidate.faction ? ` · ${FACTION_META[candidate.faction].name}` : ''}
          </p>
          <p
            style={{
              marginTop: '0.45rem',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.55rem',
              color: 'var(--text4)',
            }}
          >
            Scores: {renderScores(candidate.scores)}
          </p>
          <p
            style={{
              marginTop: '0.45rem',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.55rem',
              color: 'var(--accent)',
            }}
          >
            Actions since joining: {candidate.action_count}
          </p>
          {!candidate.can_recommend && candidate.can_recommend_again_at && (
            <p
              style={{
                marginTop: '0.45rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                color: 'var(--text2)',
              }}
            >
              Recommendation locked until{' '}
              {new Date(candidate.can_recommend_again_at).toLocaleDateString()}.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href={`/profile/${candidate.username}`} className="btn-secondary">
            View Activity
          </Link>
          <button
            type="button"
            className="btn-primary"
            disabled={pending || !candidate.can_recommend}
            onClick={() => void recommend(candidate.user_id)}
          >
            Recommend
          </button>
        </div>
      </div>
    </article>
  )

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Special Division
        </p>
        <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
          Observation Review
        </h1>
        <p className="section-sub" style={{ margin: 0, maxWidth: '760px' }}>
          There is no algorithm here. Read the file, weigh the behavior, and decide
          whether the city failed to place them for a reason.
        </p>
        <p
          style={{
            marginTop: '1rem',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            color: error ? 'var(--accent)' : 'var(--text4)',
          }}
        >
          {error || 'Recommendations go directly to the owner for final approval.'}
        </p>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Unplaceable Users
        </p>
        {unplaceable.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No unplaceable files are waiting for review right now.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>{unplaceable.map(renderRow)}</div>
        )}
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          background: 'var(--card)',
          padding: '2rem',
        }}
      >
        <p className="section-eyebrow" style={{ marginBottom: '0.9rem' }}>
          Long-Term Observers
        </p>
        {longTermWaitlist.length === 0 ? (
          <p className="section-sub" style={{ margin: 0 }}>
            No long-term waitlist files have crossed the 21-day threshold.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {longTermWaitlist.map(renderRow)}
          </div>
        )}
      </section>
    </div>
  )
}
