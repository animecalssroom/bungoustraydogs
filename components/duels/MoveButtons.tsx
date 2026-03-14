'use client'

import React, { useMemo } from 'react'
import type { DuelMove } from '@/backend/types/index'
import styles from './MoveButtons.module.css'

// ── Move metadata ─────────────────────────────────────────────────────────
const MOVE_META: Record<
  DuelMove,
  {
    color: string
    icon: React.ReactNode
    stat: string
    flavor: string
  }
> = {
  strike: {
    color: 'var(--text2)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 13L13 3M10 3h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    stat: '25–35 dmg · reliable',
    flavor: 'Direct pressure. No variables.',
  },
  stance: {
    color: 'var(--color-dogs, #4A6A8A)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L14 4.5V9C14 12.5 11.5 15 8 15C4.5 15 2 12.5 2 9V4.5L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    stat: '10–15 dmg · −40% incoming',
    flavor: 'Reduce exposure. Counter types punish Strike.',
  },
  gambit: {
    color: 'var(--color-guild, #B8900A)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L9.8 6H14.5L10.5 8.8L12 13.5L8 10.8L4 13.5L5.5 8.8L1.5 6H6.2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
    stat: '50 dmg · 50% hit',
    flavor: 'All or nothing. High ceiling, real floor.',
  },
  recover: {
    color: '#1a7a4a',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    stat: '+20 HP · can\'t use twice in a row',
    flavor: 'Desperate measure. You take full damage.',
  },
  special: {
    color: 'var(--accent)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    stat: 'Ability — once per duel',
    flavor: 'Your registered ability. Use it well.',
  },
}

export function MoveButtons({
  disabled,
  canUseSpecial,
  specialLabel,
  recoverLocked,
  specialLockedUntilRound,
  gambitsRemaining = 2,
  currentRound,
  onSubmit,
}: {
  disabled: boolean
  canUseSpecial: boolean
  specialLabel: string
  recoverLocked: boolean
  specialLockedUntilRound?: number | null
  gambitsRemaining?: number
  currentRound: number
  onSubmit: (move: DuelMove) => void
}) {
  const specialBlocked =
    !canUseSpecial ||
    Boolean(specialLockedUntilRound && specialLockedUntilRound > currentRound)

  const gambitBlocked = gambitsRemaining <= 0

  const specialTitle = useMemo(() => {
    if (!canUseSpecial) return 'Character not assigned — Special unavailable.'
    if (specialLockedUntilRound && specialLockedUntilRound > currentRound) {
      if (specialLockedUntilRound >= 90) return 'Special already spent this duel.'
      return `Cooldown — available round ${specialLockedUntilRound}.`
    }
    return undefined
  }, [canUseSpecial, specialLockedUntilRound, currentRound])

  type ButtonDef = {
    move: DuelMove
    label: string
    blocked: boolean
    title?: string
  }

  const buttons = useMemo<ButtonDef[]>(() => [
    { move: 'strike', label: 'Strike', blocked: false },
    { move: 'stance', label: 'Stance', blocked: false },
    {
      move: 'gambit',
      label: gambitBlocked ? 'Gambit' : `Gambit (${gambitsRemaining})`,
      blocked: gambitBlocked,
      title: gambitBlocked ? 'Gambit limit reached — 2 uses per duel.' : undefined,
    },
    {
      move: 'special',
      label: specialLabel,
      blocked: specialBlocked,
      title: specialTitle,
    },
    {
      move: 'recover',
      label: 'Recover',
      blocked: recoverLocked,
      title: recoverLocked ? 'Recovery requires one round to reset.' : undefined,
    },
  ], [gambitBlocked, gambitsRemaining, specialLabel, specialBlocked, specialTitle, recoverLocked])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '0.5rem',
      }}
    >
      {buttons.map((btn) => {
        const meta = MOVE_META[btn.move]
        return (
          <button
            key={btn.move}
            type="button"
            className={`${styles.moveCard} font-space-mono`}
            disabled={disabled || btn.blocked}
            onClick={() => onSubmit(btn.move)}
            title={btn.title}
            style={{ '--move-color': meta.color } as React.CSSProperties}
          >
            <div className={styles.moveIconRing}>{meta.icon}</div>
            <div className={styles.moveName}>{btn.label}</div>
            <div className={styles.moveStat}>{meta.stat}</div>
            <div className={styles.moveFlavor}>{meta.flavor}</div>
          </button>
        )
      })}
    </div>
  )
}
