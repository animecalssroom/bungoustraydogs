'use client'

import { useEffect, useRef, useState } from 'react'
import { useAngo } from '@/frontend/context/AngoContext'
import type { FactionId } from '@/backend/types'
import { FACTION_META } from '@/frontend/lib/launch'

type HoverProfile = {
  id: string
  username: string
  faction: string | null
  role: string
  rank: number
  ap_total: number
  character_name: string | null
  character_match_id: string | null
  behavior_scores?: Record<string, number> | null
}

export function AngoUsername({
  userId,
  username,
}: {
  userId: string
  username: string
}) {
  const { isAngo, invite, recentlyInvited } = useAngo()
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<HoverProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [transmitted, setTransmitted] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  if (!isAngo) {
    return <span>@{username}</span>
  }

  const load = async () => {
    if (summary || loading) {
      return
    }

    setLoading(true)
    setStatus(null)
    const response = await fetch(`/api/special/profile/${userId}`, { cache: 'no-store' })
    const json = (await response.json().catch(() => ({}))) as {
      data?: HoverProfile
      error?: string
    }

    if (!response.ok || json.error) {
      setStatus(json.error ?? 'Unable to load file.')
      setLoading(false)
      return
    }

    setSummary(json.data ?? null)
    setLoading(false)
  }

  const keepOpen = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
    void load()
  }

  const queueClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = setTimeout(() => setOpen(false), 180)
  }

  const alreadySpecial = summary?.faction === 'special_div'
  const alreadySent = transmitted || recentlyInvited.has(userId)
  const factionLabel = summary?.faction
    ? FACTION_META[summary.faction as FactionId]?.name ?? summary.faction
    : 'Unfiled'

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={keepOpen}
      onMouseLeave={queueClose}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (open) {
            setOpen(false)
          } else {
            keepOpen()
          }
        }}
        style={{
          cursor: 'pointer',
          border: 0,
          background: 'transparent',
          color: 'inherit',
          padding: 0,
          font: 'inherit',
        }}
      >
        @{username}
      </button>

      {open ? (
        <div
          onMouseEnter={keepOpen}
          onMouseLeave={queueClose}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            minWidth: '240px',
            maxWidth: '320px',
            zIndex: 900,
            border: '1px solid #8B0000',
            background: 'rgba(12, 8, 10, 0.98)',
            color: '#f1e7da',
            padding: '0.9rem',
            boxShadow: '0 16px 30px rgba(0,0,0,0.32)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-space-mono)',
              fontSize: '0.58rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#b43c3c',
            }}
          >
            Special Division Registry
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.98rem' }}>@{username}</div>
          <div
            style={{
              marginTop: '0.5rem',
              fontFamily: 'var(--font-space-mono)',
              fontSize: '0.58rem',
              letterSpacing: '0.08em',
              color: '#d7c7b8',
              lineHeight: 1.7,
            }}
          >
            {loading
              ? 'Loading file...'
              : `${factionLabel} · Rank ${summary?.rank ?? '?'} · ${summary?.ap_total ?? 0} AP`}
          </div>

          {status ? (
            <div
              style={{
                marginTop: '0.65rem',
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1rem',
                fontStyle: 'italic',
                color: '#d5a5a5',
              }}
            >
              {status}
            </div>
          ) : null}

          <button
            type="button"
            disabled={loading || alreadySpecial || alreadySent}
            onClick={async (event) => {
              event.preventDefault()
              event.stopPropagation()
              setStatus(null)
              const ok = await invite(userId, username)
              if (ok) {
                setTransmitted(true)
                setSummary((current) =>
                  current ? { ...current, faction: 'special_div' } : current,
                )
                setStatus('Transmission acknowledged.')
              } else {
                setStatus('Designation failed. Check account authority or route response.')
              }
            }}
            style={{
              marginTop: '0.8rem',
              width: '100%',
              border: '1px solid #8B0000',
              background: loading || alreadySpecial || alreadySent ? 'transparent' : '#8B0000',
              color: '#f7efe6',
              padding: '0.7rem 0.8rem',
              fontFamily: 'var(--font-space-mono)',
              fontSize: '0.56rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: loading || alreadySpecial || alreadySent ? 'default' : 'pointer',
              opacity: loading || alreadySpecial || alreadySent ? 0.7 : 1,
            }}
          >
            {alreadySpecial
              ? 'Already Designated'
              : alreadySent
                ? 'Transmitted'
                : 'Extend Designation'}
          </button>
        </div>
      ) : null}
    </span>
  )
}
