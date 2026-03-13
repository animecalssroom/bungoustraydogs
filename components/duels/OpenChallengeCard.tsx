'use client'

import type { OpenChallenge } from '@/backend/types'
import { formatRemainingTime } from '@/lib/duels/shared'

export function OpenChallengeCard({
  challenge,
  disabled,
  onAccept,
}: {
  challenge: OpenChallenge
  disabled?: boolean
  onAccept: (openChallengeId: string) => Promise<void>
}) {
  return (
    <article className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.7rem' }}>
      <div className="font-cinzel" style={{ fontSize: '1.1rem' }}>
        {challenge.character_name ?? 'Unregistered Operative'}
      </div>
      {challenge.message ? (
        <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.6 }}>
          {challenge.message}
        </p>
      ) : null}
      <div className="font-space-mono" style={{ fontSize: '0.58rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {formatRemainingTime(challenge.expires_at)}
      </div>
      <button type="button" className="btn-secondary" disabled={disabled} onClick={() => void onAccept(challenge.id)}>
        Accept Challenge
      </button>
    </article>
  )
}
