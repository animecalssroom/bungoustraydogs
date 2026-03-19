'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sword, Target as TargetIcon, Shield, Activity, Info, ChevronRight, User, AlertTriangle, Zap, Clock } from 'lucide-react'
import type { District } from '@/backend/models/district.model'
import { FACTION_META } from '@/frontend/lib/launch'
import { DISTRICTS } from '@/frontend/lib/data/districts.data'
import type { FactionWar } from '@/backend/types'
import { useState, useEffect, useCallback } from 'react'
import type { FactionId } from '@/backend/types'

export interface StrikeLaunchPayload {
  warId: string | null
  targets: WarTarget[]
  specialLocked: boolean
  mustTargetGuards: boolean
}

interface SectorPanelProps {
  district: District | null
  allDistricts: District[]
  onStrikeClick: (payload: StrikeLaunchPayload) => void
  onClose?: () => void
  activeWar: FactionWar | null
}

interface WarRosterEntry {
  user_id: string
  username: string | null
  faction: string | null
  rank: number | null
  character_name: string | null
  class_tag: string | null
  character_slug: string | null
  deployment_role: 'guard' | 'vanguard' | null
  stance: string | null
  is_recovering: boolean
  is_guard: boolean
  isEncrypted: boolean
}

interface WarTarget {
  user_id: string
  username: string | null
  character_name: string | null
  rank: number | null
  faction: string | null
  is_guard: boolean
  isEncrypted: boolean
}

interface WarExperiencePayload {
  integrity: number
  transmissions: any[]
  isRevealed: boolean
  deployment: { role: 'guard' | 'vanguard'; stance: string; deployedAt: string } | null
  isRecovering: boolean
  class_tag: string
  character_slug: string | null
  userFaction: FactionId | null
  canRecon: boolean
  abilitySummary: string
  specialLocked: boolean
  specialLockedReason: string | null
  mustTargetGuards: boolean
  reconFields: string[]
  roster: WarRosterEntry[]
  targets: WarTarget[]
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

function isValidWarId(value: string | null | undefined): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  )
}

