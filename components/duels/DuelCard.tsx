'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Duel } from '@/backend/types'
import { formatRemainingTime, DUEL_MAX_ROUNDS } from '@/lib/duels/shared'

export function DuelCard({
  duel,
  userId,
}: {
  duel: Duel
  userId: string
}) {
  const isChallenger = duel.challenger_id === userId

  const { me, opponent } = useMemo(() => ({
    me: isChallenger
      ? duel.challenger_character ?? duel.challenger_faction ?? 'Operative'
      : duel.defender_character ?? duel.defender_faction ?? 'Operative',
    opponent: isChallenger
      ? duel.defender_character ?? duel.defender_faction ?? 'Operative'
      : duel.challenger_character ?? duel.challenger_faction ?? 'Operative',
  }), [duel.challenger_character, duel.challenger_faction, duel.defender_character, duel.defender_faction, isChallenger])

  return (
    <article
      className="paper-surface"
      style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}
    >
      <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>
        {me} vs {opponent}
      </div>
      <div className="font-space-mono" style={{ fontSize: '0.58rem', color: duel.status === 'active' ? '#4a8a4a' : 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {duel.status === 'pending'
          ? `${isChallenger ? 'Waiting' : 'Incoming'} - ${formatRemainingTime(duel.challenge_expires_at)}`
          : `Round ${Math.max(duel.current_round, 1)} / ${DUEL_MAX_ROUNDS}`}
      </div>
      {duel.status === 'pending' && isChallenger ? (
        <div className="font-cormorant" style={{ fontSize: '0.9rem', color: 'var(--text3)', fontStyle: 'italic' }}>
          Challenge sent. Awaiting response.
        </div>
      ) : (
        <Link href={duel.status === 'pending' ? '/duels/inbox' : `/duels/${duel.id}`} className="btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
          {duel.status === 'pending' ? 'Respond In Inbox' : 'Enter Duel'}
        </Link>
      )}
    </article>
  )
}
