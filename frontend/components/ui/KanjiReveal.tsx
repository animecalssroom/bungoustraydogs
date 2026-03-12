'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const FACTION_KANJI: Record<string, string> = {
  agency: '\u63a2',
  mafia: '\u6e2f',
  guild: '\u5bcc',
  dogs: '\u72ac',
  hunting_dogs: '\u72ac',
  special: '\u52d9',
  special_div: '\u52d9',
}

const FACTION_COLORS: Record<string, string> = {
  agency: '#8B6020',
  mafia: '#CC1A1A',
  guild: '#C8A020',
  dogs: '#4A6A8A',
  hunting_dogs: '#4A6A8A',
  special: '#4A5A6A',
  special_div: '#4A5A6A',
}

export default function KanjiReveal({ faction }: { faction: string | null | undefined }) {
  const kanjiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!kanjiRef.current) return

    gsap.fromTo(
      kanjiRef.current,
      { opacity: 0, scale: 0.8, filter: 'blur(8px)' },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.5,
        ease: 'power3.out',
      },
    )
  }, [faction])

  const key = faction ?? '__fallback__'

  return (
    <div
      ref={kanjiRef}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '1em',
        fontSize: 'clamp(4.5rem, 16vw, 8rem)',
        fontFamily: '"Noto Serif JP", serif',
        fontWeight: 600,
        color: FACTION_COLORS[key] || '#8B2500',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {FACTION_KANJI[key] || '\u5224'}
    </div>
  )
}
