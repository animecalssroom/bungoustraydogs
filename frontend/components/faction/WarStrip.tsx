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
  const [integrity, setIntegrity] = useState<number>(war.integrity ?? 50)
  const supabase = createClient()

  useEffect(() => {
    setCurrentWar(war)
    setIntegrity(war.integrity ?? 50)
  }, [war])

  useEffect(() => {
    // Polling for point updates (reduces expensive Realtime connections)
    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }
      const feedResult = await fetch(`/api/war/experience?warId=${war.id}&mode=feed`, {
        cache: 'no-store',
      })

      if (feedResult.ok) {
        const payload = await feedResult.json().catch(() => null)
        if (payload?.war) {
          setCurrentWar(payload.war as FactionWar)
        }
        if (typeof payload?.integrity === 'number') {
          setIntegrity(payload.integrity)
        }
      }
    }

    void poll()
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

  const attackerPressure = Math.max(0, Math.min(100, 100 - integrity))
  const defenderHold = Math.max(0, Math.min(100, integrity))
  const opponentFaction =
    currentWar.faction_a_id === userFaction ? currentWar.faction_b_id : currentWar.faction_a_id
  const contestedLabel = currentWar.stakes_detail?.description || currentWar.stakes
  const districtLabel = contestedLabel.replace(/^Control of\s+/i, '')

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

      <div className={styles.conflictBanner}>
        <span className={styles.conflictLead}>IN WAR WITH {opponentFaction.toUpperCase()}</span>
        <span className={styles.conflictDivider}>OVER</span>
        <span className={styles.conflictTarget}>{districtLabel.toUpperCase()}</span>
      </div>

      {currentWar.war_message ? (
        <p className={styles.warMessage}>{currentWar.war_message}</p>
      ) : null}

      <div className={styles.battleLine}>
        <div className={styles.factionLabel}>
          <span className={styles.factionName}>{currentWar.faction_a_id.toUpperCase()}</span>
          <span className={styles.points}>{attackerPressure}% pressure</span>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.barA} style={{ width: `${attackerPressure}%` }} />
          <div className={styles.barB} style={{ width: `${defenderHold}%` }} />
        </div>

        <div className={styles.factionLabel}>
          <span className={styles.points}>{defenderHold}% hold</span>
          <span className={styles.factionName}>{currentWar.faction_b_id.toUpperCase()}</span>
        </div>
      </div>

      <div className={styles.stakes}>
        <div className={styles.stakeInfo}>
          Stakes: <span className={styles.stakeDetail}>{currentWar.stakes_detail?.description || currentWar.stakes}</span>
          {' · '}
          Clash score: <span className={styles.stakeDetail}>{currentWar.faction_a_points} - {currentWar.faction_b_points}</span>
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
