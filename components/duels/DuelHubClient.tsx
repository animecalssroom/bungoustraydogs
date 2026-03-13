'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Duel, OpenChallenge } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { DuelCard } from '@/components/duels/DuelCard'
import { OpenChallengeCard } from '@/components/duels/OpenChallengeCard'
import { DuelGuide } from '@/components/duels/DuelGuide'

type SearchResult = {
  id: string
  username: string
  faction: string | null
  character_name: string | null
  rank: number
  duel_wins?: number | null
  duel_losses?: number | null
}

export function DuelHubClient({
  userId,
  initialDuels,
  initialOpenChallenges,
}: {
  userId: string
  initialDuels: Duel[]
  initialOpenChallenges: OpenChallenge[]
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [duels, setDuels] = useState(initialDuels)
  const [openChallenges, setOpenChallenges] = useState(initialOpenChallenges)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [message, setMessage] = useState('')
  const [openMessage, setOpenMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(async () => {
      const normalizedQuery = query.trim().replace(/^@+/, '')

      if (!normalizedQuery) {
        setResults([])
        return
      }

      const response = await fetch(`/api/duels/search?q=${encodeURIComponent(normalizedQuery)}`)
      const json = await response.json()
      if (active) {
        setResults(json.data ?? [])
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    const channel = supabase
      .channel(`duel-hub:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duels' },
        (payload) => {
          const duel = payload.new as Duel
          if (!duel || (duel.challenger_id !== userId && duel.defender_id !== userId)) {
            return
          }

          setDuels((current) => {
            const next = current.filter((entry) => entry.id !== duel.id)
            return [duel, ...next].slice(0, 20)
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const refreshOpenChallenges = async () => {
    const response = await fetch('/api/duels/open')
    const json = await response.json()
    setOpenChallenges(json.data ?? [])
  }

  const sendChallenge = async () => {
    if (!selected) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/duels/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defender_id: selected.id, message }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error ?? 'Unable to send challenge.')
        return
      }

      setSelected(null)
      setMessage('')

      if (json.active && json.duel_id) {
        router.push(`/duels/${json.duel_id}`)
        return
      }

      setNotice('Challenge sent. They have 24 hours to accept.')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const postOpenChallenge = async () => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/duels/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: openMessage }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error ?? 'Unable to post open challenge.')
        return
      }
      setOpenMessage('')
      setNotice('Open challenge posted to the board.')
      await refreshOpenChallenges()
    } finally {
      setBusy(false)
    }
  }

  const acceptOpenChallenge = async (openChallengeId: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/duels/accept-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_challenge_id: openChallengeId }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error ?? 'Unable to accept open challenge.')
        return
      }
      router.push(`/duels/${json.duel_id}`)
    } finally {
      setBusy(false)
    }
  }

  const withdrawOwnOpenChallenge = async (openChallengeId: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/duels/open', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_challenge_id: openChallengeId }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error ?? 'Unable to withdraw open challenge.')
        return
      }
      setNotice('Open challenge withdrawn.')
      await refreshOpenChallenges()
    } finally {
      setBusy(false)
    }
  }

  const ownOpenChallenge = openChallenges.find((entry) => entry.challenger_id === userId)

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <DuelGuide variant="hub" />
      <section className="paper-surface" style={{ padding: '1.5rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Your Active Duels
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
          {duels.length ? duels.map((duel) => <DuelCard key={duel.id} duel={duel} userId={userId} />) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
              No pending or active duels on file.
            </p>
          )}
        </div>
      </section>

      <section className="paper-surface" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Challenge A Player
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search operatives"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.8rem 1rem', color: 'var(--text1)' }}
        />
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {results.map((result) => (
            <div key={result.id} className="paper-surface" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div>
                <div className="font-cinzel">{result.username}</div>
                <div className="font-space-mono" style={{ fontSize: '0.55rem', color: 'var(--text3)' }}>
                  {result.faction ?? 'Unknown'} · {result.character_name ?? '-'} · W/L {(result.duel_wins ?? 0)}/{(result.duel_losses ?? 0)}
                </div>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setSelected(result)}>
                Challenge
              </button>
            </div>
          ))}
          {query.trim() && results.length === 0 ? (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
              No matching operatives found. Try the username without the @ prefix or check that they are in another regular faction.
            </p>
          ) : null}
        </div>

        {selected ? (
          <div className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.8rem', borderColor: 'var(--accent)' }}>
            <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>Challenge {selected.username}?</div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 100))}
              placeholder="An optional message to your opponent"
              rows={3}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.8rem 1rem', color: 'var(--text1)', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void sendChallenge()}>
                Confirm Challenge
              </button>
              <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="paper-surface" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
            Open Challenges Board
          </div>
          {ownOpenChallenge ? (
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void withdrawOwnOpenChallenge(ownOpenChallenge.id)}>
              Withdraw Own Open Challenge
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <input
                value={openMessage}
                onChange={(event) => setOpenMessage(event.target.value.slice(0, 80))}
                placeholder="Optional open challenge message"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.8rem 1rem', color: 'var(--text1)', minWidth: '260px' }}
              />
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void postOpenChallenge()}>
                Post Open Challenge
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {openChallenges.length ? openChallenges.map((challenge) => (
            <OpenChallengeCard
              key={challenge.id}
              challenge={challenge}
              disabled={busy || challenge.challenger_id === userId}
              onAccept={acceptOpenChallenge}
            />
          )) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
              The open board is quiet right now.
            </p>
          )}
        </div>
      </section>

      {error ? (
        <p className="font-cormorant" style={{ margin: 0, color: '#8B0000', fontStyle: 'italic' }}>
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
          {notice}
        </p>
      ) : null}
    </div>
  )
}
