'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sword, Zap, Target, Skull, Activity } from 'lucide-react'
import type { District } from '@/backend/models/district.model'

interface StrikeTarget {
  user_id: string
  username: string | null
  character_name: string | null
  rank: number | null
  faction: string | null
  is_guard: boolean
  isEncrypted: boolean
}

interface StrikeModalProps {
  district: District
  warId: string | null
  targets: StrikeTarget[]
  specialLocked: boolean
  mustTargetGuards: boolean
  onClose: (result?: { warResolved?: boolean } | null) => void
}

const APPROACHES = [
  {
    id: 'Frontal Assault' as const,
    name: 'Frontal Assault',
    icon: Sword,
    color: 'text-red-500',
    desc: 'Aggressive engagement. Favored by [BRUTE] classes. High impact, high risk.',
  },
  {
    id: 'Outmaneuver' as const,
    name: 'Outmaneuver',
    icon: Target,
    color: 'text-blue-400',
    desc: 'Tactical positioning. Favored by [INTEL] classes. Nullifies raw power.',
  },
  {
    id: 'Ability Overload' as const,
    name: 'Ability Overload',
    icon: Zap,
    color: 'text-purple-400',
    desc: 'Maximum exertion. Favored by [ANOMALY] classes. Overwhelms specific ability signatures.',
  },
]

