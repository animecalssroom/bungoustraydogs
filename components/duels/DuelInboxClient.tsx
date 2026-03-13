'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Duel } from '@/backend/types'
import { DuelInboxCard } from '@/components/duels/DuelInboxCard'

export function DuelInboxClient({
  initialIncoming,
  initialOutgoing,
}: {
  initialIncoming: Duel[]
  initialOutgoing: Duel[]
}) {
  const router = useRouter()
  const [incoming, setIncoming] = useState(initialIncoming)
  const [outgoing, setOutgoing] = useState(initialOutgoing)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (kind: 'accept' | 'decline' | 'withdraw', duelId: string) => {
    setError(null)
    const endpoint =
      kind === 'accept' ? '/api/duels/accept' : kind === 'decline' ? '/api/duels/decline' : '/api/duels/withdraw'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duel_id: duelId }),
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error ?? 'Unable to update this challenge.')
      return
    }

    setIncoming((current) => current.filter((entry) => entry.id !== duelId))
    setOutgoing((current) => current.filter((entry) => entry.id !== duelId))

    if (kind === 'accept') {
      router.push(`/duels/${json.duel_id}`)
      return
    }

    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section className="paper-surface" style={{ padding: '1.5rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Incoming Challenges
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
          {incoming.length ? incoming.map((duel) => (
            <DuelInboxCard key={duel.id} duel={duel} mode="incoming" onAction={handleAction} />
          )) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
              No incoming challenges need a response right now.
            </p>
          )}
        </div>
      </section>

      <section className="paper-surface" style={{ padding: '1.5rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Outgoing Challenges
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
          {outgoing.length ? outgoing.map((duel) => (
            <DuelInboxCard key={duel.id} duel={duel} mode="outgoing" onAction={handleAction} />
          )) : (
            <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic' }}>
              No outgoing challenges are currently pending.
            </p>
          )}
        </div>
      </section>

      {error ? (
        <p className="font-cormorant" style={{ margin: 0, color: '#8B0000', fontStyle: 'italic' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
