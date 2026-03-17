'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function MIAStatus({ isMIA }: { isMIA: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isMIA) {
      setShow(true)
    }
  }, [isMIA])

  if (!show) return null

  return (
    <div className="mia-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* VHS Static Effect */}
      <div className="vhs-static" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("https://media.giphy.com/media/oEI9uWUicKgR6fK5yC/giphy.gif")',
        backgroundSize: 'cover',
        opacity: 0.05,
        mixBlendMode: 'screen'
      }} />

      {/* Grayscale Overlay for the content behind */}
      <style jsx global>{`
        .mia-active {
          filter: grayscale(1) contrast(1.2) brightness(0.8) !important;
        }
        .redacted-text {
          background: #000;
          color: #000 !important;
          user-select: none;
          padding: 0 4px;
        }
      `}</style>

      {/* VHS Scanline */}
      <motion.div
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
          height: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
          zIndex: 101
        }}
      />
    </div>
  )
}