export function SectorPanel({
  district,
  allDistricts,
  onStrikeClick,
  onClose,
  activeWar,
}: SectorPanelProps) {
  const [showRecon, setShowRecon] = useState(false)
  const [showFieldHospital, setShowFieldHospital] = useState(false)
  const [warExp, setWarExp] = useState<WarExperiencePayload | null>(null)
  const [isLoadingWarExp, setIsLoadingWarExp] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const refreshWarExp = useCallback(async () => {
    if (!activeWar || !district || !isValidWarId(activeWar.id)) return
    if (typeof document !== 'undefined' && document.hidden) return

    try {
      setIsLoadingWarExp(true)
      const res = await fetch(`/api/war/experience?warId=${activeWar.id}&districtId=${district.id}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (res.ok) {
        setWarExp(data)
      }
    } catch (err) {
      console.error('Failed to fetch war exp:', err)
    } finally {
      setIsLoadingWarExp(false)
    }
  }, [activeWar?.id, district?.id])

  useEffect(() => {
    setWarExp(null)
    setDeployError(null)
    setShowFieldHospital(false)
    if (activeWar && district && isValidWarId(activeWar.id)) {
      setIsLoadingWarExp(true)
      void refreshWarExp()
      return
    }
    setIsLoadingWarExp(false)
  }, [activeWar?.id, district?.id, refreshWarExp])

  useEffect(() => {
    if (!activeWar || !district || !isValidWarId(activeWar.id)) return
    const interval = window.setInterval(() => { void refreshWarExp() }, 30000)
    return () => window.clearInterval(interval)
  }, [activeWar?.id, district?.id, refreshWarExp])

  useEffect(() => { setShowRecon(false) }, [district?.id])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleDeploy = async (role: 'guard' | 'vanguard') => {
    if (!activeWar || !isValidWarId(activeWar.id)) return
    setIsDeploying(true)
    setDeployError(null)
    
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
        const payload = await res.json().catch(() => ({}))
        setDeployError(payload?.error ?? 'Deployment failed.')
        console.error('[war deploy]', payload)
        // Rollback on failure
        setWarExp(prevExp)
      } else {
        await refreshWarExp()
      }
    } catch (err) {
      setDeployError('Deployment failed.')
      setWarExp(prevExp)
    } finally {
      setIsDeploying(false)
    }
  }
  const handleRecon = async () => {
    if (!activeWar || !district || !isValidWarId(activeWar.id)) return
    try {
      const res = await fetch('/api/war/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, districtId: district.id })
      })
      if (res.ok) {
        setShowRecon(true)
        await refreshWarExp()
      }
    } catch (err) {
      console.error('Recon failed:', err)
    }
  }

  const handleRevive = async (targetId: string) => {
    if (!activeWar || !isValidWarId(activeWar.id)) return
    try {
      const res = await fetch('/api/war/revive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, targetUserId: targetId })
      })
      if (res.ok) {
        await refreshWarExp()
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
  const hasLoadedWarExp = !hasActiveWar || !!warExp
  const isParticipant = !!activeWar && !!warExp?.userFaction && (activeWar.faction_a_id === warExp.userFaction || activeWar.faction_b_id === warExp.userFaction)
  const isDeployed = !!warExp?.deployment
  const isRecovering = !!warExp?.isRecovering
  const isAttacker = activeWar?.faction_a_id === warExp?.userFaction
  const isDefender = activeWar?.faction_b_id === warExp?.userFaction

  const enemyFactionId = isAttacker ? activeWar?.faction_b_id : activeWar?.faction_a_id
  const roster = warExp?.roster ?? []
  const alliedRoster = roster.filter((entry) => entry.faction === warExp?.userFaction)
  const enemyRoster = roster.filter((entry) => entry.faction === enemyFactionId)
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

          {warExp?.abilitySummary && (
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-sm">
              <p className="text-[0.65rem] text-amber-500/80 font-black uppercase tracking-[0.2em] mb-2">
                ACTIVE WAR ABILITY
              </p>
              <p className="text-[0.8rem] text-white/70 leading-relaxed">
                {warExp.abilitySummary}
              </p>
            </div>
          )}

          {/* Deployment Status */}
          {hasActiveWar && isDeployed && (
            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-sm">
              <p className="text-[0.7rem] text-blue-400 font-black tracking-widest uppercase mb-1">Current Assignment</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase">
                  {warExp?.deployment?.role === 'guard' 
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
            <p className="text-[0.7rem] text-white/20 font-black tracking-[0.4em] uppercase">---[ DEPLOYED_OPERATIVES ]---</p>
            {warExp?.mustTargetGuards && (
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-sm text-[0.6rem] text-amber-300 uppercase tracking-[0.18em]">
                Enemy guards are holding the line. Vanguard units must clear them before striking open targets.
              </div>
            )}
            {warExp?.specialLocked && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-sm text-[0.6rem] text-red-300 uppercase tracking-[0.18em]">
                {warExp.specialLockedReason}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[0.6rem] text-blue-400/70 uppercase tracking-[0.25em] font-black">ALLIED FORMATION</p>
                {alliedRoster.length > 0 ? alliedRoster.map((entry) => (
                  <div key={entry.user_id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[0.6rem] font-bold border border-white/10">
                        {(entry.username || entry.character_name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.75rem] font-black tracking-wider text-white">
                          @{(entry.username || entry.character_name || 'ALLY').toUpperCase()}
                        </span>
                        <span className="text-[0.55rem] text-white/30 uppercase tracking-[0.2em] font-medium font-mono">
                          {(entry.deployment_role || 'OPERATIVE').toUpperCase()} · {(entry.class_tag || 'UNKNOWN').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {warExp?.class_tag === 'SUPPORT' && entry.is_recovering && (
                      <button
                        onClick={() => handleRevive(entry.user_id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-[0.7rem] font-bold uppercase tracking-widest rounded-sm"
                      >
                        HEAL
                      </button>
                    )}
                  </div>
                )) : (
                  <p className="py-4 text-center text-[0.7rem] text-white/20 uppercase tracking-widest italic border border-dashed border-white/10">
                    No allied units deployed.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[0.6rem] text-red-400/70 uppercase tracking-[0.25em] font-black">
                  {isAttacker ? 'DISTRICT_GARRISON' : 'HOSTILE_STRIKE_FORCE'}
                </p>
                {enemyRoster.length > 0 ? enemyRoster.map((entry) => (
                  <div key={entry.user_id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-sm">
                    <div className="flex items-center gap-3">
                      {entry.isEncrypted ? <EncryptedAvatar /> : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[0.6rem] font-bold border border-white/10">
                          {(entry.username || entry.character_name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className={`text-[0.75rem] font-black tracking-wider ${entry.isEncrypted ? 'text-blue-400 animate-pulse' : 'text-white'}`}>
                          {entry.isEncrypted ? '[ ENCRYPTED_SIG ]' : `@${(entry.username || entry.character_name || 'HOSTILE').toUpperCase()}`}
                        </span>
                        <span className="text-[0.55rem] text-white/20 uppercase tracking-[0.2em] font-medium font-mono">
                          {entry.isEncrypted
                            ? 'DECRYPTION_REQUIRED'
                            : `${(entry.deployment_role || 'OPERATIVE').toUpperCase()} · ${(entry.class_tag || 'UNKNOWN').toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                    {entry.is_recovering && (
                      <span className="text-[0.55rem] px-2 py-1 border border-red-500/30 text-red-400 uppercase tracking-[0.2em]">
                        DOWN
                      </span>
                    )}
                  </div>
                )) : (
                  <p className="py-4 text-center text-[0.7rem] text-white/20 uppercase tracking-widest italic border border-dashed border-white/10">
                    No hostile units deployed.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 bg-[#050505]">

        {/* Action Controls */}
        <div className="p-4 bg-black/50">
          {isLoadingWarExp && hasActiveWar && (
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
              {deployError && (
                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-sm text-[0.6rem] text-red-300 uppercase tracking-[0.18em]">
                  {deployError}
                </div>
              )}
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

          {hasLoadedWarExp && !isDeployed && hasActiveWar && !isParticipant && !isRecovering && (
             <div className="w-full py-4 bg-white/5 text-white/20 font-black text-[0.65rem] uppercase tracking-widest rounded-sm border border-white/5 text-center px-4 leading-relaxed">
               YOUR FACTION IS NOT ENGAGED IN THIS CONFLICT.<br/>
               <span className="text-[0.5rem] opacity-50">OBSERVATION MODE ONLY.</span>
             </div>
          )}

          {isDeployed && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {warExp?.deployment?.role === 'vanguard' && hasActiveWar ? (
                  <button
                    disabled={isRecovering || (warExp?.targets?.length ?? 0) === 0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStrikeClick({
                        warId: isValidWarId(activeWar?.id) ? activeWar.id : null,
                        targets: warExp?.targets ?? [],
                        specialLocked: Boolean(warExp?.specialLocked),
                        mustTargetGuards: Boolean(warExp?.mustTargetGuards),
                      })
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all active:scale-95 border-b-4 border-red-900 disabled:opacity-50 disabled:grayscale"
                  >
                    <TargetIcon className="w-4 h-4" />
                    <span>
                      {(warExp?.targets?.length ?? 0) > 0
                        ? (isAttacker ? 'COMMENCE ASSAULT' : 'INITIATE INTERCEPTION')
                        : 'NO ACTIVE TARGETS'}
                    </span>
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
                {warExp?.canRecon && (
                  <button
                    disabled={isRecovering || warExp?.isRevealed}
                    onClick={(e) => { e.stopPropagation(); handleRecon() }}
                    className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 font-black text-[0.8rem] uppercase tracking-widest rounded-sm border border-amber-500/30 disabled:opacity-50"
                  >
                    {warExp?.isRevealed ? '[ RECON ] SECTOR DECRYPTED' : '[ RECON ] DECRYPT SECTOR'}
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


