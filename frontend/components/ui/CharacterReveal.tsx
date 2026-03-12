'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap } from 'gsap'
import {
  ABILITY_TYPE_LABELS,
  type AbilityType,
} from '@/frontend/lib/ability-types'

export default function CharacterReveal({
  show,
  characterName,
  abilityName,
  abilityType,
  registryNote,
  factionColor,
  onComplete,
}: {
  show: boolean
  characterName: string
  abilityName: string
  abilityType: AbilityType | null
  registryNote: string
  factionColor: string
  onComplete: () => void
}) {
  const nameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show || !nameRef.current) {
      return
    }

    nameRef.current.textContent = ''
    const timeline = gsap.timeline()
    let visible = ''

    characterName.split('').forEach((letter, index) => {
      timeline.call(() => {
        visible += letter
        if (nameRef.current) {
          nameRef.current.textContent = visible
        }
      }, undefined, index * 0.06)
    })

    const timeout = window.setTimeout(onComplete, 6800)

    return () => {
      timeline.kill()
      window.clearTimeout(timeout)
    }
  }, [characterName, onComplete, show])

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
            zIndex: 9994,
            background:
              'radial-gradient(circle at top, rgba(255,255,255,0.06), transparent 28%), rgba(8, 4, 6, 0.94)',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: '640px', textAlign: 'center' }}>
            <motion.div
              className="font-space-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
              }}
            >
              The city has completed its analysis
            </motion.div>

            <div
              ref={nameRef}
              className="font-cinzel"
              style={{
                marginTop: '1rem',
                minHeight: '3.8rem',
                fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
                color: factionColor,
                letterSpacing: '0.08em',
              }}
            />

            <motion.div
              className="font-cormorant"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.45 }}
              style={{
                marginTop: '0.4rem',
                fontSize: '1.2rem',
                fontStyle: 'italic',
                color: factionColor,
              }}
            >
              {abilityName}
            </motion.div>

            <motion.div
              className="font-space-mono"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.5, duration: 0.35 }}
              style={{
                marginTop: '0.9rem',
                display: 'inline-flex',
                padding: '0.4rem 0.9rem',
                border: `1px solid ${factionColor}`,
                color: factionColor,
                fontSize: '0.65rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {abilityType ? ABILITY_TYPE_LABELS[abilityType] : 'Unclassified'}
            </motion.div>

            <motion.div
              className="font-cormorant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.1, duration: 0.6 }}
              style={{
                marginTop: '1rem',
                color: 'rgba(255,255,255,0.72)',
                fontSize: '1.05rem',
                fontStyle: 'italic',
                lineHeight: 1.8,
              }}
            >
              {registryNote}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
