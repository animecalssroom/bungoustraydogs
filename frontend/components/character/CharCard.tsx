'use client'

import { useEffect, useRef, useState } from 'react'
import type { Character } from '@/backend/types'

export const FACTION_COLORS: Record<string, string> = {
  agency:  '#8B6020',
  mafia:   '#CC1A1A',
  guild:   '#C8A020',
  hunting_dogs: '#4A6A8A',
  special_div: '#4A5A6A',
  rats:    '#6A1A6A',
  decay:   '#3A5A7A',
  clock_tower: '#5A4A2A',
}

export const FACTION_ICONS: Record<string, string> = {
  agency:  '🔍',
  mafia:   '🌑',
  guild:   '💰',
  hunting_dogs: '⚔️',
  special_div: '🔎',
  rats:    '🐀',
  decay:   '🎭',
  clock_tower: '🕰️',
}

export const FACTION_KANJI: Record<string, string> = {
  agency:  '探',
  mafia:   '港',
  guild:   '富',
  hunting_dogs: '犬',
  special_div: '務',
  rats:    '鼠',
  decay:   '衰',
  clock_tower: '塔',
}

export const FACTION_NAMES: Record<string, string> = {
  agency:  'Armed Detective Agency',
  mafia:   'Port Mafia',
  guild:   'The Guild',
  hunting_dogs: 'Hunting Dogs',
  special_div: 'Special Division',
  rats:    'Rats in the House of the Dead',
  decay:   'Decay of the Angel',
  clock_tower: 'Order of the Clock Tower',
}

const ROLE_LABELS: Record<string, string> = {
  strategist: 'Strategist',
  guardian: 'Guardian',
  berserker: 'Berserker',
  ghost: 'Ghost',
  wildcard: 'Wildcard',
  sovereign: 'Sovereign',
}

function StatBar({
  label,
  value,
  color,
  isVisible,
}: {
  label:     string
  value:     number
  color:     string
  isVisible: boolean
}) {
  return (
    <div className="flex-1">
      <div
        className="font-mono mb-[3px]"
        style={{ fontSize: '0.40rem', letterSpacing: '0.12em', color: 'var(--text4)', textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div className="stat-track">
        <div
          className="stat-fill"
          style={{
            width:      isVisible ? `${value}%` : '0%',
            background: color,
          }}
        />
      </div>
    </div>
  )
}

export function CharCard({ char }: { char: Character }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const color = FACTION_COLORS[char.faction_id] ?? 'var(--accent)'
  const icon = FACTION_ICONS[char.faction_id] ?? '◆'
  const kanji = char.kanji_symbol || FACTION_KANJI[char.faction_id] || '文'
  const factionName = FACTION_NAMES[char.faction_id] ?? char.faction_id
  const roleLabel = char.role_id ? ROLE_LABELS[char.role_id] ?? char.role_id : null

  return (
    <div
      ref={cardRef}
      className="bsd-card p-7"
      style={{ '--c-color': color } as React.CSSProperties}
    >
      <div className="faction-badge">
        <span
          style={{
            width: 5, height: 5,
            borderRadius: '9999px',
            background: color,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        {icon} {FACTION_KANJI[char.faction_id]} · {factionName}
      </div>

      <div
        className="font-cinzel font-semibold text-primary mb-[2px] leading-tight"
        style={{ fontSize: '1.2rem' }}
      >
        {char.name}
      </div>
      <div
        className="font-noto font-light text-text3 mb-[2px]"
        style={{ fontSize: '0.62rem', letterSpacing: '0.22em' }}
      >
        {char.name_jp}
      </div>
      <div
        className="font-noto text-text4 mb-3"
        style={{ fontSize: '0.46rem', letterSpacing: '0.14em', fontWeight: 200 }}
      >
        {char.name_reading}
      </div>

      <div
        className="font-fell italic mb-[3px]"
        style={{ fontSize: '0.98rem', color: color }}
      >
        {char.ability_name}
      </div>
      <div
        className="font-noto font-light text-text3 mb-3"
        style={{ fontSize: '0.52rem', letterSpacing: '0.18em' }}
      >
        {char.ability_name_jp}
      </div>

      {roleLabel && (
        <div
          className="font-mono text-text3 uppercase mb-3"
          style={{ fontSize: '0.46rem', letterSpacing: '0.12em' }}
        >
          {roleLabel}
        </div>
      )}

      <p
        className="italic text-text2 leading-[1.72] mb-3.5"
        style={{ fontSize: '0.86rem' }}
      >
        {char.description}
      </p>

      <div className="char-quote">{char.quote}</div>

      <div
        className="italic text-text3 mb-3.5"
        style={{ fontSize: '0.76rem', fontFamily: 'Cormorant Garamond, serif' }}
      >
        Real Author: {char.real_author} ({char.real_author_years})
      </div>

      <div className="flex gap-3 mb-3.5">
        <StatBar label="Power" value={char.stat_power} color={color} isVisible={visible} />
        <StatBar label="Speed" value={char.stat_speed} color={color} isVisible={visible} />
        <StatBar label="Control" value={char.stat_control} color={color} isVisible={visible} />
      </div>

      <div className="author-block">
        <span style={{ color: color, fontWeight: 700 }}>{char.real_author}</span>
        {' '}({char.real_author_years})
        <br />
        {char.author_note}
      </div>

      <div
        className="kanji-bg"
        style={{
          fontSize: 75,
          bottom: -14,
          right: -6,
        }}
        aria-hidden="true"
      >
        {kanji}
      </div>
    </div>
  )
}

export { CharCard as CharacterCard }
