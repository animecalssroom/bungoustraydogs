'use client'

import Link from 'next/link'
import type { Duel } from '@/backend/types'
import { formatRemainingTime } from '@/lib/duels/shared'

export function DuelCard({
  duel,
  userId,
}: {
  duel: Duel
  userId: string
}) {
  const isChallenger = duel.challenger_id === userId
  const me = isChallenger
    ? duel.challenger_character ?? duel.challenger_faction ?? 'Operative'
    : duel.defender_character ?? duel.defender_faction ?? 'Operative'
  const opponent = isChallenger
    ? duel.defender_character ?? duel.defender_faction ?? 'Operative'
    : duel.challenger_character ?? duel.challenger_faction ?? 'Operative'

  return (
    <article
      className="paper-surface"
      style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}
    >
      <div className="font-cinzel" style={{ fontSize: '1.15rem' }}>
        {me} vs {opponent}
      </div>
      <div className="font-space-mono" style={{ fontSize: '0.58rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {duel.status === 'pending'
          ? `Pending - ${formatRemainingTime(duel.challenge_expires_at)}`
          : `Round ${Math.max(duel.current_round, 1)} / 5`}
      </div>
      <Link href={duel.status === 'pending' ? '/duels/inbox' : `/duels/${duel.id}`} className="btn-secondary">
        {duel.status === 'pending' ? 'Respond In Inbox' : 'Enter Duel'}
      </Link>
    </article>
  )
}
