'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function NarrativePanel({ narrative }: { narrative: string }) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '120px', display: 'grid', placeItems: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={narrative}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="font-cormorant"
          style={{ margin: 0, fontSize: '1.06rem', lineHeight: 1.8, color: 'var(--text2)', fontStyle: 'italic', textAlign: 'center' }}
        >
          {narrative}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
