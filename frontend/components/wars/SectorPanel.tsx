'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sword, Target as TargetIcon, Shield, Activity, Info, ChevronRight, User, AlertTriangle, Zap, Clock } from 'lucide-react'
import type { District } from '@/backend/models/district.model'
import { FACTION_META } from '@/frontend/lib/launch'
import { DISTRICTS } from '@/frontend/lib/data/districts.data'
import type { FactionWar } from '@/backend/types'
import { useState, useEffect } from 'react'
import type { FactionId } from '@/backend/types'

interface SectorPanelProps {
  district: District | null
  allDistricts: District[]
  onStrikeClick: () => void
  onClose?: () => void
  activeWar: FactionWar | null
  topContributors?: { user_id: string; username: string; rank: number; points: number; faction: string }[]
  onFactionSync?: (factionId: FactionId) => void
}

const EncryptedAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative">
    <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
    <Activity className="w-3 h-3 text-white/20 animate-spin-slow" />
  </div>
)

const SLUG_ALIASES: Record<string, string> = {
  harbor: 'yokohama-port',
  'harbor-district': 'yokohama-port',
  standard_island: 'yokohama-port',
  'standard-island': 'yokohama-port',
  harbour: 'yokohama-port',
  waterfront: 'minato-mirai',
  tsurumi: 'tsurumi-district',
  honmoku: 'honmoku-area',
  kannai: 'kannai-center',
  northern_wards: 'northern-wards',
  suribachi: 'suribachi-city',
}

function resolveDistrictData(slug: string) {
  const normalised = SLUG_ALIASES[slug] ?? slug
  return (
    DISTRICTS.find((d) => d.id === normalised) ??
    DISTRICTS.find((d) => d.id.includes(normalised) || normalised.includes(d.id))
  )
}

function safeIntegrity(current?: number | null, required?: number | null): number {
  if (!required || required <= 0) return 100
  if (!current || current <= 0) return 0
  return Math.min(100, Math.floor((current / required) * 100))
}

