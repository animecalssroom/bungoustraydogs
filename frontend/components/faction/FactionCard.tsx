'use client'

import Link from 'next/link'
import { useAuth } from '@/frontend/context/AuthContext'
import type { Faction } from '@/backend/types'
import { privateFactionPath } from '@/frontend/lib/launch'

function FactionCard({
  faction,
}: {
  faction: Faction
}) {
  const { profile } = useAuth()
  const isHidden = ['rats', 'decay', 'clock_tower'].includes(faction.id)
  const canEnterHub =
    profile &&
    (profile.role === 'owner' ||
      ((profile.role === 'member' || profile.role === 'mod') &&
        profile.faction === faction.id))

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'var(--card)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s ease',
        filter: isHidden ? 'grayscale(0.8) contrast(1.1)' : 'none',
        opacity: isHidden ? 0.85 : 1,
      }}
    >
      {isHidden && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        >
          <div 
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid var(--accent)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-record)',
              fontSize: '0.62rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              background: 'var(--card)',
              transform: 'rotate(-12deg)',
            }}
          >
            EXISTENCE UNCONFIRMED
          </div>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          fontFamily: 'Noto Serif JP, serif',
          fontSize: '5rem',
          fontWeight: 700,
          color: 'var(--kanji)',
          userSelect: 'none',
        }}
      >
        {faction.kanji}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
            gap: '1rem',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'Noto Serif JP, serif',
                fontSize: '0.6rem',
                fontWeight: 300,
                letterSpacing: '0.3em',
                color: 'var(--accent)',
                marginBottom: '0.4rem',
              }}
            >
              {faction.name_jp}
            </p>
            <h3
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.2,
              }}
            >
              {faction.name}
            </h3>
          </div>
          <span
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.5rem',
              color: 'var(--text3)',
            }}
          >
            {faction.member_count} active
          </span>
        </div>

        <p
          style={{
            fontFamily: 'IM Fell English, serif',
            fontSize: '0.92rem',
            color: faction.color,
            marginBottom: '0.8rem',
          }}
        >
          {faction.philosophy}
        </p>

        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: 'var(--text2)',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
          }}
        >
          {faction.description}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.5rem',
                color: 'var(--text3)',
                letterSpacing: '0.1em',
              }}
            >
              AP:{' '}
            </span>
            <span
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.55rem',
                color: 'var(--accent)',
              }}
            >
              {faction.ap.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href={`/factions/${faction.id}`}
              className="btn-secondary"
              style={{ padding: '8px 20px', fontSize: '0.55rem' }}
            >
              Open Dossier
            </Link>
            {canEnterHub && (
              <Link
                href={privateFactionPath(faction.id)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.55rem' }}
              >
                Enter Hub
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FactionStripSection() {
  return null
}

export function FactionPageGrid({
  factions,
}: {
  factions: Faction[]
}) {
  return (
    <div className="section-wrap" style={{ paddingBottom: '6rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {factions.map((faction) => (
          <FactionCard key={faction.id} faction={faction} />
        ))}
      </div>
    </div>
  )
}
