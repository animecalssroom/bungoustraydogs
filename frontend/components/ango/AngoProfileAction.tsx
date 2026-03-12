'use client'

import { useMemo, useState } from 'react'
import type { Profile } from '@/backend/types'
import { useAngo } from '@/frontend/context/AngoContext'
import { FACTION_META } from '@/frontend/lib/launch'

function scoreWidth(value: number) {
  return `${Math.max(0, Math.min(10, value)) * 10}%`
}

export function AngoProfileAction({
  profile,
  isOwnProfile,
}: {
  profile: Profile
  isOwnProfile: boolean
}) {
  const { isAngo, invite, recentlyInvited } = useAngo()
  const [transmitted, setTransmitted] = useState(false)

  const visible = isAngo && !isOwnProfile
  const scores = useMemo(
    () => ({
      power: profile.behavior_scores?.power ?? 0,
      intel: profile.behavior_scores?.intel ?? 0,
      loyalty: profile.behavior_scores?.loyalty ?? 0,
      control: profile.behavior_scores?.control ?? 0,
    }),
    [profile.behavior_scores],
  )

  if (!visible) {
    return null
  }

  const alreadySpecial = profile.faction === 'special_div'
  const alreadySent = transmitted || recentlyInvited.has(profile.id)

  return (
    <section style={{ marginTop: '3rem' }}>
      <div
        style={{
          height: '1px',
          marginBottom: '1.5rem',
          background: 'linear-gradient(90deg, transparent, rgba(139,0,0,0.35), transparent)',
        }}
      />
      <div
        style={{
          border: '1px solid rgba(139, 0, 0, 0.55)',
          background: 'rgba(14, 9, 11, 0.96)',
          color: '#efe5d7',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-space-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#b43c3c',
          }}
        >
          Special Division Registry
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
          <span>{profile.faction ? FACTION_META[profile.faction]?.name ?? profile.faction : 'Unfiled'}</span>
          <span>Rank {profile.rank}</span>
          <span>{profile.ap_total} AP</span>
          <span>{profile.character_name ?? '???'}</span>
        </div>

        <div style={{ marginTop: '1.1rem', display: 'grid', gap: '0.7rem' }}>
          {Object.entries(scores).map(([label, value]) => (
            <div key={label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#d1c3b4',
                }}
              >
                <span>{label}</span>
                <span>{value}/10</span>
              </div>
              <div style={{ marginTop: '0.35rem', height: '6px', background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: scoreWidth(value), height: '100%', background: '#8B0000' }} />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={alreadySpecial || alreadySent}
          onClick={async () => {
            const ok = await invite(profile.id, profile.username)
            if (ok) {
              setTransmitted(true)
            }
          }}
          style={{
            marginTop: '1.2rem',
            border: '1px solid #8B0000',
            background: alreadySpecial || alreadySent ? 'transparent' : '#8B0000',
            color: '#f8efe6',
            padding: '0.85rem 1rem',
            fontFamily: 'var(--font-space-mono)',
            fontSize: '0.58rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: alreadySpecial || alreadySent ? 'default' : 'pointer',
            opacity: alreadySpecial || alreadySent ? 0.7 : 1,
          }}
        >
          {alreadySpecial
            ? 'Already Designated'
            : alreadySent
              ? 'Transmitted'
              : 'Extend Designation'}
        </button>
      </div>
    </section>
  )
}
