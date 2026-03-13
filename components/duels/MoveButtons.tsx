'use client'

import type { DuelMove } from '@/backend/types'

export function MoveButtons({
  disabled,
  canUseSpecial,
  specialLabel,
  recoverLocked,
  specialLockedUntilRound,
  currentRound,
  onSubmit,
}: {
  disabled: boolean
  canUseSpecial: boolean
  specialLabel: string
  recoverLocked: boolean
  specialLockedUntilRound?: number | null
  currentRound: number
  onSubmit: (move: DuelMove) => void
}) {
  const specialBlocked = !canUseSpecial || Boolean(specialLockedUntilRound && specialLockedUntilRound > currentRound)
  const specialTitle = !canUseSpecial
    ? 'Your own character is not assigned yet, so Special is unavailable.'
    : specialLockedUntilRound && specialLockedUntilRound > currentRound
      ? specialLockedUntilRound >= 90
        ? 'Special has already been spent for this duel.'
        : `Cooldown ? available round ${specialLockedUntilRound}.`
      : undefined

  const buttons: Array<{ move: DuelMove; label: string; blocked?: boolean; title?: string }> = [
    { move: 'strike', label: 'Strike' },
    { move: 'stance', label: 'Stance' },
    { move: 'gambit', label: 'Gambit' },
    { move: 'special', label: specialLabel, blocked: specialBlocked, title: specialTitle },
    { move: 'recover', label: 'Recover', blocked: recoverLocked, title: recoverLocked ? 'Recovery requires one round to reset.' : undefined },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
      {buttons.map((button) => (
        <button
          key={button.move}
          type="button"
          className={button.move === 'special' ? 'btn-primary' : 'btn-secondary'}
          disabled={disabled || button.blocked}
          onClick={() => onSubmit(button.move)}
          title={button.title}
          style={button.blocked ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}