export function StrikeModal({ district, warId, targets, specialLocked, mustTargetGuards, onClose }: StrikeModalProps) {
  const [approach, setApproach] = useState<'Frontal Assault' | 'Outmaneuver' | 'Ability Overload'>('Frontal Assault')
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [isSimulating, setIsSimulating] = useState(false)

  const serial = useRef(Math.random().toString(36).substring(2, 9).toUpperCase())

  useEffect(() => {
    setSelectedTarget(targets[0]?.user_id || null)
  }, [targets, district.id])

  useEffect(() => {
    if (specialLocked) {
      setApproach((current) => current === 'Ability Overload' ? 'Frontal Assault' : current)
    }
  }, [specialLocked])

  const handleStrike = async () => {
    if (!selectedTarget || !warId) return
    setSubmitting(true)
    try {
      const resp = await fetch('/api/war/strike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defenderId: selectedTarget,
          warId,
          approach,
        }),
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error)

      setResult(data)
      setSubmitting(false)
      setIsSimulating(true)
      setCurrentStep(0)

      for (let i = 0; i < data.combatSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 1200))
        setCurrentStep(i)
      }

      await new Promise((r) => setTimeout(r, 800))
      setIsSimulating(false)
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Tactical link severed. Signature lost.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onClose()}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ y: 50, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-xl bg-black border border-white/20 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden rounded-sm"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#050505]">
          <div>
            <span className="font-space-mono text-[0.5rem] tracking-[0.4em] block mb-1 text-amber-500 uppercase">
              {result ? 'TACTICAL_OUTCOME_SYNC' : `STRIKE_SERIAL: ${serial.current}`}
            </span>
            <h2 className="font-cinzel text-xl text-white uppercase tracking-tight">
              {result ? (result.success ? 'TARGET_NEUTRALIZED' : 'STRIKE_REPULSED') : 'Designate Strike Coordinates'}
            </h2>
          </div>
          <button onClick={() => onClose()} className="p-2 text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 font-space-mono">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {mustTargetGuards && (
                  <div className="p-3 border border-amber-500/30 bg-amber-950/20 text-[0.6rem] text-amber-300 uppercase tracking-[0.2em] rounded-sm">
                    Guard units are still active. You must engage the enemy garrison first.
                  </div>
                )}
                {specialLocked && (
                  <div className="p-3 border border-red-500/30 bg-red-950/20 text-[0.6rem] text-red-300 uppercase tracking-[0.2em] rounded-sm">
                    Special ability surge is being suppressed in this district.
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skull className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[0.6rem] font-black tracking-widest text-red-500 uppercase">Designate Assault Target</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {targets.map((tg) => (
                      <button
                        key={tg.user_id}
                        onClick={() => setSelectedTarget(tg.user_id)}
                        className={`p-2 border text-left rounded-sm transition-all flex justify-between items-center ${
                          selectedTarget === tg.user_id
                            ? 'bg-red-500/20 border-red-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[0.65rem] font-bold">
                            {tg.isEncrypted
                              ? (tg.is_guard ? '[ ENCRYPTED_GUARD ]' : '[ ENCRYPTED_SIG ]')
                              : `@${(tg.username || tg.character_name || 'HOSTILE').toUpperCase()}`}
                          </span>
                          <span className="text-[0.5rem] text-white/30 uppercase tracking-[0.2em]">
                            {tg.isEncrypted ? 'DECRYPTION_REQUIRED' : (tg.is_guard ? 'GUARD' : 'VANGUARD')}
                          </span>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedTarget === tg.user_id ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                      </button>
                    ))}
                    {targets.length === 0 && (
                      <div className="col-span-full py-6 border border-dashed border-white/10 text-center text-[0.6rem] uppercase tracking-[0.2em] text-white/30">
                        No active hostile signatures.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[0.6rem] font-black tracking-widest text-blue-400 uppercase">Choose Tactical Approach</span>
                  </div>
                  <div className="space-y-2">
                    {APPROACHES.map((app) => {
                      const Icon = app.icon
                      const isActive = approach === app.id
                      const isDisabled = specialLocked && app.id === 'Ability Overload'
                      return (
                        <button
                          key={app.id}
                          onClick={() => { if (!isDisabled) setApproach(app.id) }}
                          disabled={isDisabled}
                          className={`w-full p-4 flex gap-4 text-left border rounded-sm transition-all ${
                            isActive
                              ? 'bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                              : 'bg-transparent border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className={`p-2 rounded bg-white/5 ${isActive ? app.color : 'text-white/20'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-[0.7rem] font-black uppercase tracking-widest ${isDisabled ? 'text-red-300/60' : isActive ? 'text-white' : 'text-white/40'}`}>
                              {app.name}
                            </h3>
                            <p className="text-[0.55rem] text-white/30 mt-1 leading-tight">
                              {isDisabled ? 'Suppressed by enemy district nullification guard.' : app.desc}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={handleStrike}
                  disabled={submitting || !selectedTarget}
                  className="w-full py-4 bg-red-700 hover:bg-red-600 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest transition-all rounded-sm shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] border-b-4 border-red-900"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                      />
                      <span>SYNCHRONIZING_IMPACT...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Confirm Strike Coordinates
                    </div>
                  )}
                </button>
              </motion.div>
            ) : isSimulating ? (
              <motion.div
                key="simulation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 space-y-8"
              >
                <div className="flex justify-between items-center px-4">
                  <div className="text-center">
                    <p className="text-[0.5rem] text-white/30 uppercase mb-1">Attacker_Power</p>
                    <p className="text-xl font-black text-white">{result.stats?.attackerPower}%</p>
                  </div>
                  <div className="h-0.5 flex-1 mx-6 bg-white/10 relative overflow-hidden">
                    <motion.div
                      initial={{ left: '-100%' }}
                      animate={{ left: '100%' }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[0.5rem] text-white/30 uppercase mb-1">Defense_Integrity</p>
                    <p className="text-xl font-black text-white">{result.stats?.defenderPower}%</p>
                  </div>
                </div>

                <div className="space-y-3 min-h-[100px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="text-[0.6rem] text-amber-500 font-mono tracking-[0.3em] font-black mb-2 animate-pulse">
                        {result.combatSteps[currentStep]?.phase}
                      </p>
                      <p className="text-sm text-white/90 font-medium italic">
                        "{result.combatSteps[currentStep]?.text}"
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div
                  className={`mx-auto w-24 h-24 rounded-sm flex items-center justify-center border-2 ${
                    result.success
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-red-500 bg-red-500/10'
                  }`}
                >
                  {result.success ? (
                    <Zap className="w-10 h-10 text-green-500" />
                  ) : (
                    <Skull className="w-10 h-10 text-red-500" />
                  )}
                </div>

                <div className="space-y-4">
                  <p className={`text-[0.6rem] font-black uppercase tracking-[0.3em] ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                    {result.success ? 'STRIKE_SUCCESSFUL' : 'STRIKE_FAILED'}
                  </p>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                    <p className="text-[0.55rem] text-white/40 mb-2 font-mono text-left uppercase">Final Tactical Log:</p>
                    <p className="text-xs text-white/80 leading-relaxed font-mono text-left italic border-l-2 border-white/20 pl-3">
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.success && (
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-sm text-[0.6rem] text-green-500/80 uppercase tracking-widest flex justify-between items-center">
                    <span>District Integrity Reduced</span>
                    <span className="font-black font-mono">NEW_VAL: {result.integrity}%</span>
                  </div>
                )}

                <button
                  onClick={() => onClose(result)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black text-[0.6rem] uppercase tracking-[0.3em] rounded-sm transition-all border border-white/20"
                >
                  CLOSE_TERMINAL
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.div>
    </div>
  )
}
