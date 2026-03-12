'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface APFloat {
  id: string
  amount: number
  x: number
  y: number
}

let queueHandler: ((float: APFloat) => void) | null = null

export function triggerFloatingAP(element: HTMLElement, amount: number) {
  if (!queueHandler) {
    return
  }

  const bounds = element.getBoundingClientRect()

  queueHandler({
    id: Math.random().toString(36).slice(2),
    amount,
    x: bounds.left + bounds.width / 2,
    y: bounds.top,
  })
}

export function FloatingAPLayer() {
  const [floats, setFloats] = useState<APFloat[]>([])

  useEffect(() => {
    queueHandler = (float) => {
      setFloats((current) => [...current, float])
      window.setTimeout(() => {
        setFloats((current) => current.filter((entry) => entry.id !== float.id))
      }, 1200)
    }

    return () => {
      queueHandler = null
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9991,
      }}
    >
      <AnimatePresence>
        {floats.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 1, y: entry.y, x: entry.x }}
            animate={{ opacity: 0, y: entry.y - 48, x: entry.x }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="font-space-mono"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              transform: 'translateX(-50%)',
              color: 'var(--accent)',
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            +{entry.amount} AP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
