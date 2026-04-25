'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Sword, Target as TargetIcon, Shield, Activity, Info,
  ChevronRight, AlertTriangle, Zap, Clock,
} from 'lucide-react'
import type { District } from '@/backend/models/district.model'
import { FACTION_META } from '@/frontend/lib/launch'
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
  isParticipant: boolean
  isAttacker: boolean
  isDefender: boolean
  canRecon: boolean
  specialLocked: boolean
  specialLockedReason: string | null
  mustTargetGuards: boolean
  activeGuardCount: number
  roster: WarRosterEntry[]
  targets: WarTarget[]
  factionAId: string
  factionBId: string
  factionAPoints: number
  factionBPoints: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidWarId(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value))
}

function ClassBadge({ tag }: { tag: string | null }) {
  const color =
    tag === 'BRUTE'   ? '#ef4444' :
    tag === 'INTEL'   ? '#3b82f6' :
    tag === 'SUPPORT' ? '#22c55e' :
    tag === 'ANOMALY' ? '#a855f7' : '#6b7280'
  return (
    <span className="text-[0.55rem] font-black font-space-mono tracking-[0.15em] px-1.5 py-0.5 border rounded-sm"
      style={{ color, borderColor: color + '44', background: color + '11' }}>
      {tag ?? '??'}
    </span>
  )
}