export function SectorPanel({
  district,
  allDistricts,
  onStrikeClick,
  onClose,
  activeWar,
  topContributors = [],
  onFactionSync,
}: SectorPanelProps) {
  const [showRecon, setShowRecon] = useState(false)
  const [showFieldHospital, setShowFieldHospital] = useState(false)
  const [isStriking, setIsStriking] = useState(false)
  const [warExp, setWarExp] = useState<{ integrity: number, transmissions: any[], isRevealed: boolean, deployment: any, isRecovering: boolean, class_tag: string, userFaction: FactionId | null } | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)

  useEffect(() => {
    if (activeWar && district) {
      setWarExp(null) // Reset on district change to avoid stale data
      fetch(`/api/war/experience?warId=${activeWar.id}&districtId=${district.id}`)
        .then(res => res.json())
        .then(data => {
          setWarExp(data)
          if (data.userFaction && onFactionSync) onFactionSync(data.userFaction)
        })
        .catch(err => console.error('Failed to fetch war exp:', err))
    }
  }, [activeWar?.id, district?.id])

  useEffect(() => { setShowRecon(false) }, [district?.id])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleDeploy = async (role: 'guard' | 'vanguard') => {
    if (!activeWar) return
    setIsDeploying(true)
    
    // Optimistic Update
    const prevExp = warExp
    setWarExp(prev => prev ? {
      ...prev,
      deployment: { role, stance: 'tactical', deployedAt: new Date().toISOString() }
    } : null)

    try {
      const res = await fetch('/api/war/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, role, stance: 'tactical' })
      })
      if (!res.ok) {
        // Rollback on failure
        setWarExp(prevExp)
      }
    } catch (err) {
      setWarExp(prevExp)
    } finally {
      setIsDeploying(false)
    }
  }
  const handleRecon = async () => {
    if (!activeWar || !district) return
    try {
      const res = await fetch('/api/war/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, districtId: district.id })
      })
      if (res.ok) {
        setShowRecon(true)
        // Refresh exp if needed
      }
    } catch (err) {
      console.error('Recon failed:', err)
    }
  }

  const handleRevive = async (targetId: string) => {
    if (!activeWar) return
    try {
      const res = await fetch('/api/war/revive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, targetUserId: targetId })
      })
      if (res.ok) {
        // Refresh exp
        const updated = await fetch(`/api/war/experience?warId=${activeWar.id}`).then(r => r.json())
        setWarExp(updated)
      }
    } catch (err) {
      console.error('Revive failed:', err)
    }
  }

  // ── Empty state ──────────────────────────────────────────────
  if (!district) {
    return (
      <div className="h-full flex flex-col p-6 bg-[#0a0a0a] border-l border-[#222] font-space-mono">
        <div className="mb-8">
          <p className="text-[0.7rem] text-[#666] tracking-[0.3em] mb-2 uppercase">Intelligence Terminal</p>
          <h2 className="font-cinzel text-2xl text-white">Yokohama <em>Sectors</em></h2>
          <div className="h-px w-full bg-gradient-to-r from-amber-500/50 to-transparent mt-4" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 gap-4">
          <Info className="w-12 h-12 text-[#444]" />
          <p className="text-[0.9rem] uppercase tracking-widest leading-relaxed max-w-[200px]">
            Select a sector on the tactical map to initialize data synchronization.
          </p>
        </div>
      </div>
    )
  }

  // ── Data ─────────────────────────────────────────────────────
  const staticData = resolveDistrictData(district.slug)
  const factionId = (district.controlling_faction || staticData?.default_faction || 'neutral') as FactionId
  const faction = FACTION_META[factionId]
  const integrity = warExp?.integrity ?? safeIntegrity(district.current_points, district.points_required)
  const hasActiveWar = !!activeWar
  const isParticipant = !!activeWar && !!warExp?.userFaction && (activeWar.faction_a_id === warExp.userFaction || activeWar.faction_b_id === warExp.userFaction)
  const isDeployed = !!warExp?.deployment
  const isRecovering = !!warExp?.isRecovering
  const isAttacker = activeWar?.faction_a_id === warExp?.userFaction
  const isDefender = activeWar?.faction_b_id === warExp?.userFaction

  const enemyFactionId = isAttacker ? activeWar?.faction_b_id : activeWar?.faction_a_id

  // District Reveal Logic (Fog of War)
  // Only attackers (Strike Force) encounter the fog on the Garrison.
  // Defenders (Garrison/Interceptors) can see the intruders clearly.
  const isTargetEncrypted = (tg: any) => {
    if (!hasActiveWar) return false
    if (isDefender) return false // Defenders see attackers
    if (warExp?.isRevealed) return false // Recon active
    if (tg.faction !== enemyFactionId) return false // Allies/Neutral
    return true
  }
  const isEnemyDistrict = activeWar && district && district.controlling_faction !== warExp?.userFaction
  
  const totalPoints = (activeWar?.faction_a_points ?? 0) + (activeWar?.faction_b_points ?? 0)
  const ratioA = totalPoints > 0 ? (activeWar!.faction_a_points / totalPoints) * 100 : 50
  const threatLevel = staticData?.threat_level ?? 'HIGH'
  const threatColor =
    threatLevel === 'MAXIMUM' ? 'text-red-500' :
    threatLevel === 'EXTREME' ? 'text-red-400' :
    threatLevel === 'VERY HIGH' ? 'text-orange-400' :
    threatLevel === 'HIGH' ? 'text-yellow-500' :
    threatLevel === 'MODERATE' ? 'text-blue-400' : 'text-green-400'

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-white font-space-mono">

      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-[#050505]">
        {onClose && (
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="shrink-0 flex items-center gap-2 px-3 py-2 border border-white/30 bg-black hover:bg-white/10 hover:text-red-400 transition-all rounded-sm active:scale-90 text-white"
            title="CLOSE TERMINAL [ESC]"
          >
            <X className="w-4 h-4" />
            <span className="text-[0.75rem] font-black tracking-widest hidden sm:inline">EXIT</span>
          </button>
        )}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[0.7rem] text-amber-500 tracking-[0.4em] uppercase font-bold">
            MOD: {hasActiveWar ? 'WARZONE_SYNC' : 'INTEL_TERMINAL'}
          </span>
          <h2 className="font-cinzel text-lg md:text-xl text-white uppercase tracking-wider font-black truncate">
            {district.name}
          </h2>
          {isRecovering && (
            <span className="text-[0.7rem] text-red-500 animate-pulse font-black px-1.5 py-0.5 border border-red-500/50 w-fit">
              RECOVERY_LOCKOUT_ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="px-5 py-6 space-y-7">

          {/* Jurisdiction + Threat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-sm">
              <p className="text-[0.7rem] text-white/40 uppercase tracking-widest mb-2 font-bold">Jurisdiction</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 shrink-0 bg-black border border-white/20 flex items-center justify-center text-lg font-black"
                  style={{ color: faction?.color ?? '#444' }}
                >
                  {faction?.kanji ?? '?'}
                </div>
                <span className="text-sm font-black uppercase tracking-wider leading-tight" style={{ color: faction?.color ?? '#666' }}>
                  {faction?.name ?? 'NEUTRAL'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-red-950/10 border border-red-500/20 rounded-sm">
              <p className="text-[0.7rem] text-red-400/60 uppercase tracking-widest mb-2 font-bold">Threat</p>
              <p className={`text-base font-black tracking-tight uppercase ${threatColor}`}>
                {threatLevel.replace(' ', '_')}
              </p>
              {staticData && (
                <p className="text-[0.7rem] text-white/20 mt-1 font-mono">{staticData.real_location}</p>
              )}
            </div>
          </div>

          {/* Integrity */}
          <div className="space-y-2">
            <div className="flex justify-between text-[0.75rem] font-black uppercase tracking-widest text-white/40">
              <span>{hasActiveWar ? 'FRONT_LINE_INTEGRITY' : 'STRUCTURAL_INTEGRITY'}</span>
              <span className={integrity < 30 ? 'text-red-500' : 'text-white'}>{integrity}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${integrity}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${hasActiveWar ? 'bg-red-600' : 'bg-blue-600'}`}
              />
            </div>
          </div>

          {/* Flavour quote */}
          {staticData?.flavour_quote && (
            <div className="border-l-2 border-white/10 pl-4">
              <p className="font-cormorant text-[0.95rem] text-white/50 leading-relaxed italic">
                "{staticData.flavour_quote}"
              </p>
            </div>
          )}

          {/* Deployment Status */}
          {hasActiveWar && isDeployed && (
            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-sm">
              <p className="text-[0.7rem] text-blue-400 font-black tracking-widest uppercase mb-1">Current Assignment</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase">
                  {warExp?.deployment.role === 'guard' 
                    ? 'GARRISON' 
                    : (isAttacker ? 'STRIKE FORCE' : 'INTERCEPTOR')}
                </span>
                <span className="text-[0.7rem] px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full animate-pulse-slow">SIG_ACTIVE</span>
              </div>
            </div>
          )}

          {/* Lore */}
          <div className="space-y-3">
            <p className="text-[0.7rem] text-white/20 font-black tracking-[0.4em] uppercase">---[ INTEL_BRIEFING ]---</p>
            <p className="font-cormorant text-[1.15rem] text-white/80 leading-relaxed">
              {staticData?.lore ?? district.description ?? 'No intelligence available.'}
            </p>
          </div>

          {/* Target registry */}
          <div className="space-y-3">
            <p className="text-[0.7rem] text-white/20 font-black tracking-[0.4em] uppercase">
              ---[ {hasActiveWar ? (isAttacker ? 'DISTRICT_GARRISON' : 'HOSTILE_STRIKE_FORCE') : 'TARGET_REGISTRY'} ]---
            </p>
            <div className="space-y-2">
              {topContributors.length > 0 ? (
                topContributors.slice(0, 5).map((tg) => (
                  <div key={tg.user_id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                    <div className="flex items-center gap-3">
                      {isTargetEncrypted(tg) ? <EncryptedAvatar /> : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[0.6rem] font-bold border border-white/10">
                          {tg.username.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className={`text-[0.75rem] font-black tracking-wider ${isTargetEncrypted(tg) ? 'text-blue-400 animate-pulse' : 'text-white'}`}>
                          {isTargetEncrypted(tg) ? '[ ENCRYPTED_SIG ]' : `@${tg.username.toUpperCase()}`}
                        </span>
                        <span className="text-[0.55rem] text-white/20 uppercase tracking-[0.2em] font-medium font-mono">
                          {isTargetEncrypted(tg) ? 'DECRYPTION_REQUIRED' : (tg.rank || 'OPERATIVE')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hasActiveWar && warExp?.deployment?.role === 'vanguard' && tg.faction === enemyFactionId && !isRecovering && (
                          <button 
                          onClick={() => onStrikeClick()}
                          className={`px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-widest rounded-sm transition-all ${isTargetEncrypted(tg) ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30' : 'bg-red-700 hover:bg-red-600 text-white'}`}
                        >
                          {isAttacker ? 'ASSAULT' : 'INTERCEPT'}
                        </button>
                      )}
                      {hasActiveWar && warExp?.class_tag === 'SUPPORT' && (
                          <button 
                          onClick={() => handleRevive(tg.user_id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-[0.7rem] font-bold uppercase tracking-widest rounded-sm"
                        >
                          HEAL
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-[0.8rem] text-white/20 uppercase tracking-widest italic border border-dashed border-white/10">
                  No active signatures.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 bg-[#050505]">

        {/* Action Controls */}
        <div className="p-4 bg-black/50">
          {!warExp && hasActiveWar && (
            <div className="w-full py-4 flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-sm">
               <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 border border-white/20 border-t-white rounded-full"
                />
                <span className="text-[0.6rem] text-white/40 uppercase tracking-[0.2em]">Syncing Tactical Data...</span>
            </div>
          )}

          {warExp && !isDeployed && hasActiveWar && isParticipant && !isRecovering && (
            <div className="space-y-4">
              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-sm">
                <p className="text-[0.65rem] text-amber-500/80 font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Tactical Protocol: {isAttacker ? 'SIEGE_MODE' : 'INTERCEPTION_ADVISORY'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-[0.6rem] font-bold uppercase mb-1 ${isDefender ? 'text-blue-400' : 'text-blue-500/40'}`}>
                      {isAttacker ? 'GARRISON_BREACH' : 'GARRISON_DUTY'}
                    </p>
                    <p className="text-[0.55rem] text-white/40 leading-tight">
                      {isAttacker ? 'Break the enemy wall to lower integrity.' : 'Passive defense. Hold the line to boost integrity.'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-[0.6rem] font-bold uppercase mb-1 ${isAttacker ? 'text-red-500' : 'text-red-400/60'}`}>
                      {isAttacker ? 'STRIKE_FORCE' : 'INTERCEPTOR'}
                    </p>
                    <p className="text-[0.55rem] text-white/40 leading-tight">
                      {isAttacker ? 'Aggressive assault. Higher impact, high lockout risk.' : 'Seek and engage hostile strike force members.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  disabled={isDeploying}
                  onClick={() => handleDeploy('guard')}
                  className="flex-1 py-3 bg-blue-900/50 hover:bg-blue-800 text-white font-black text-[0.8rem] uppercase tracking-widest rounded-sm border border-blue-500/30 transition-all disabled:opacity-50"
                >
                  {isAttacker ? 'DEPLOY_OBSERVER' : 'REINFORCE GARRISON'}
                </button>
                <button
                  disabled={isDeploying}
                  onClick={() => handleDeploy('vanguard')}
                  className="flex-1 py-3 bg-red-900/50 hover:bg-red-800 text-white font-black text-[0.8rem] uppercase tracking-widest rounded-sm border border-red-500/30 transition-all disabled:opacity-50"
                >
                  {isAttacker ? 'JOIN STRIKE FORCE' : 'COMMENCE INTERCEPTION'}
                </button>
              </div>
            </div>
          )}

          {!isDeployed && hasActiveWar && !isParticipant && !isRecovering && (
             <div className="w-full py-4 bg-white/5 text-white/20 font-black text-[0.65rem] uppercase tracking-widest rounded-sm border border-white/5 text-center px-4 leading-relaxed">
               YOUR FACTION IS NOT ENGAGED IN THIS CONFLICT.<br/>
               <span className="text-[0.5rem] opacity-50">OBSERVATION MODE ONLY.</span>
             </div>
          )}

          {isDeployed && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {warExp?.deployment?.role === 'vanguard' && isEnemyDistrict ? (
                  <button
                    disabled={isRecovering}
                    onClick={(e) => { e.stopPropagation(); onStrikeClick() }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all active:scale-95 border-b-4 border-red-900 disabled:opacity-50 disabled:grayscale"
                  >
                    <TargetIcon className="w-4 h-4" />
                    <span>{isAttacker ? 'COMMENCE ASSAULT' : 'INITIATE INTERCEPTION'}</span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-900/20 text-blue-400 font-black text-xs uppercase tracking-widest rounded-sm border border-blue-500/20 italic">
                    <Shield className="w-4 h-4 opacity-40" />
                    <span>
                      {warExp?.deployment?.role === 'guard' 
                        ? 'GARRISON_SIGNATURE_LOCKED' 
                        : (isAttacker ? 'STRIKE_FORCE_IDLE' : 'NO_TARGET_DETECTED')}
                    </span>
                  </div>
                )}
                <button
                  disabled={isRecovering}
                  onClick={(e) => { e.stopPropagation(); setShowRecon((v) => !v) }}
                  className="w-14 flex items-center justify-center bg-white/5 text-white/60 border border-white/10 rounded-sm hover:bg-white/10 disabled:opacity-50"
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-3">
                {warExp?.class_tag === 'INTEL' && (
                  <button
                    disabled={isRecovering}
                    onClick={(e) => { e.stopPropagation(); handleRecon() }}
                    className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 font-black text-[0.8rem] uppercase tracking-widest rounded-sm border border-amber-500/30 disabled:opacity-50"
                  >
                    [ RECON ] DECRYPT SECTOR
                  </button>
                )}
                {warExp?.class_tag === 'SUPPORT' && (
                  <button
                    disabled={isRecovering}
                    onClick={(e) => { e.stopPropagation(); setShowFieldHospital(v => !v) }}
                    className="flex-1 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-500 font-black text-[0.8rem] uppercase tracking-widest rounded-sm border border-green-500/30 disabled:opacity-50"
                  >
                    [ FIELD HOSPITAL ] ACCESS
                  </button>
                )}
              </div>
            </div>
          )}

          {!hasActiveWar && (
            <button
               disabled
               className="w-full py-4 bg-white/5 text-white/30 font-black text-[0.8rem] uppercase tracking-widest rounded-sm border border-white/10"
            >
              WAITING FOR CONFLICT SIGNATURES...
            </button>
          )}

          {isRecovering && (
             <div className="w-full py-4 bg-red-950/20 text-red-500 font-bold text-[0.6rem] uppercase tracking-widest rounded-sm border border-red-500/20 text-center">
               Incapacitated — Awaiting Stabilization
             </div>
          )}
        </div>
      </div>

    </div>
  )
}