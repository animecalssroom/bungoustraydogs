'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Duel, OpenChallenge } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import { OpenChallengeCard } from '@/components/duels/OpenChallengeCard'
import { DuelGuide } from '@/components/duels/DuelGuide'
import { DUEL_MAX_ROUNDS, formatRemainingTime } from '@/lib/duels/shared'

type SearchResult = {
  id: string
  username: string
  faction: string | null
  character_name: string | null
  rank: number
  duel_wins?: number | null
  duel_losses?: number | null
}

function duelLabel(duel: Duel, userId: string) {
  const isChallenger = duel.challenger_id === userId
  const me = isChallenger ? (duel.challenger_character ?? duel.challenger_faction ?? 'You') : (duel.defender_character ?? duel.defender_faction ?? 'You')
  const opp = isChallenger ? (duel.defender_character ?? duel.defender_faction ?? 'Opponent') : (duel.challenger_character ?? duel.challenger_faction ?? 'Opponent')
  return { me, opp, isChallenger }
}

function statusLabel(duel: Duel, userId: string) {
  if (duel.status === 'pending') {
    const isChallenger = duel.challenger_id === userId
    return isChallenger ? `Waiting for response · ${formatRemainingTime(duel.challenge_expires_at)}` : `Incoming Challenge · ${formatRemainingTime(duel.challenge_expires_at)}`
  }
  if (duel.status === 'active') return `Active · Round ${Math.max(duel.current_round, 1)} / ${DUEL_MAX_ROUNDS}`
  if (duel.status === 'complete' || duel.status === 'forfeit') {
    if (!duel.winner_id) return 'Draw'
    return duel.winner_id === userId ? '✓ Victory' : '✗ Defeat'
  }
  if (duel.status === 'declined') return 'Declined'
  if (duel.status === 'cancelled') return 'Withdrawn'
  return duel.status
}

function statusColor(duel: Duel, userId: string) {
  if (duel.status === 'pending') return 'var(--text3)'
  if (duel.status === 'active') return '#4a8a4a'
  if (duel.status === 'complete' || duel.status === 'forfeit') {
    if (!duel.winner_id) return 'var(--text3)'
    return duel.winner_id === userId ? '#4a8a4a' : '#8B0000'
  }
  return 'var(--text3)'
}

