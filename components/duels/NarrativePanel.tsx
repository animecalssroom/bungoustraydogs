'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function NarrativePanel({ narrative }: { narrative: string }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '1rem 1.25rem',
        borderLeft: '2px solid var(--border2)',
        background:
          'linear-gradient(90deg, color-mix(in srgb, var(--accent) 4%, transparent), transparent)',
        minHeight: '72px',
        display: 'grid',
        alignItems: 'center',
      }}
    >
      {/* Corner mark */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: -1,
          width: '2px',
          height: '12px',
          background: 'var(--accent)',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.p
          key={narrative}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="font-cormorant"
          style={{
            margin: 0,
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: 'var(--text2)',
            fontStyle: 'italic',
          }}
        >
          {narrative}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
