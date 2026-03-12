'use client'

import { useState } from 'react'
import type { FactionId } from '@/backend/types'
import { useCharacters } from '@/frontend/hooks/useCharacters'
import { FACTIONS } from '@/frontend/lib/constants'
import { CharCard } from './CharCard'

export function CharGridSection() {
  const { characters, loading } = useCharacters()

  return (
    <section style={{ padding: '4rem 0' }}>
      <div className="section-wrap">
        <div className="section-head" style={{ padding: '0 0 3rem' }}>
          <p className="section-eyebrow">Ability Users · Public Files</p>
          <h2 className="section-title">
            The <em>Archived</em>
          </h2>
          <div className="ink-divider" />
        </div>
        {loading ? (
          <p
            style={{
              textAlign: 'center',
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              color: 'var(--text3)',
            }}
          >
            Loading records...
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {characters.slice(0, 6).map((char) => (
              <CharCard key={char.slug} char={char} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function CharGridFull() {
  const [activeFaction, setActiveFaction] = useState<FactionId | undefined>()
  const { characters, loading } = useCharacters(activeFaction)

  return (
    <div className="section-wrap" style={{ paddingBottom: '6rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setActiveFaction(undefined)}
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '8px 16px',
            border: '1px solid var(--border)',
            background: !activeFaction ? 'var(--accent)' : 'transparent',
            color: !activeFaction ? '#fff' : 'var(--text3)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          All
        </button>
        {FACTIONS.map((faction) => (
          <button
            key={faction.id}
            onClick={() => setActiveFaction(faction.id)}
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.55rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              padding: '8px 16px',
              border: '1px solid var(--border)',
              background: activeFaction === faction.id ? 'var(--accent)' : 'transparent',
              color: activeFaction === faction.id ? '#fff' : 'var(--text3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {faction.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading ? (
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
            color: 'var(--text3)',
          }}
        >
          Loading records...
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {characters.map((char) => (
            <CharCard key={char.slug} char={char} />
          ))}
        </div>
      )}
    </div>
  )
}
