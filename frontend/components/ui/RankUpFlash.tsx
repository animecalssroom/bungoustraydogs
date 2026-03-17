'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const KANJI: Record<string, string> = {
  agency: 'A',
  mafia: 'M',
  guild: 'G',
  hunting_dogs: 'D',
  special_div: 'S',
}

export default function RankUpFlash({
  show,
  faction,
  newRankTitle,
  onComplete,
}: {
  show: boolean
  faction: string
  newRankTitle: string
  onComplete: () => void
}) {
  useEffect(() => {
    if (!show) {
      return
    }

    const timeout = window.setTimeout(onComplete, 2800)
    return () => window.clearTimeout(timeout)
  }, [onComplete, show])

  const factionColor = `var(--color-${faction
    .replace('hunting_dogs', 'dogs')
    .replace('special_div', 'special')})`

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9995,
            display: 'grid',
            placeItems: 'center',
            background: `radial-gradient(circle at center, color-mix(in srgb, ${factionColor} 34%, transparent), rgba(0, 0, 0, 0.92) 72%)`,
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <motion.div
              className="font-cinzel"
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, type: 'spring', bounce: 0.35 }}
              style={{
                fontSize: 'clamp(5rem, 18vw, 9rem)',
                color: factionColor,
                lineHeight: 1,
              }}
            >
              {KANJI[faction] ?? 'R'}
            </motion.div>
            <motion.div
              className="font-cinzel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.35 }}
              style={{
                marginTop: '0.85rem',
                fontSize: '1.45rem',
                letterSpacing: '0.18em',
                color: 'var(--color-paper)',
                textTransform: 'uppercase',
              }}
            >
              {newRankTitle}
            </motion.div>
            <motion.div
              className="font-space-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.3 }}
              style={{
                marginTop: '0.5rem',
                fontSize: '0.62rem',
                letterSpacing: '0.26em',
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
              }}
            >
              Rank Achieved
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
