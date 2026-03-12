'use client'

import { useState, useTransition } from 'react'
import type { ContentFlagEntityType } from '@/backend/types'
import { useAuth } from '@/frontend/context/AuthContext'

export function FlagFileButton({
  entityType,
  entityId,
  targetPath,
  targetLabel,
  compact = false,
  hidden = false,
}: {
  entityType: ContentFlagEntityType
  entityId: string
  targetPath: string
  targetLabel?: string | null
  compact?: boolean
  hidden?: boolean
}) {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (
    hidden ||
    !user ||
    !profile ||
    !['observer', 'waitlist', 'member', 'mod', 'owner'].includes(profile.role)
  ) {
    return null
  }

  return (
    <div style={{ display: 'grid', gap: '0.55rem', justifyItems: compact ? 'start' : 'stretch' }}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen((current) => !current)}
        style={compact ? { padding: '0.45rem 0.65rem', fontSize: '0.55rem' } : undefined}
      >
        {open ? 'Close Flag Form' : compact ? 'Flag' : 'Flag File'}
      </button>

      {open ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            startTransition(async () => {
              setMessage(null)
              const response = await fetch('/api/flags', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  entityType,
                  entityId,
                  targetPath,
                  targetLabel,
                  reason,
                  details,
                }),
              })
              const json = await response.json().catch(() => ({}))

              if (!response.ok) {
                setMessage(json.error ?? 'Unable to flag this file.')
                return
              }

              setMessage('Flagged file transmitted to review.')
              setReason('')
              setDetails('')
              setOpen(false)
            })
          }}
          style={{
            minWidth: compact ? '240px' : '100%',
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            padding: '0.9rem',
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason for flagging"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              padding: '0.75rem 0.9rem',
            }}
          />
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Optional context for the file review."
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              padding: '0.75rem 0.9rem',
              minHeight: '88px',
              resize: 'vertical',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={pending || reason.trim().length < 4}
          >
            {pending ? 'Filing...' : 'Submit Flag'}
          </button>
        </form>
      ) : null}

      {message ? (
        <span
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.52rem',
            color: message.includes('Unable') ? 'var(--accent)' : 'var(--text4)',
            letterSpacing: '0.08em',
          }}
        >
          {message}
        </span>
      ) : null}
    </div>
  )
}
