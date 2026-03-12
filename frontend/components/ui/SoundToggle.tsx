'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isSoundEnabled, startRain, stopRain, toggleSound } from '@/frontend/lib/sounds'

export default function SoundToggle() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const next = isSoundEnabled()
    setEnabled(next)
  }, [])

  useEffect(() => {
    if (!enabled) {
      stopRain()
      return
    }

    if (pathname === '/') {
      void startRain()
      return () => stopRain()
    }

    stopRain()
    return undefined
  }, [enabled, pathname])

  function handleToggle() {
    const next = toggleSound()
    setEnabled(next)

    if (!next) {
      stopRain()
      return
    }

    if (pathname === '/') {
      void startRain()
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="font-space-mono"
      style={{
        minHeight: '36px',
        padding: '0 0.8rem',
        border: '1px solid var(--border)',
        background: 'color-mix(in srgb, var(--surface) 52%, transparent)',
        color: enabled ? 'var(--accent)' : 'var(--text2)',
        cursor: 'pointer',
        fontSize: '0.55rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
      title={enabled ? 'Sound ON' : 'Sound OFF'}
      type="button"
    >
      {enabled ? '◉ SOUND' : '○ SOUND'}
    </button>
  )
}
