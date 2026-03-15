'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/frontend/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { playSound } from '@/frontend/lib/sounds'
import styles from './FactionPrivateSpace.module.css'
import type { FactionWar, Profile, OpenChallenge } from '@/backend/types'
import { FACTION_META, getCharacterReveal } from '@/frontend/lib/launch'

interface FactionWarTargetsProps {
  war: FactionWar
  userFaction: string
  viewerId: string
}

type TargetProfile = Pick<Profile, 'id' | 'username' | 'faction' | 'character_name' | 'character_match_id' | 'last_seen' | 'rank'>

export function FactionWarTargets({ war, userFaction, viewerId }: FactionWarTargetsProps) {
  const supabase = useMemo(() => createClient(), [])
  const [targets, setTargets] = useState<TargetProfile[]>([])
  const [openChallenges, setOpenChallenges] = useState<OpenChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const enemyFactionId = war.faction_a_id === userFaction ? war.faction_b_id : war.faction_a_id
  const enemyMeta = FACTION_META[enemyFactionId as keyof typeof FACTION_META]

  const loadTargets = async () => {
    setLoading(true)
    try {
      const [profilesRes, challengesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, faction, character_name, character_match_id, last_seen, rank')
          .eq('faction', enemyFactionId)
          .in('role', ['member', 'mod'])
          .order('last_seen', { ascending: false })
          .limit(10),
        supabase
          .from('open_challenges')
          .select('*')
          .eq('faction', enemyFactionId)
          .eq('status', 'open')
          .gt('expires_at', new Date().toISOString())
          .limit(5)
      ])

      if (profilesRes.data) setTargets(profilesRes.data)
      if (challengesRes.data) setOpenChallenges(challengesRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTargets()

    // Realtime for open challenges
    const challengeChannel = supabase
      .channel(`war-targets-challenges-${war.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'open_challenges',
        filter: `faction=eq.${enemyFactionId}`
      }, () => {
        void loadTargets()
      })
      .subscribe()

    return () => {
        void supabase.removeChannel(challengeChannel)
    }
  }, [enemyFactionId, supabase, war.id])

  const handleQuickChallenge = async (targetId: string, message?: string) => {
    setBusyId(targetId)
    try {
      const res = await fetch('/api/duels/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defender_id: targetId, message: message || 'War Strike initiated.' })
      })
      
      const json = await res.json()
      if (res.ok) {
        await playSound('stamp')
        // The GlobalDuelMatchmaker will handle the navigation to the duel page
      } else {
        alert(json.error || 'Failed to initiate strike.')
      }
    } finally {
      setBusyId(null)
    }
  }

  const handleAcceptOpen = async (challengeId: string) => {
    setBusyId(challengeId)
    try {
      const res = await fetch('/api/duels/accept-open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_challenge_id: challengeId })
      })
      
      const json = await res.json()
      if (res.ok) {
        await playSound('stamp')
        if (json.duel_id) window.location.href = `/duels/${json.duel_id}`
      } else {
        alert(json.error || 'Failed to intercept challenge.')
      }
    } finally {
      setBusyId(null)
    }
  }

  if (loading && targets.length === 0) {
    return <div className={styles.empty}>Scouting the frontline...</div>
  }

  return (
    <div className={styles.strikeCommand}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Strike Command</span>
        <span className={styles.sectionMeta}>Active Frontline: {enemyMeta?.name || enemyFactionId}</span>
      </div>

      <div className={styles.targetGrid}>
        {openChallenges.length > 0 && (
          <div className={styles.openThreats}>
            <div className={styles.subHead}>Enemy Provocations</div>
            {openChallenges.map(oc => (
              <div key={oc.id} className={styles.strikeCard} style={{ borderColor: 'var(--color-dogs)' }}>
                <div className={styles.strikeInfo}>
                  <div className={styles.strikeName}>{oc.character_name || 'Unknown Operative'}</div>
                  <div className={styles.strikeMsg}>"{oc.message || 'No message...'}"</div>
                </div>
                <button 
                  className={styles.strikeBtn} 
                  disabled={!!busyId}
                  onClick={() => handleAcceptOpen(oc.id)}
                >
                  {busyId === oc.id ? 'Intercepting...' : 'INTERCEPT'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.activeTargets}>
          <div className={styles.subHead}>High Value Targets</div>
          {targets.filter(t => t.id !== viewerId).length === 0 ? (
            <div className={styles.empty}>No visible targets in range.</div>
          ) : (
            targets.filter(t => t.id !== viewerId).map(target => {
              const character = getCharacterReveal(target.character_match_id)
              const isOnline = target.last_seen && (Date.now() - new Date(target.last_seen).getTime() < 15 * 60 * 1000)
              
              return (
                <div key={target.id} className={styles.strikeCard}>
                  <div className={styles.strikeInfo}>
                    <div className={styles.strikeName}>
                      {isOnline && <span className={styles.onlineDot} style={{ marginRight: '8px' }} />}
                      {character?.name || target.username}
                    </div>
                    <div className={styles.strikeRank}>{target.rank ? `Rank ${target.rank}` : 'Operative'}</div>
                  </div>
                  <button 
                    className={styles.strikeBtn}
                    disabled={!!busyId}
                    onClick={() => handleQuickChallenge(target.id)}
                  >
                    {busyId === target.id ? 'Initiating...' : 'STRIKE'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
