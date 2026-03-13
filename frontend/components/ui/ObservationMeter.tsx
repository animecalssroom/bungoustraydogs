'use client'

import { motion } from 'framer-motion'

const STAGES = [
  { label: 'Presence noted', pulse: false },
  { label: 'Patterns emerging', pulse: false },
  { label: 'Signature forming', pulse: false },
  { label: 'Behavioral analysis in progress', pulse: false },
  { label: 'Assignment imminent', pulse: true },
] as const

export default function ObservationMeter({
  eventCount,
  factionColor,
}: {
  eventCount: number
  factionColor: string
}) {
  // Preserve existing hide behavior — do not change
  if (eventCount >= 10) {
    return null
  }

  // Map eventCount to stages proportionally across 20-event threshold
  const stageIndex = Math.min(
    Math.floor(((eventCount ?? 0) / 20) * STAGES.length),
    STAGES.length - 1,
  )
  const stage = STAGES[stageIndex]
  const progress = Math.min(((eventCount ?? 0) / 20) * 100, 100)

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.55rem',
          gap: '0.75rem',
        }}
      >
        <div
          className="font-space-mono"
          style={{
            fontSize: '0.58rem',
            letterSpacing: '0.18em',
            color: 'var(--text4)',
            textTransform: 'uppercase',
          }}
        >
          City Observation Status
        </div>
        {stage.pulse ? (
          <motion.span
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ repeat: Infinity, duration: 1.1 }}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: '#b31c1c',
              display: 'inline-block',
            }}
          />
        ) : null}
      </div>

      <div style={{ height: '2px', background: 'var(--border2)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `color-mix(in srgb, ${factionColor} 30%, transparent)`,
          }}
        />
      </div>

      <div
        className="font-cormorant"
        style={{
          marginTop: '0.5rem',
          color: 'var(--text3)',
          fontStyle: 'italic',
          fontSize: '1rem',
        }}
      >
        {stage.label}
      </div>
    </div>
  )
}
