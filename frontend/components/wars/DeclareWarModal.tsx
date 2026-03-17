'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Swords, AlertTriangle, ChevronRight, Shield, MapPin, MessageSquare, Eye } from 'lucide-react'
import { FACTION_META } from '@/frontend/lib/launch'
import { DISTRICTS_DATA } from '@/frontend/lib/data/districts.data'
import type { FactionId } from '@/backend/types'

import type { District } from '@/backend/models/district.model'

interface DeclareWarModalProps {
  myFactionId: FactionId
  activeWar: { faction_a_id: string; faction_b_id: string; status: string } | null
  districts: District[]
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'check' | 'target' | 'district' | 'message' | 'preview' | 'done'

const CHALLENGEABLE_FACTIONS: FactionId[] = [
  'mafia', 'agency', 'guild', 'hunting_dogs', 'special_div'
]

export function DeclareWarModal({
  myFactionId,
  activeWar,
  districts,
  onClose,
  onSuccess,
}: DeclareWarModalProps) {
  const [step, setStep] = useState<Step>(activeWar ? 'check' : 'target')
  const [targetFaction, setTargetFaction] = useState<FactionId | null>(null)
  const [targetDistrict, setTargetDistrict] = useState<string | null>(null)
  const [warMessage, setWarMessage] = useState('')
  const [submitting, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const myFaction = FACTION_META[myFactionId]
  const target = targetFaction ? FACTION_META[targetFaction] : null
  
  // Resolve the district object from the props using the selected ID
  const selectedDbDistrict = targetDistrict ? districts.find(d => d.id === targetDistrict) : null
  // Then resolve the static metadata using the slug or ID
  const district = selectedDbDistrict 
    ? (DISTRICTS_DATA.find(d => d.id === selectedDbDistrict.slug || d.id === selectedDbDistrict.id))
    : null

  const challengeable = CHALLENGEABLE_FACTIONS.filter(f => f !== myFactionId)

  const handleDeclare = () => {
    if (!targetFaction || !targetDistrict) return
    setError(null)

    startTransition(async () => {
      try {
        const resp = await fetch('/api/war/declare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetFactionId: targetFaction,
            districtId: targetDistrict,
            warMessage: warMessage.trim() ||
              `${myFaction.name} challenges ${target?.name} for control of ${district?.name}.`,
          }),
        })
        const data = await resp.json()
        if (!resp.ok || data.error) {
          setError(data.error || data.message || 'Declaration failed.')
          setStep('preview')
          return
        }
        setStep('done')
        onSuccess?.()
      } catch {
        setError('Network failure. Try again.')
        setStep('preview')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ y: 40, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.97, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#2a2a2a] rounded-sm overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.9)]"
      >
        {/* Top accent */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-red-700 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <p className="text-[0.5rem] text-red-500/70 tracking-[0.4em] uppercase font-space-mono mb-1">
              WAR_DECLARATION_TERMINAL
            </p>
            <h2 className="font-cinzel text-lg text-white uppercase tracking-wider font-black">
              Declare Conflict
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step progress */}
        {step !== 'check' && step !== 'done' && (
          <div className="px-6 pt-4 flex items-center gap-2">
            {(['target', 'district', 'message', 'preview'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  step === s ? 'bg-red-500' :
                  (['target', 'district', 'message', 'preview'] as Step[]).indexOf(step) > i
                    ? 'bg-white/40' : 'bg-white/10'
                }`} />
                {i < 3 && <div className="w-6 h-px bg-white/10" />}
              </div>
            ))}
            <span className="ml-2 text-[0.5rem] text-white/20 font-space-mono uppercase tracking-widest">
              {step === 'target' ? 'Select Target' :
               step === 'district' ? 'Select District' :
               step === 'message' ? 'War Message' : 'Confirm'}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* STEP: Active war warning */}
            {step === 'check' && (
              <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">
                      Active Conflict Detected
                    </p>
                    <p className="text-[0.7rem] text-white/50 font-space-mono leading-relaxed">
                      {FACTION_META[activeWar!.faction_a_id as FactionId]?.name} vs{' '}
                      {FACTION_META[activeWar!.faction_b_id as FactionId]?.name} is currently active.
                      Declaring a second war will run simultaneously.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-widest rounded-sm transition-all"
                  >
                    Stand Down
                  </button>
                  <button
                    onClick={() => setStep('target')}
                    className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" />
                    Proceed
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: Pick target faction */}
            {step === 'target' && (
              <motion.div key="target" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-4 h-4 text-red-500" />
                  <p className="text-[0.6rem] text-white/40 uppercase tracking-widest font-space-mono">
                    Select a faction to challenge
                  </p>
                </div>

                {/* My faction */}
                <div className="p-3 border border-white/5 rounded-sm bg-white/[0.02] flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 border border-white/10 flex items-center justify-center font-black text-sm" style={{ color: myFaction.color }}>
                    {myFaction.kanji}
                  </div>
                  <div>
                    <p className="text-[0.5rem] text-white/30 uppercase tracking-widest font-space-mono">Declaring faction</p>
                    <p className="text-xs font-black text-white uppercase">{myFaction.name}</p>
                  </div>
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: myFaction.color }} />
                </div>

                <div className="space-y-2">
                  {challengeable.map((fId) => {
                    const f = FACTION_META[fId]
                    const isSelected = targetFaction === fId
                    return (
                      <button
                        key={fId}
                        onClick={() => setTargetFaction(fId)}
                        className={`w-full flex items-center gap-4 p-4 border rounded-sm transition-all text-left ${
                          isSelected
                            ? 'border-red-500/50 bg-red-950/20'
                            : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
                        }`}
                      >
                        <div
                          className="w-10 h-10 border flex items-center justify-center font-black text-lg shrink-0"
                          style={{ color: f.color, borderColor: `${f.color}44` }}
                        >
                          {f.kanji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white uppercase tracking-wider">{f.name}</p>
                          <p className="text-[0.55rem] text-white/30 font-space-mono mt-0.5 truncate">{f.nameJp}</p>
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 text-red-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                <button
                  disabled={!targetFaction}
                  onClick={() => setStep('district')}
                  className="w-full mt-4 py-3.5 bg-red-700 hover:bg-red-600 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                >
                  Next — Select District
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP: Pick district */}
            {step === 'district' && (
              <motion.div key="district" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <p className="text-[0.6rem] text-white/40 uppercase tracking-widest font-space-mono">
                    Select the district at stake
                  </p>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {districts
                    .filter(d => d.controlling_faction === targetFaction)
                    .map((d) => {
                      const isSelected = targetDistrict === d.id
                      const staticData = DISTRICTS_DATA.find(sd => sd.id === d.slug || sd.id === d.id)
                      
                      return (
                        <button
                          key={d.id}
                          onClick={() => setTargetDistrict(d.id)}
                          className={`w-full flex items-center gap-4 p-3 border rounded-sm transition-all text-left ${
                            isSelected
                              ? 'border-amber-500/50 bg-amber-950/20'
                              : 'border-white/5 hover:border-white/15 bg-white/[0.02]'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white uppercase tracking-wider">{d.name}</p>
                            <p className="text-[0.5rem] text-white/30 font-space-mono">
                              {staticData?.sector ?? 'SECTOR ??'} · {staticData?.real_location ?? 'LOCATION ??'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[0.5rem] font-space-mono" style={{ color: d.color }}>
                              {d.controlling_faction?.toUpperCase() ?? 'NEUTRAL'}
                            </p>
                            <p className={`text-[0.45rem] font-space-mono mt-0.5 ${
                              staticData?.threat_level === 'MAXIMUM' ? 'text-red-500' :
                              staticData?.threat_level === 'EXTREME' ? 'text-red-400' :
                              staticData?.threat_level === 'VERY HIGH' ? 'text-orange-400' :
                              'text-white/20'
                            }`}>{staticData?.threat_level ?? 'UNCERTAIN'}</p>
                          </div>
                        </button>
                      )
                    })}
                  {districts.filter(d => d.controlling_faction === targetFaction).length === 0 && (
                    <div className="py-8 text-center bg-white/[0.02] border border-white/5 rounded-sm">
                      <p className="text-[0.6rem] text-white/30 font-space-mono uppercase tracking-[0.2em]">
                        NO CAPTURED DISTRICTS FOUND
                      </p>
                      <p className="text-[0.5rem] text-white/20 font-space-mono mt-1">
                        Target faction holds no territory available for contest.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep('target')}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-widest rounded-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={!targetDistrict}
                    onClick={() => setStep('message')}
                    className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:bg-white/5 disabled:text-white/20 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: War message */}
            {step === 'message' && (
              <motion.div key="message" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-4 h-4 text-white/40" />
                  <p className="text-[0.6rem] text-white/40 uppercase tracking-widest font-space-mono">
                    War declaration message
                  </p>
                </div>

                <textarea
                  value={warMessage}
                  onChange={(e) => setWarMessage(e.target.value)}
                  maxLength={280}
                  rows={4}
                  placeholder={`${myFaction.name} challenges ${target?.name} for control of ${district?.name}.`}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-sm text-white font-space-mono placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none leading-relaxed"
                />
                <p className="text-[0.5rem] text-white/20 font-space-mono text-right">
                  {warMessage.length}/280 — leave blank to use default
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('district')}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 font-black text-xs uppercase tracking-widest rounded-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('preview')}
                    className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: Preview + confirm */}
            {step === 'preview' && target && district && (
              <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <p className="text-[0.6rem] text-white/40 uppercase tracking-widest font-space-mono mb-2">
                  Review before declaring
                </p>

                {/* War card preview */}
                <div className="border border-white/10 rounded-sm overflow-hidden">
                  {/* Factions bar */}
                  <div className="flex">
                    <div className="flex-1 p-4 flex items-center gap-3" style={{ borderBottom: `2px solid ${myFaction.color}44` }}>
                      <div className="w-9 h-9 border flex items-center justify-center font-black text-lg" style={{ color: myFaction.color, borderColor: `${myFaction.color}44` }}>
                        {myFaction.kanji}
                      </div>
                      <div>
                        <p className="text-[0.5rem] text-white/30 font-space-mono">Challenger</p>
                        <p className="text-xs font-black text-white uppercase">{myFaction.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center px-4 bg-white/[0.02]">
                      <Swords className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 p-4 flex items-center gap-3" style={{ borderBottom: `2px solid ${target.color}44` }}>
                      <div className="w-9 h-9 border flex items-center justify-center font-black text-lg" style={{ color: target.color, borderColor: `${target.color}44` }}>
                        {target.kanji}
                      </div>
                      <div>
                        <p className="text-[0.5rem] text-white/30 font-space-mono">Defender</p>
                        <p className="text-xs font-black text-white uppercase">{target.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stakes */}
                  <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: district.faction_color }} />
                    <div>
                      <p className="text-[0.5rem] text-white/30 font-space-mono uppercase tracking-widest">Stakes</p>
                      <p className="text-xs font-black text-white uppercase">{district.name}</p>
                      <p className="text-[0.5rem] text-white/30 font-space-mono">{district.sector} · {district.real_location}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[0.5rem] text-white/30 font-space-mono">Duration</p>
                      <p className="text-xs font-black text-white">72 hours</p>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="p-4 border-t border-white/5">
                    <p className="text-[0.5rem] text-white/30 font-space-mono uppercase tracking-widest mb-1">Declaration</p>
                    <p className="text-[0.7rem] text-white/60 font-space-mono leading-relaxed italic">
                      "{warMessage.trim() || `${myFaction.name} challenges ${target.name} for control of ${district.name}.`}"
                    </p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-sm">
                    <p className="text-[0.6rem] text-red-400 font-space-mono">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('message')}
                    disabled={submitting}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/60 font-black text-xs uppercase tracking-widest rounded-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeclare}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-red-700 hover:bg-red-600 disabled:bg-red-900 text-white font-black text-xs uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full" />
                        Declaring...
                      </>
                    ) : (
                      <>
                        <Swords className="w-4 h-4" />
                        Declare War
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: Done */}
            {step === 'done' && target && district && (
              <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full border-2 border-red-500 bg-red-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                  <Swords className="w-9 h-9 text-red-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-space-mono text-red-500 uppercase tracking-widest font-black">
                    WAR_DECLARED
                  </p>
                  <p className="font-cinzel text-lg text-white">
                    {myFaction.name} vs {target.name}
                  </p>
                  <p className="text-[0.65rem] text-white/40 font-space-mono">
                    {district.name} · 72 hours
                  </p>
                </div>
                <p className="text-[0.7rem] text-white/50 font-space-mono leading-relaxed max-w-xs mx-auto">
                  Notifications have been sent. Both factions are now at war. Operatives may begin striking immediately.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-space-mono text-[0.65rem] uppercase tracking-[0.3em] rounded-sm transition-all"
                >
                  Return to Headquarters
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Bottom accent */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-red-900/50 to-transparent" />
      </motion.div>
    </div>
  )
}