export function DuelHubClient({
  userId,
  initialDuels,
  initialHistory,
  initialOpenChallenges,
}: {
  userId: string
  initialDuels: Duel[]
  initialHistory: Duel[]
  initialOpenChallenges: OpenChallenge[]
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [duels, setDuels] = useState(initialDuels)
  const [history] = useState(initialHistory)
  const [openChallenges, setOpenChallenges] = useState(initialOpenChallenges)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [message, setMessage] = useState('')
  const [openMessage, setOpenMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmForfeit, setConfirmForfeit] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(async () => {
      const normalizedQuery = query.trim().replace(/^@+/, '')
      if (normalizedQuery.length < 2) { setResults([]); return }
      const response = await fetch(`/api/duels/search?q=${encodeURIComponent(normalizedQuery)}`)
      const json = await response.json()
      if (active) setResults(json.data ?? [])
    }, 300)
    return () => { active = false; window.clearTimeout(timeout) }
  }, [query])

  useEffect(() => {
    const syncDuel = (duel: Duel | undefined) => {
      if (!duel) return
      setDuels((current) => {
        const next = current.filter((entry) => entry.id !== duel.id)
        if (duel.status === 'pending' || duel.status === 'active') return [duel, ...next].slice(0, 20)
        return next
      })
    }

    const channel = supabase
      .channel(`duel-hub:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels', filter: `challenger_id=eq.${userId}` }, (payload) => {
        syncDuel((payload.new ?? payload.old) as Duel | undefined)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels', filter: `defender_id=eq.${userId}` }, (payload) => {
        syncDuel((payload.new ?? payload.old) as Duel | undefined)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [supabase, userId])

  const refreshOpenChallenges = useCallback(async () => {
    const response = await fetch('/api/duels/open')
    const json = await response.json()
    setOpenChallenges(json.data ?? [])
  }, [])

  const sendChallenge = async () => {
    if (!selected) return
    setBusy(true); setError(null); setNotice(null)
    try {
      const response = await fetch('/api/duels/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defender_id: selected.id, message }),
      })
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? 'Unable to send challenge.'); return }

      setSelected(null); setMessage('')

      if (json.active && json.duel_id) {
        router.push(`/duels/${json.duel_id}`)
        return
      }
      setNotice('Challenge sent. Awaiting their response.')
      setQuery('')
      setResults([])
    } finally {
      setBusy(false)
    }
  }

  const postOpenChallenge = async () => {
    setBusy(true); setError(null); setNotice(null)
    try {
      const response = await fetch('/api/duels/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: openMessage }),
      })
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? 'Unable to post open challenge.'); return }
      setOpenMessage(''); setNotice('Open challenge posted.')
      await refreshOpenChallenges()
    } finally { setBusy(false) }
  }

  const acceptOpenChallenge = useCallback(async (openChallengeId: string) => {
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/duels/accept-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_challenge_id: openChallengeId }),
      })
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? 'Unable to accept.'); return }
      router.push(`/duels/${json.duel_id}`)
    } finally { setBusy(false) }
  }, [router])

  const withdrawOwnOpenChallenge = useCallback(async (openChallengeId: string) => {
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/duels/open', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_challenge_id: openChallengeId }),
      })
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? 'Unable to withdraw.'); return }
      setNotice('Open challenge withdrawn.')
      await refreshOpenChallenges()
    } finally { setBusy(false) }
  }, [refreshOpenChallenges])

  const withdrawPendingDuel = useCallback(async (duelId: string) => {
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/duels/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duel_id: duelId }),
      })
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? 'Unable to withdraw.'); return }
      setDuels(curr => curr.filter(d => d.id !== duelId))
    } finally { setBusy(false) }
  }, [])

  const forfeitDuel = useCallback(async (duelId: string) => {
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/duels/forfeit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duel_id: duelId }),
      })
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? 'Unable to forfeit.'); return }
      setDuels(curr => curr.filter(d => d.id !== duelId))
      setConfirmForfeit(null)
      setNotice('Duel forfeited. The outcome is recorded.')
    } finally { setBusy(false) }
  }, [])

  const ownOpenChallenge = useMemo(() => openChallenges.find((entry) => entry.challenger_id === userId), [openChallenges, userId])
  const activeDuels = useMemo(() => duels.filter(d => d.status === 'active'), [duels])
  const pendingDuels = useMemo(() => duels.filter(d => d.status === 'pending'), [duels])

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <DuelGuide variant="hub" />

      {/* ─── Active Duels ─── */}
      <section className="paper-surface" style={{ padding: '1.5rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '1rem' }}>
          Active Combat Files
        </div>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {activeDuels.length ? activeDuels.map(duel => {
            const { me, opp } = duelLabel(duel, userId)
            return (
              <div key={duel.id} className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>{me} <span style={{ color: 'var(--text3)' }}>vs</span> {opp}</div>
                  {duel.is_war_duel && (
                    <span
                      className="font-space-mono"
                      style={{
                        fontSize: '0.48rem',
                        color: 'var(--accent)',
                        border: '1px solid var(--accent)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        letterSpacing: '0.1em'
                      }}
                    >
                      ⚔ WAR
                    </span>
                  )}
                </div>
                <div className="font-space-mono" style={{ fontSize: '0.56rem', color: '#4a8a4a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Round {Math.max(duel.current_round, 1)} / {DUEL_MAX_ROUNDS}
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <a href={`/duels/${duel.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>Enter Duel</a>
                  {confirmForfeit === duel.id ? (
                    <>
                      <button type="button" className="btn-secondary" style={{ color: '#8B0000', borderColor: '#8B0000' }} disabled={busy} onClick={() => forfeitDuel(duel.id)}>Confirm Forfeit</button>
                      <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmForfeit(null)}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className="btn-secondary" style={{ color: '#8B0000' }} disabled={busy} onClick={() => setConfirmForfeit(duel.id)}>Forfeit</button>
                  )}
                </div>
              </div>
            )
          }) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>No active duels.</p>
          )}
        </div>
      </section>

      {/* ─── Pending Challenges ─── */}
      <section className="paper-surface" style={{ padding: '1.5rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '1rem' }}>
          Pending Challenges
        </div>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {pendingDuels.length ? pendingDuels.map(duel => {
            const { me, opp, isChallenger } = duelLabel(duel, userId)
            return (
              <div key={duel.id} className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                <div className="font-cinzel" style={{ fontSize: '1.1rem' }}>{me} <span style={{ color: 'var(--text3)' }}>vs</span> {opp}</div>
                <div className="font-space-mono" style={{ fontSize: '0.54rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {isChallenger ? `Waiting · ${formatRemainingTime(duel.challenge_expires_at)}` : `Incoming · ${formatRemainingTime(duel.challenge_expires_at)}`}
                </div>
                {isChallenger ? (
                  <button type="button" className="btn-secondary" style={{ color: '#8B0000' }} disabled={busy} onClick={() => withdrawPendingDuel(duel.id)}>Withdraw Challenge</button>
                ) : (
                  <a href="/duels/inbox" className="btn-secondary" style={{ textDecoration: 'none' }}>Respond</a>
                )}
              </div>
            )
          }) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>No pending challenges.</p>
          )}
        </div>
      </section>

      {/* ─── Duel History ─── */}
      {history.length > 0 && (
        <section className="paper-surface" style={{ padding: '1.5rem' }}>
          <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '1rem' }}>
            Combat Archive
          </div>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {history.map(duel => {
              const { me, opp } = duelLabel(duel, userId)
              const label = statusLabel(duel, userId)
              const color = statusColor(duel, userId)
              const rounds = duel.current_round ?? 0
              return (
                <div key={duel.id} className="paper-surface" style={{ padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div className="font-cinzel" style={{ fontSize: '1rem' }}>{me} <span style={{ color: 'var(--text3)' }}>vs</span> {opp}</div>
                    <div className="font-space-mono" style={{ fontSize: '0.52rem', color: 'var(--text3)', marginTop: '0.25rem', letterSpacing: '0.1em' }}>
                      {rounds > 0 ? `${rounds} round${rounds !== 1 ? 's' : ''}` : 'Before combat'} · {new Date(duel.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-space-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color, fontWeight: 700 }}>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ─── Challenge A Player ─── */}
      <section className="paper-surface" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Issue a Challenge
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search operatives by username"
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
              <button type="button" className="btn-secondary" onClick={() => setSelected(result)}>Challenge</button>
            </div>
          ))}
          {query.trim() && results.length === 0 ? (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>No matching operatives found.</p>
          ) : null}
        </div>

        {selected ? (
          <div className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.8rem', borderColor: 'var(--accent)' }}>
            <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>Challenge {selected.username}?</div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 100))}
              placeholder="Optional message to your opponent"
              rows={3}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.8rem 1rem', color: 'var(--text1)', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void sendChallenge()}>Confirm Challenge</button>
              <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        ) : null}
      </section>

      {/* ─── Open Challenges Board ─── */}
      <section className="paper-surface" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>Open Challenges Board</div>
          {ownOpenChallenge ? (
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void withdrawOwnOpenChallenge(ownOpenChallenge.id)}>Withdraw Open Challenge</button>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <input
                value={openMessage}
                onChange={(event) => setOpenMessage(event.target.value.slice(0, 80))}
                placeholder="Optional message"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.8rem 1rem', color: 'var(--text1)', minWidth: '260px' }}
              />
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void postOpenChallenge()}>Post Open Challenge</button>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          {openChallenges.length ? openChallenges.map((challenge) => (
            <OpenChallengeCard key={challenge.id} challenge={challenge} disabled={busy || challenge.challenger_id === userId} onAccept={acceptOpenChallenge} />
          )) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>The open board is quiet.</p>
          )}
        </div>
      </section>

      {error ? <p className="font-cormorant" style={{ margin: 0, color: '#8B0000', fontStyle: 'italic' }}>{error}</p> : null}
      {notice ? <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>{notice}</p> : null}
    </div>
  )
}