function RosterRow({ entry, isEnemy }: { entry: WarRosterEntry; isEnemy: boolean }) {
  return (
    <div className={`flex justify-between items-center p-3 rounded-sm border ${isEnemy ? 'border-red-500/10 bg-red-950/10' : 'border-white/5 bg-white/[0.02]'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${entry.is_recovering ? 'bg-red-500' : isEnemy ? 'bg-red-400' : 'bg-blue-400'}`} />
        <div>
          <p className="text-[0.75rem] font-black text-white">
            {entry.isEncrypted
              ? <span className="text-blue-400 animate-pulse font-mono">[ ENCRYPTED ]</span>
              : `@${(entry.username ?? entry.character_name ?? 'OPERATIVE').toUpperCase()}`}
          </p>
          <p className="text-[0.55rem] text-white/30 font-mono uppercase tracking-[0.15em]">
            {entry.is_recovering
              ? 'INCAPACITATED'
              : entry.isEncrypted
                ? 'RECON REQUIRED'
                : `${(entry.deployment_role ?? 'OPERATIVE').toUpperCase()} · ${entry.class_tag ?? '??'}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {entry.is_guard && !entry.is_recovering && (
          <span className="text-[0.5rem] px-2 py-0.5 border border-amber-500/40 text-amber-400 font-mono tracking-widest">GUARD</span>
        )}
        {entry.is_recovering && (
          <span className="text-[0.5rem] px-2 py-0.5 border border-red-500/30 text-red-400 font-mono tracking-widest">DOWN</span>
        )}
      </div>
    </div>
  )
}

export function SectorPanel({
  district,
  allDistricts,
  onStrikeClick,
  onClose,
  activeWar,
}: SectorPanelProps) {
  const [warExp, setWarExp]               = useState<WarExperiencePayload | null>(null)
  const [loading, setLoading]             = useState(false)
  const [isDeploying, setIsDeploying]     = useState(false)
  const [isReconning, setIsReconning]     = useState(false)
  const [deployError, setDeployError]     = useState<string | null>(null)

  // ── Fetch tactical data ───────────────────────────────────────
  const refreshWarExp = useCallback(async () => {
    if (!activeWar || !district || !isValidWarId(activeWar.id)) return
    if (typeof document !== 'undefined' && document.hidden) return
    try {
      setLoading(true)
      const res = await fetch(
        `/api/war/experience?warId=${activeWar.id}&districtId=${district.id}`,
        { cache: 'no-store' },
      )
      if (res.ok) {
        const data = await res.json()
        setWarExp(data)
      }
    } catch (err) {
      console.error('[SectorPanel] war exp fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }, [activeWar?.id, district?.id])

  useEffect(() => {
    setWarExp(null)
    setDeployError(null)
    if (activeWar && district && isValidWarId(activeWar.id)) void refreshWarExp()
  }, [activeWar?.id, district?.id, refreshWarExp])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!activeWar || !district || !isValidWarId(activeWar.id)) return
    const t = window.setInterval(() => void refreshWarExp(), 30000)
    return () => window.clearInterval(t)
  }, [activeWar?.id, district?.id, refreshWarExp])

  // ESC to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // ── Deploy ────────────────────────────────────────────────────
  const handleDeploy = async (role: 'guard' | 'vanguard') => {
    if (!activeWar || !isValidWarId(activeWar.id)) return
    setIsDeploying(true)
    setDeployError(null)

    // Optimistic update
    const prev = warExp
    setWarExp(w => w ? { ...w, deployment: { role, stance: 'tactical', deployedAt: new Date().toISOString() } } : null)

    try {
      const res = await fetch('/api/war/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, role, stance: 'tactical' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDeployError(data?.error ?? 'Deployment failed.')
        setWarExp(prev) // rollback
      } else {
        await refreshWarExp()
      }
    } catch {
      setDeployError('Network failure. Try again.')
      setWarExp(prev)
    } finally {
      setIsDeploying(false)
    }
  }

  // ── Recon ─────────────────────────────────────────────────────
  const handleRecon = async () => {
    if (!activeWar || !district || !isValidWarId(activeWar.id)) return
    setIsReconning(true)
    try {
      const res = await fetch('/api/war/recon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: activeWar.id, districtId: district.id }),
      })
      if (res.ok) await refreshWarExp()
    } finally {
      setIsReconning(false)
    }
  }

  // ── Empty state ───────────────────────────────────────────────
  if (!district) {
    return (
      <div className="h-full flex flex-col p-6 bg-[#0a0a0a] border-l border-[#222] font-space-mono">
        <p className="text-[0.7rem] text-[#666] tracking-[0.3em] mb-2 uppercase">Intelligence Terminal</p>
        <h2 className="font-cinzel text-2xl text-white">Select a Sector</h2>
        <div className="h-px w-full bg-gradient-to-r from-amber-500/50 to-transparent mt-4" />
        <div className="flex-1 flex items-center justify-center opacity-40">
          <p className="text-[0.9rem] uppercase tracking-widest text-center max-w-[200px]">
            Click a sector on the map to initialize data.
          </p>
        </div>
      </div>
    )
  }

  const factionId        = (district.controlling_faction || 'neutral') as FactionId
  const faction          = FACTION_META[factionId]
  const integrity        = warExp?.integrity ?? 50
  const isDeployed       = Boolean(warExp?.deployment)
  const isRecovering     = Boolean(warExp?.isRecovering)
  const isParticipant    = Boolean(warExp?.isParticipant)
  const isAttacker       = Boolean(warExp?.isAttacker)
  const isDefender       = Boolean(warExp?.isDefender)

  const alliedRoster     = (warExp?.roster ?? []).filter(r => r.faction === warExp?.userFaction)
  const enemyRoster      = (warExp?.roster ?? []).filter(r => r.faction !== warExp?.userFaction && r.faction !== null)

  const guardLabel       = isAttacker ? 'RECON OBSERVER' : 'REINFORCE GARRISON'
  const vanguardLabel    = isAttacker ? 'JOIN STRIKE FORCE' : 'COUNTER-STRIKE VANGUARD'
  const strikeLabel      = isAttacker ? 'COMMENCE ASSAULT' : 'INITIATE COUNTER-STRIKE'

  const hasTargets       = (warExp?.targets?.length ?? 0) > 0

  // Integrity bar: low = attacker winning, high = defender holding
  const attackerShare = 100 - integrity  // attacker "owns" the 0-side

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-white font-space-mono">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#050505]">
        {onClose && (
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            className="shrink-0 p-2 border border-white/20 hover:bg-white/10 hover:text-red-400 transition-all rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[0.6rem] text-amber-500 tracking-[0.4em] uppercase font-bold block">
            {activeWar ? 'WARZONE_ACTIVE' : 'INTEL_TERMINAL'}
          </span>
          <h2 className="font-cinzel text-lg text-white uppercase tracking-wider font-black truncate">
            {district.name}
          </h2>
          {isRecovering && (
            <span className="text-[0.6rem] text-red-500 animate-pulse font-black">
              RECOVERY LOCKOUT ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 space-y-6">

          {/* Current owner */}
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-sm">
            <p className="text-[0.6rem] text-white/40 uppercase tracking-widest mb-2 font-bold">Controlling Faction</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border flex items-center justify-center text-xl font-black"
                style={{ color: faction?.color ?? '#666', borderColor: (faction?.color ?? '#666') + '44' }}>
                {faction?.kanji ?? '?'}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: faction?.color ?? '#666' }}>
                  {faction?.name ?? 'NEUTRAL'}
                </p>
                <p className="text-[0.55rem] text-white/30 uppercase tracking-[0.2em]">Yokohama Jurisdiction</p>
              </div>
            </div>
          </div>

          {/* Integrity Tug-of-War */}
          <div className="space-y-3">
            <div className="flex justify-between text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">
              <span>{isAttacker ? 'SIEGE PROGRESS' : 'GARRISON STRENGTH'}</span>
              <span>{integrity}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
              <motion.div
                initial={{ width: '50%' }}
                animate={{ width: `${integrity}%` }}
                className="h-full bg-blue-600 transition-all duration-1000"
              />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30" />
            </div>
            <div className="flex justify-between text-[0.55rem] font-bold text-white/20">
              <span>ATTACKER</span>
              <span>DEFENDER</span>
            </div>
          </div>

          {/* Allied Roster */}
          <div className="space-y-3">
            <p className="text-[0.6rem] text-blue-400 font-black tracking-[0.3em] uppercase opacity-70">
              Allied Forces
            </p>
            <div className="space-y-2">
              {alliedRoster.length > 0 ? (
                alliedRoster.map(entry => (
                  <RosterRow key={entry.user_id} entry={entry} isEnemy={false} />
                ))
              ) : (
                <p className="text-[0.65rem] text-white/20 py-4 text-center border border-dashed border-white/10 italic">
                  No allied signatures detected in this sector.
                </p>
              )}
            </div>
          </div>

          {/* Enemy Roster */}
          <div className="space-y-3">
            <p className="text-[0.6rem] text-red-500 font-black tracking-[0.3em] uppercase opacity-70">
              Hostile Signatures
            </p>
            {warExp?.mustTargetGuards && (
              <div className="p-2 bg-amber-950/20 border border-amber-500/20 text-[0.55rem] text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Guards must be cleared before targeting vanguards.
              </div>
            )}
            <div className="space-y-2">
              {enemyRoster.length > 0 ? (
                enemyRoster.map(entry => (
                  <RosterRow key={entry.user_id} entry={entry} isEnemy={true} />
                ))
              ) : (
                <p className="text-[0.65rem] text-white/20 py-4 text-center border border-dashed border-white/10 italic">
                  Sector appearing clear of hostile signatures.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer / Actions */}
      <div className="shrink-0 p-5 border-t border-white/10 bg-[#050505] space-y-4">
        {loading && !warExp && (
          <div className="py-4 text-center text-[0.6rem] animate-pulse text-white/30 uppercase tracking-widest">
            Syncing tactical data...
          </div>
        )}

        {/* Not deployed yet */}
        {warExp && !isDeployed && isParticipant && (
          <div className="space-y-3">
            {deployError && <p className="text-[0.6rem] text-red-500 uppercase tracking-widest animate-pulse">{deployError}</p>}
            <div className="flex gap-2">
              <button
                disabled={isDeploying || isRecovering}
                onClick={() => handleDeploy('guard')}
                className="flex-1 py-3 bg-blue-900/10 hover:bg-blue-900/20 border border-blue-500/30 text-blue-400 font-black text-[0.7rem] uppercase tracking-widest rounded-sm transition-all disabled:opacity-40"
              >
                {guardLabel}
              </button>
              <button
                disabled={isDeploying || isRecovering}
                onClick={() => handleDeploy('vanguard')}
                className="flex-1 py-3 bg-red-900/10 hover:bg-red-900/20 border border-red-500/30 text-red-400 font-black text-[0.7rem] uppercase tracking-widest rounded-sm transition-all disabled:opacity-40"
              >
                {vanguardLabel}
              </button>
            </div>
          </div>
        )}

        {/* Deployed */}
        {warExp && isDeployed && (
          <div className="space-y-3">
            {warExp.deployment?.role === 'vanguard' ? (
              <button
                disabled={!hasTargets || isRecovering}
                onClick={() => onStrikeClick({
                  warId: activeWar?.id ?? null,
                  targets: warExp.targets,
                  specialLocked: warExp.specialLocked,
                  mustTargetGuards: warExp.mustTargetGuards,
                })}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-[0.8rem] uppercase tracking-[0.2em] rounded-sm transition-all active:scale-95 disabled:grayscale disabled:opacity-40 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
              >
                <Sword className="w-4 h-4" />
                {strikeLabel}
              </button>
            ) : (
              <div className="py-3 px-4 bg-blue-950/30 border border-blue-500/20 rounded-sm flex items-center justify-between">
                <span className="text-[0.65rem] text-blue-300 font-black uppercase tracking-widest flex items-center gap-3">
                  <Shield className="w-4 h-4 opacity-50" />
                  Garrison Duties Active
                </span>
                <span className="text-[0.55rem] text-blue-400/50 italic">Holding Sector</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                disabled={isReconning || !warExp.canRecon}
                onClick={handleRecon}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-black text-[0.6rem] uppercase tracking-widest rounded-sm disabled:opacity-30"
              >
                {isReconning ? 'SCANNING...' : warExp.isRevealed ? 'RECON LOGGED' : 'REQUEST RECON'}
              </button>
              {isRecovering && (
                <div className="flex-1 py-2 bg-red-950/20 border border-red-500/30 text-red-500 text-[0.6rem] flex items-center justify-center gap-2 uppercase font-black">
                  <Clock className="w-3 h-3 animate-spin-slow" />
                  Stabilizing
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observer only */}
        {warExp && !isParticipant && (
          <div className="p-3 bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[0.6rem] text-white/30 uppercase tracking-[0.3em]">Observation Mode</p>
            <p className="text-[0.5rem] text-white/10 mt-1 uppercase">External signature detected. Link unauthorized.</p>
          </div>
        )}
      </div>
    </div>
  )
}
