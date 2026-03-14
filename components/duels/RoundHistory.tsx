'use client'

import { useEffect, useState } from 'react'
import type { DuelMove, DuelRound } from '@/backend/types'
import { describeRoundMechanics, formatMoveLabel, getDisplayRoundNarrative } from '@/lib/duels/presentation'

// ── Move pill colors ──────────────────────────────────────────────────────
const MOVE_COLORS: Record<DuelMove, { text: string; border: string; bg: string }> = {
  strike: { text: '#3c3c3c', border: '#8c8c8c', bg: 'rgba(0,0,0,0.03)' },
  stance: { text: '#2c5282', border: 'rgba(44,82,130,0.4)', bg: 'rgba(44,82,130,0.05)' },
  gambit: { text: '#975a16', border: 'rgba(151,90,22,0.4)', bg: 'rgba(151,90,22,0.05)' },
  recover: { text: '#276749', border: 'rgba(39,103,73,0.4)', bg: 'rgba(39,103,73,0.05)' },
  special: { text: '#9b2c2c', border: 'rgba(155,44,44,0.4)', bg: 'rgba(155,44,44,0.05)' },
}

function MovePill({ move }: { move: DuelMove | null }) {
  if (!move) {
    return (
      <span
        className="font-space-mono"
        style={{ fontSize: '0.48rem', letterSpacing: '0.08em', color: 'var(--text3)', padding: '2px 6px', border: '1px solid var(--border2)', borderRadius: '1px' }}
      >
        —
      </span>
    )
  }
  const c = MOVE_COLORS[move]
  return (
    <span
      className="font-space-mono"
      style={{
        fontSize: '0.48rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: c.text,
        padding: '2px 8px',
        border: `1.5px solid ${c.border}`,
        borderRadius: '1px',
        background: c.bg,
        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.02)',
        display: 'inline-flex',
        alignItems: 'center',
        transform: 'rotate(-1deg)',
      }}
    >
      {formatMoveLabel(move)}
    </span>
  )
}

function DamageChip({ value, label }: { value: number; label: string }) {
  if (!value) return null
  return (
    <span
      className="font-space-mono"
      style={{
        fontSize: '0.46rem',
        color: value > 0 ? '#cc0000' : '#1a7a4a',
        letterSpacing: '0.06em',
        background: 'rgba(0,0,0,0.02)',
        padding: '1px 4px',
        borderBottom: `1px solid ${value > 0 ? 'rgba(204,0,0,0.2)' : 'rgba(26,122,74,0.2)'}`
      }}
    >
      {label} {value > 0 ? `−${value}` : `+${Math.abs(value)}`}
    </span>
  )
}

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
    if (latest) setOpenId(latest)
  }, [latest])

  if (!rounds.length) {
    return (
      <p
        className="font-cormorant"
        style={{ margin: 0, fontStyle: 'italic', color: 'var(--text3)', fontSize: '0.9rem' }}
      >
        Combat logs are currently empty.
      </p>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {rounds.map((round) => {
        const isOpen = openId === round.id
        const detailLines = describeRoundMechanics(round, challengerName, defenderName)
        const narrative = getDisplayRoundNarrative(round, challengerName, defenderName)

        return (
          <article
            key={round.id}
            style={{
              background: '#fcfaf7', // Paper-like off-white
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")',
              border: '1px solid #d4c5b3',
              borderRadius: '2px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              ...(isOpen ? { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } : {}),
            }}
          >
            {/* ── Collapsed header row ── */}
            <button
              type="button"
              onClick={() => setOpenId((cur) => (cur === round.id ? null : round.id))}
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                padding: '0.75rem 0.95rem',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                alignItems: 'center',
                gap: '0.8rem',
                transition: 'background 0.15s',
              }}
            >
              {/* Round number */}
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: '4.5rem' }}>
                <span
                  className="font-space-mono"
                  style={{
                    fontSize: '0.48rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#8b7d6b',
                    fontWeight: 600,
                  }}
                >
                  Log Entry
                </span>
                <span
                  className="font-space-mono"
                  style={{
                    fontSize: '0.75rem',
                    color: '#4a433a',
                    fontWeight: 700,
                  }}
                >
                  {String(round.round_number).padStart(2, '0')}
                  {round.is_sudden_death && <span style={{ color: '#cc0000', fontSize: '0.5rem', marginLeft: '4px' }}>SD</span>}
                </span>
              </div>

              {/* Move pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MovePill move={round.challenger_move} />
                <span className="font-space-mono" style={{ fontSize: '0.42rem', color: '#8b7d6b' }}>×</span>
                <MovePill move={round.defender_move} />
              </div>

              {/* Damage summary */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <DamageChip value={round.challenger_damage_dealt} label={challengerName.split(' ')[0]} />
                <DamageChip value={round.defender_damage_dealt} label={defenderName.split(' ')[0]} />
              </div>

              {/* Status indicator */}
              <span
                style={{
                  fontSize: '0.6rem',
                  color: '#8b7d6b',
                  opacity: 0.6,
                }}
              >
                {isOpen ? '⌃' : '⌄'}
              </span>
            </button>

            {/* ── Expanded detail ── */}
            {isOpen && (
              <div
                style={{
                  padding: '0.85rem 1rem 1rem',
                  borderTop: '1px dashed #d4c5b3',
                  display: 'grid',
                  gap: '0.75rem',
                  background: 'rgba(0,0,0,0.01)',
                }}
              >
                {/* Mechanics deep-dive */}
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  {detailLines.map((line) => (
                    <div
                      key={line}
                      className="font-space-mono"
                      style={{ fontSize: '0.55rem', color: '#5a534a', letterSpacing: '0.02em', lineHeight: 1.4, opacity: 0.9 }}
                    >
                      • {line}
                    </div>
                  ))}

                  {round.special_events?.length ? (
                    <div
                      className="font-space-mono"
                      style={{ fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}
                    >
                      ▶ {round.special_events
                        .map((e) => String(e.description ?? e.type))
                        .join(' | ')}
                    </div>
                  ) : null}
                </div>

                <div style={{ height: '1px', background: '#e8e2d9' }} />

                {/* Narrative text block */}
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  <span className="font-space-mono" style={{ fontSize: '0.45rem', textTransform: 'uppercase', color: '#8b7d6b', letterSpacing: '0.1em' }}>Strategic Assessment</span>
                  <p
                    className="font-cormorant"
                    style={{
                      margin: 0,
                      color: '#2a2a2a',
                      fontStyle: 'italic',
                      lineHeight: 1.6,
                      fontSize: '1.05rem',
                      opacity: 0.95,
                    }}
                  >
                    "{narrative}"
                  </p>
                </div>

                {/* HP Recap Footer */}
                <div style={{
                  marginTop: '0.4rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid #e8e2d9',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {round.challenger_hp_after !== null && (
                      <span className="font-space-mono" style={{ fontSize: '0.48rem', color: '#8b7d6b' }}>
                        Post-Exchange HP ({challengerName.split(' ')[0]}): {round.challenger_hp_after}
                      </span>
                    )}
                    {round.defender_hp_after !== null && (
                      <span className="font-space-mono" style={{ fontSize: '0.48rem', color: '#8b7d6b' }}>
                        Post-Exchange HP ({defenderName.split(' ')[0]}): {round.defender_hp_after}
                      </span>
                    )}
                  </div>
                  <span className="font-space-mono" style={{ fontSize: '0.45rem', color: '#8b7d6b', opacity: 0.5 }}>CLASSIFIED</span>
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}