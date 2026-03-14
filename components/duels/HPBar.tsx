'use client'

import type { FactionId } from '@/backend/types'

const FACTION_COLOR: Record<string, string> = {
  agency: 'var(--color-agency)',
  mafia: 'var(--color-mafia)',
  guild: 'var(--color-guild)',
  hunting_dogs: 'var(--color-dogs)',
  special_div: 'var(--color-special, #4A5A6A)',
  rats: '#5a3a5a',
  decay: '#3a4a3a',
  clock_tower: '#4a4a5a',
}

export function HPBar({
  label,
  value,
  max,
  align,
  showValue,
  faction,
  isComeback,
}: {
  label: string
  value: number
  max: number
  align: 'left' | 'right'
  showValue?: boolean
  faction?: FactionId | null
  isComeback?: boolean
}) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  const factionColor = faction ? (FACTION_COLOR[faction] ?? 'var(--accent)') : 'var(--accent)'

  // Shift from faction color → red as HP drops
  const barColor =
    percent <= 20
      ? '#8B0000'
      : percent <= 40
        ? `color-mix(in srgb, #8B0000 40%, ${factionColor})`
        : factionColor

  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      {/* Label + value row */}
      <div
        style={{
          display: 'flex',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          alignItems: 'baseline',
          gap: '0.5rem',
        }}
      >
        <span
          className="font-space-mono"
          style={{
            fontSize: '0.52rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text3)',
          }}
        >
          {label}
        </span>
        {showValue && (
          <span
            className="font-space-mono"
            style={{
              fontSize: '0.52rem',
              color: percent <= 20 ? '#8B0000' : 'var(--text3)',
              transition: 'color 0.4s',
            }}
          >
            {value} / {max}
          </span>
        )}
      </div>

      {/* Track */}
      <div
        style={{
          height: '6px',
          background: 'var(--border2)',
          borderRadius: '1px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: align === 'right' ? 'auto' : 0,
            right: align === 'right' ? 0 : 'auto',
            width: `${percent}%`,
            background: barColor,
            transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1), background 0.6s',
            borderRadius: '1px',
            ...(isComeback && percent <= 20
              ? { animation: 'hpPulse 1.8s ease-in-out infinite' }
              : {}),
          }}
        />
      </div>

      {/* Comeback pulse keyframes — injected once */}
      {isComeback && percent <= 20 && (
        <style>{`
          @keyframes hpPulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.45; }
          }
        `}</style>
      )}
    </div>
  )
}
