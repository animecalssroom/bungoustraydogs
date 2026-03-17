'use client'

import React, { useEffect, useState } from 'react'
import type { FactionWar } from '@/backend/types'
import { createClient } from '@/frontend/lib/supabase/client'
import styles from './WarStrip.module.css'

interface WarStripProps {
  war: FactionWar
  userFaction: string
  onRetreat?: (warId: string) => Promise<void>
  canManageWar?: boolean
}

export function WarStrip({ war, userFaction, onRetreat, canManageWar }: WarStripProps) {
  const [currentWar, setCurrentWar] = useState<FactionWar>(war)
  const [timeLeft, setTimeLeft] = useState('')
  const [loadingRetreat, setLoadingRetreat] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setCurrentWar(war)
  }, [war])

  useEffect(() => {
    // Polling for point updates (reduces expensive Realtime connections)
    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }
      const { data } = await supabase
        .from('faction_wars')
        .select('id, faction_a_id, faction_b_id, faction_a_points, faction_b_points, status, ends_at, stakes, stakes_detail')
        .eq('id', war.id)
        .single()
      
      if (data) {
        setCurrentWar(data as FactionWar)
      }
    }

    const interval = setInterval(poll, 60000)
    
    return () => clearInterval(interval)
  }, [war.id, supabase])

  useEffect(() => {
    const timer = setInterval(() => {
      const endsAt = new Date(currentWar.ends_at!).getTime()
      const now = new Date().getTime()
      const diff = endsAt - now

      if (diff <= 0) {
        setTimeLeft('ENDED')
        clearInterval(timer)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [currentWar.ends_at])

  const totalPoints = currentWar.faction_a_points + currentWar.faction_b_points
  const pA = totalPoints > 0 ? (currentWar.faction_a_points / totalPoints) * 100 : 50
  const pB = 100 - pA

  return (
    <div className={styles.strip}>
      <div className={styles.warMeta}>
        <div className={styles.statusGroup}>
          <span className={styles.activeLabel}>WAR ACTIVE</span>
          {currentWar.status === 'day2' && <span className={styles.escalationLabel}>DAY 2: TAG TEAM UNLOCKED</span>}
          {currentWar.status === 'day3' && <span className={styles.climaxLabel}>DAY 3: BOSS FIGHT ACTIVE</span>}
        </div>
        <span className={styles.timer}>{timeLeft} remaining</span>
      </div>

      <div className={styles.battleLine}>
        <div className={styles.factionLabel}>
          <span className={styles.factionName}>{currentWar.faction_a_id.toUpperCase()}</span>
          <span className={styles.points}>{currentWar.faction_a_points} pts</span>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.barA} style={{ width: `${pA}%` }} />
          <div className={styles.barB} style={{ width: `${pB}%` }} />
        </div>

        <div className={styles.factionLabel}>
          <span className={styles.points}>{currentWar.faction_b_points} pts</span>
          <span className={styles.factionName}>{currentWar.faction_b_id.toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.stakes}>
        <div className={styles.stakeInfo}>
          Stakes: <span className={styles.stakeDetail}>{currentWar.stakes_detail?.description || currentWar.stakes}</span>
        </div>
        {canManageWar && (
          <button
            type="button"
            className={styles.retreatBtn}
            disabled={loadingRetreat}
            onClick={async () => {
              if (confirm('RETREAT: Are you sure? Surrendering will forfeit the stakes to the enemy.')) {
                setLoadingRetreat(true)
                try {
                  if (onRetreat) await onRetreat(currentWar.id)
                } finally {
                  setLoadingRetreat(false)
                }
              }
            }}
          >
            {loadingRetreat ? 'RETREATING...' : 'TREATY / RETREAT'}
          </button>
        )}
      </div>
    </div>
  )
}
