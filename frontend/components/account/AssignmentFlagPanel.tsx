'use client'

import { useEffect, useState } from 'react'
import type { AssignmentFlag } from '@/backend/types'
import { useAuth } from '@/frontend/context/AuthContext'

function statusCopy(flag: AssignmentFlag['status']) {
  switch (flag) {
    case 'confirmed':
      return 'Review complete. The city confirmed your current assignment.'
    case 'reassigned':
      return 'Review complete. Your file was reassigned by the owner.'
    default:
      return 'You will be observed. Owner review is pending.'
  }
}

export function AssignmentFlagPanel() {
  const { user, profile } = useAuth()
  const [flag, setFlag] = useState<AssignmentFlag | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !profile?.assignment_flag_used) {
      return
    }

    let active = true

    const load = async () => {
      setLoadingExisting(true)
      const response = await fetch('/api/assignment-flag', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!active || !response.ok) {
        if (active) {
          setLoadingExisting(false)
        }
        return
      }

      setFlag((json.data as AssignmentFlag | null) ?? null)
      setLoadingExisting(false)
    }

    void load()

      return () => {
        active = false
      }
    }, [user, profile?.assignment_flag_used])

  if (
    !user ||
    !profile ||
    !profile.faction ||
    !profile.quiz_completed ||
    !profile.quiz_locked ||
    !['member', 'waitlist', 'mod'].includes(profile.role)
  ) {
    return null
  }

  const submit = async () => {
    setLoading(true)
    setError('')

    const response = await fetch('/api/assignment-flag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: notes.trim() || undefined,
      }),
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(json.error ?? 'Unable to file assignment review.')
      setLoading(false)
      return
    }

    setFlag((json.data as AssignmentFlag | null) ?? null)
    setNotes('')
    setLoading(false)
  }

  return (
    <section
      style={{
        marginTop: '1.5rem',
        padding: '1.2rem 1.25rem',
        border: '1px solid var(--border2)',
        background: 'var(--surface2)',
        textAlign: 'left',
      }}
    >
      <p
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.55rem',
          letterSpacing: '0.18em',
          color: 'var(--text3)',
          textTransform: 'uppercase',
          marginBottom: '0.7rem',
        }}
      >
        Assignment Review
      </p>
      {loadingExisting ? (
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1rem',
            fontStyle: 'italic',
            color: 'var(--text2)',
            lineHeight: 1.7,
          }}
        >
          Loading your filed review.
        </p>
      ) : flag ? (
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1rem',
            fontStyle: 'italic',
            color: 'var(--text2)',
            lineHeight: 1.7,
          }}
        >
          {statusCopy(flag.status)}
        </p>
      ) : (
        <>
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1rem',
              fontStyle: 'italic',
              color: 'var(--text2)',
              lineHeight: 1.7,
            }}
          >
            If the registry placed you wrongly, you may file one review request. The
            owner will observe your activity for thirty days.
          </p>
          <textarea
            value={notes}
            maxLength={500}
            placeholder="Optional note for the owner."
            onChange={(event) => setNotes(event.target.value)}
            style={{
              width: '100%',
              minHeight: '88px',
              marginTop: '0.9rem',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              padding: '0.8rem 0.9rem',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
          <div
            style={{
              marginTop: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <p
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.55rem',
                color: error ? 'var(--accent)' : 'var(--text4)',
              }}
            >
              {error || 'One request only. Final after owner review.'}
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void submit()}
              disabled={loading}
            >
              {loading ? 'Filing...' : 'Flag Assignment'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
