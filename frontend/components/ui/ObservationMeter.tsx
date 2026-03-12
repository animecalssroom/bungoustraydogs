'use client'

import { motion } from 'framer-motion'

const STAGES = [
  { max: 2, label: 'Presence noted', pulse: false },
  { max: 5, label: 'Patterns emerging', pulse: false },
  { max: 7, label: 'Signature forming', pulse: false },
  { max: 8, label: 'Behavioral analysis in progress', pulse: false },
  { max: 9, label: 'Assignment imminent', pulse: true },
] as const

export default function ObservationMeter({
  eventCount,
  factionColor,
}: {
  eventCount: number
  factionColor: string
}) {
  if (eventCount >= 10) {
    return null
  }

  const stage = STAGES.find((entry) => eventCount <= entry.max) ?? STAGES[STAGES.length - 1]
  const progress = Math.min((eventCount / 9) * 100, 100)

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

      <div
        style={{
          height: '4px',
          background: 'var(--border2)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: factionColor,
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
