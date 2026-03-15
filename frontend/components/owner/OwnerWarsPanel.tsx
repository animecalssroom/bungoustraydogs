'use client'

import React, { useState } from 'react'
import type { FactionWar, Faction, WarStakesType } from '@/backend/types'
import styles from './OwnerWarsPanel.module.css'

interface OwnerWarsPanelProps {
  activeWar: FactionWar | null
  factions: Faction[]
  onDeclareWar: (params: any) => Promise<void>
  onTransitionDay: (warId: string, day: 'day2' | 'day3') => Promise<void>
  onActivateBoss: (warId: string) => Promise<void>
  onResolveWar: (warId: string, bossWinFaction?: string) => Promise<void>
}

export function OwnerWarsPanel({ activeWar, factions, onDeclareWar, onTransitionDay, onActivateBoss, onResolveWar }: OwnerWarsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    factionA: '',
    factionB: '',
    stakes: 'district' as WarStakesType,
    stakesDetail: '',
    warMessage: ''
  })

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onDeclareWar(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>War Cabinet</h2>

      {activeWar ? (
        <div className={styles.activeWarCard}>
          <div className={styles.warHeader}>
            <span className={styles.statusBadge}>{activeWar.status.toUpperCase()}</span>
            <h3>{activeWar.faction_a_id.toUpperCase()} vs {activeWar.faction_b_id.toUpperCase()}</h3>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <label>{activeWar.faction_a_id}</label>
              <div className={styles.pointValue}>{activeWar.faction_a_points} pts</div>
            </div>
            <div className={styles.statBox}>
              <label>{activeWar.faction_b_id}</label>
              <div className={styles.pointValue}>{activeWar.faction_b_points} pts</div>
            </div>
          </div>

          <div className={styles.actions}>
            {activeWar.status === 'active' && (
              <button disabled={loading} onClick={() => onTransitionDay(activeWar.id, 'day2')}>Advance to Day 2</button>
            )}
            {activeWar.status === 'day2' && (
              <button disabled={loading} onClick={() => onTransitionDay(activeWar.id, 'day3')}>Advance to Day 3</button>
            )}
            {activeWar.status === 'day3' && !activeWar.boss_active && (
              <button className={styles.bossBtn} disabled={loading} onClick={() => onActivateBoss(activeWar.id)}>TRIGGER BOSS FIGHT</button>
            )}
            {activeWar.boss_active && (
              <div className={styles.bossWarning}>BOSS FIGHT IN PROGRESS</div>
            )}
            <button className={styles.dangerBtn} disabled={loading} onClick={() => onResolveWar(activeWar.id)}>End War (Resolve Now)</button>
          </div>
        </div>
      ) : (
        <form className={styles.declareForm} onSubmit={handleDeclare}>
          <div className={styles.formGrid}>
            <div>
              <label>Aggressor Faction</label>
              <select 
                value={formData.factionA} 
                onChange={e => setFormData({ ...formData, factionA: e.target.value })}
                required
              >
                <option value="">Select Faction</option>
                {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label>Defender Faction</label>
              <select 
                value={formData.factionB} 
                onChange={e => setFormData({ ...formData, factionB: e.target.value })}
                required
              >
                <option value="">Select Faction</option>
                {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label>Stakes</label>
              <select 
                value={formData.stakes} 
                onChange={e => setFormData({ ...formData, stakes: e.target.value as WarStakesType })}
              >
                <option value="district">District Control</option>
                <option value="ap_multiplier">AP Multiplier</option>
                <option value="registry_priority">Registry Priority</option>
                <option value="narrative">Narrative Consequence</option>
              </select>
            </div>
            <div>
              <label>Stakes Detail</label>
              <input 
                type="text" 
                placeholder="e.g. Harbor District" 
                value={formData.stakesDetail}
                onChange={e => setFormData({ ...formData, stakesDetail: e.target.value })}
              />
            </div>
          </div>
          <div className={styles.fullWidth}>
            <label>Ango's Declaration</label>
            <textarea 
              rows={3} 
              placeholder="War declaration message..." 
              value={formData.warMessage}
              onChange={e => setFormData({ ...formData, warMessage: e.target.value })}
              required
            />
          </div>
          <button type="submit" className={styles.declareBtn} disabled={loading}>
            {loading ? 'DECLARING...' : 'DECLARE WAR'}
          </button>
        </form>
      )}
    </div>
  )
}
