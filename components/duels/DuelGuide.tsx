'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDuelCharacterRule } from '@/lib/duels/characters'

type DuelGuideVariant = 'hub' | 'active'

const HUB_POINTS = [
  'Search a player from another faction and send a challenge.',
  'They must accept from Duel Inbox before the fight begins.',
  'A round resolves only after both players submit a move.',
  'Each round has a 15-minute deadline before the registry auto-closes it.',
  'Bots usually accept immediately and answer faster than players.',
  'Unassigned files may duel, but Special stays locked until a character is confirmed.',
]

const ACTIVE_POINTS = [
  'Strike is your safest reliable damage option.',
  'Stance lowers incoming damage and buys time.',
  'Gambit is swingy — if it lands it hits hard, if it fails it deals nothing.',
  'Recover restores 20 HP, but cannot be used two rounds in a row.',
  'Gambit is limited to 2 uses per duel. Special to 1.',
  'Special belongs to your file only. An opponent having a character does not unlock yours.',
]

// ── Character rule card ────────────────────────────────────────────────────
function CharacterRuleCard({
  name,
  rule,
  hasAssignedCharacter,
  isSelf,
}: {
  name: string
  rule: ReturnType<typeof getDuelCharacterRule>
  hasAssignedCharacter?: boolean
  isSelf: boolean
}) {
  return (
    <div
      style={{
        padding: '0.8rem 1rem',
        border: '1px solid #d4c5b3',
        borderRadius: '2px',
        display: 'grid',
        gap: '0.6rem',
        background: isSelf ? '#ffffff' : 'rgba(255,255,255,0.4)',
        boxShadow: isSelf ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Blueprint/Watermark effect */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        fontSize: '2rem',
        opacity: 0.03,
        pointerEvents: 'none',
        transform: 'rotate(15deg)',
        fontFamily: 'serif'
      }}>
        {isSelf ? 'CONFIDENTIAL' : 'SURVEILLANCE'}
      </div>

      <div
        className="font-cinzel"
        style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4a433a', display: 'flex', alignItems: 'center' }}
      >
        <span style={{ borderBottom: '2px solid #d4c5b3', paddingBottom: '2px' }}>{name}</span>
        {isSelf && (
          <span
            className="font-space-mono"
            style={{
              fontSize: '0.45rem',
              letterSpacing: '0.12em',
              color: '#9b2c2c',
              marginLeft: '0.75rem',
              textTransform: 'uppercase',
              border: '1px solid #9b2c2c',
              padding: '1px 4px',
              borderRadius: '2px',
            }}
          >
            Designation Verified
          </span>
        )}
      </div>

      {rule ? (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <p
            className="font-cormorant"
            style={{ margin: 0, color: '#2a2a2a', fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.95rem' }}
          >
            <span className="font-space-mono" style={{ color: '#8b7d6b', fontStyle: 'normal', fontSize: '0.480rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Trait / Passive •{' '}
            </span>
            {rule.passive}
          </p>
          <div style={{ height: '1px', background: 'rgba(212,197,179,0.3)', width: '40%' }} />
          <p
            className="font-cormorant"
            style={{ margin: 0, color: '#2a2a2a', fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.95rem' }}
          >
            <span className="font-space-mono" style={{ color: '#9b2c2c', fontStyle: 'normal', fontSize: '0.480rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Ability / Special •{' '}
            </span>
            {rule.special}
          </p>
        </div>
      ) : (
        <p
          className="font-cormorant"
          style={{ margin: 0, color: '#8b7d6b', fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.9rem' }}
        >
          {isSelf && !hasAssignedCharacter
            ? 'Access Denied: Subject designation not yet confirmed in Registry.'
            : 'Intelligence Gap: Surveillance data unavailable for this file.'}
        </p>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function DuelGuide({
  variant,
  hasAssignedCharacter,
  ownCharacterSlug,
  ownCharacterName,
  opponentCharacterSlug,
  opponentCharacterName,
}: {
  variant: DuelGuideVariant
  hasAssignedCharacter?: boolean
  ownCharacterSlug?: string | null
  ownCharacterName?: string | null
  opponentCharacterSlug?: string | null
  opponentCharacterName?: string | null
}) {
  const [open, setOpen] = useState(false)

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem(`bsd_duel_guide_${variant}`)
    if (saved === 'open') setOpen(true)
  }, [variant])

  const toggle = () => {
    const next = !open
    setOpen(next)
    localStorage.setItem(`bsd_duel_guide_${variant}`, next ? 'open' : 'closed')
  }

  const points = variant === 'hub' ? HUB_POINTS : ACTIVE_POINTS
  const ownRule = getDuelCharacterRule(ownCharacterSlug)
  const opponentRule = getDuelCharacterRule(opponentCharacterSlug)

  return (
    <div style={{ width: '100%' }}>
      {/* Folder Tab */}
      <button
        type="button"
        onClick={toggle}
        style={{
          background: open ? '#f3eee8' : 'transparent',
          border: '1px solid #d4c5b3',
          borderBottom: open ? '1px solid #f3eee8' : '1px solid #d4c5b3',
          borderRadius: '4px 4px 0 0',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          transition: 'all 0.2s',
          marginBottom: '-1px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{open ? '📂' : '📁'}</span>
        <span
          className="font-space-mono"
          style={{
            fontSize: '0.52rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#8b7d6b',
            fontWeight: 700,
          }}
        >
          {variant === 'hub' ? 'Field Manual v1.4' : 'Active Engagement Brief'}
        </span>
        <span style={{ fontSize: '0.4rem', color: '#8b7d6b', marginLeft: '0.2rem' }}>
          {open ? '[CLOSE]' : '[EXPAND]'}
        </span>
      </button>

      <section
        style={{
          background: '#f3eee8',
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")',
          border: '1px solid #d4c5b3',
          borderRadius: '0 4px 4px 4px',
          boxShadow: open ? '0 4px 15px rgba(0,0,0,0.06)' : 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="guide-body"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{ padding: '1.2rem', display: 'grid', gap: '1.2rem' }}>
                {/* Guide points */}
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  <div className="font-space-mono" style={{ fontSize: '0.45rem', textTransform: 'uppercase', color: '#8b7d6b', letterSpacing: '0.1em' }}>Engagement Directives</div>
                  {points.map((line) => (
                    <div
                      key={line}
                      style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}
                    >
                      <span style={{ color: '#9b2c2c', flexShrink: 0, fontSize: '0.6rem', fontWeight: 'bold' }}>»</span>
                      <p
                        className="font-cormorant"
                        style={{
                          margin: 0,
                          fontSize: '0.98rem',
                          lineHeight: 1.6,
                          color: '#4a433a',
                          fontStyle: 'italic',
                        }}
                      >
                        {line}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Unassigned warning */}
                {variant === 'active' && !hasAssignedCharacter && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px dashed #9b2c2c',
                      background: 'rgba(155,44,44,0.03)',
                      borderRadius: '2px'
                    }}
                  >
                    <p
                      className="font-cormorant"
                      style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        color: '#9b2c2c',
                        fontStyle: 'italic',
                        fontWeight: 600
                      }}
                    >
                      URGENT: Subject designation unconfirmed. Standard engagement protocols (Strike, Stance, Gambit, Recover) are enforced until identity lock.
                    </p>
                  </div>
                )}

                {/* Matchup notes */}
                {variant === 'active' && (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div
                      className="font-space-mono"
                      style={{
                        fontSize: '0.45rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#8b7d6b',
                      }}
                    >
                      Subject Intel Dossier
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      <CharacterRuleCard
                        name={ownCharacterName ?? 'Primary Subject'}
                        rule={ownRule}
                        hasAssignedCharacter={hasAssignedCharacter}
                        isSelf={true}
                      />
                      <CharacterRuleCard
                        name={opponentCharacterName ?? 'Opposing File'}
                        rule={opponentRule}
                        isSelf={false}
                      />
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'right' }}>
                  <span className="font-space-mono" style={{ fontSize: '0.4rem', color: '#8b7d6b', opacity: 0.4, letterSpacing: '0.2em' }}>PROPERTY OF SPECIAL OPERATIONS DIVISION</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
