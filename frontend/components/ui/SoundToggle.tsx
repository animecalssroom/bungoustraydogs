'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isSoundEnabled, startRain, stopRain, startWind, stopWind, startAgency, stopAgency } from '@/frontend/lib/sounds'
import { useTheme } from '@/frontend/context/ThemeContext'
import { useSound } from '@/frontend/context/SoundContext'

export default function SoundToggle() {
  const pathname = usePathname()
  const { enabled, toggle } = useSound()
  const { theme } = useTheme()

  useEffect(() => {
    if (!enabled) {
      stopRain()
      stopWind()
      stopAgency()
      return
    }

    if (pathname === '/' && theme === 'dark') {
      void startRain()
      stopWind()
      stopAgency()
      return () => {
        stopRain()
        stopWind()
        stopAgency()
      }
    }

    if (pathname === '/' && theme === 'neutral') {
      void startWind()
      stopRain()
      stopAgency()
      return () => {
        stopWind()
        stopRain()
        stopAgency()
      }
    }

    if (pathname === '/' && theme === 'light') {
      void startAgency()
      stopRain()
      stopWind()
      return () => {
        stopAgency()
        stopRain()
        stopWind()
      }
    }

    stopRain()
    stopWind()
    stopAgency()
    return undefined
  }, [enabled, pathname, theme])

  function handleToggle() {
    toggle()
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