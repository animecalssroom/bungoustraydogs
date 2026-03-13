'use client'

import { useEffect, useState } from 'react'
import type { DuelRound } from '@/backend/types'
import { describeRoundMechanics, formatMoveLabel, getDisplayRoundNarrative } from '@/lib/duels/presentation'

export function RoundHistory({
  rounds,
  challengerName,
  defenderName,
}: {
  rounds: DuelRound[]
  challengerName: string
  defenderName: string
}) {
  const latest = rounds[rounds.length - 1]?.id ?? null
  const [openId, setOpenId] = useState<string | null>(latest)

  useEffect(() => {
    setOpenId(latest)
  }, [latest])

  return (
    <div style={{ display: 'grid', gap: '0.7rem' }}>
      {rounds.map((round) => {
        const moveSummary = `${formatMoveLabel(round.challenger_move)} vs ${formatMoveLabel(round.defender_move)}`
        const detailLines = describeRoundMechanics(round, challengerName, defenderName)

        return (
          <article key={round.id} className="paper-surface" style={{ padding: '0.9rem 1rem' }}>
            <button
              type="button"
              onClick={() => setOpenId((current) => (current === round.id ? null : round.id))}
              className="font-space-mono"
              style={{ width: '100%', background: 'transparent', border: 0, color: 'var(--text2)', textAlign: 'left', padding: 0, cursor: 'pointer', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'grid', gap: '0.35rem' }}
            >
              <span>Round {round.round_number}</span>
              <span style={{ color: 'var(--text4)', fontSize: '0.52rem' }}>{moveSummary}</span>
            </button>
            {openId === round.id ? (
              <div style={{ marginTop: '0.7rem', display: 'grid', gap: '0.55rem' }}>
                {detailLines.map((line) => (
                  <div key={line} className="font-space-mono" style={{ fontSize: '0.55rem', color: 'var(--text3)' }}>
                    {line}
                  </div>
                ))}
                {round.special_events?.length ? (
                  <div className="font-space-mono" style={{ fontSize: '0.55rem', color: 'var(--accent)' }}>
                    Special events: {round.special_events.map((event) => String(event.description ?? event.type ?? 'recorded anomaly')).join(' | ')}
                  </div>
                ) : null}
                <div className="font-cormorant" style={{ color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                  {getDisplayRoundNarrative(round, challengerName, defenderName)}
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
