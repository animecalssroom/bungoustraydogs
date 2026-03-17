'use client'

import { useEffect, useState, useRef } from 'react'
import type { DuelMove, DuelRound } from '@/backend/types'
import { describeRoundMechanics, formatMoveLabel, getDisplayRoundNarrative } from '@/lib/duels/presentation'

const MOVE_COLORS: Record<DuelMove, { text: string; border: string; bg: string; shadow: string }> = {
  strike: { text: '#3c3c3c', border: '#8c8c8c', bg: 'rgba(0,0,0,0.03)', shadow: 'rgba(0,0,0,0.05)' },
  stance: { text: '#2c5282', border: 'rgba(44,82,130,0.4)', bg: 'rgba(44,82,130,0.05)', shadow: 'rgba(44,82,130,0.1)' },
  gambit: { text: '#975a16', border: 'rgba(151,90,22,0.4)', bg: 'rgba(151,90,22,0.05)', shadow: 'rgba(151,90,22,0.1)' },
  recover: { text: '#276749', border: 'rgba(39,103,73,0.4)', bg: 'rgba(39,103,73,0.05)', shadow: 'rgba(39,103,73,0.1)' },
  special: { text: '#9b2c2c', border: 'rgba(155,44,44,0.4)', bg: 'rgba(155,44,44,0.05)', shadow: 'rgba(155,44,44,0.15)' },
}

function MoveStamp({ move }: { move: DuelMove | null }) {
  if (!move) return <span className="font-space-mono text-[0.5rem] opacity-30">—</span>
  const c = MOVE_COLORS[move]
  return (
    <span
      className="font-space-mono inline-flex items-center px-2 py-0.5 rounded-[1px] text-[0.5rem] uppercase font-bold tracking-widest border-2 transition-transform hover:scale-105"
      style={{
        color: c.text,
        borderColor: c.border,
        background: c.bg,
        boxShadow: `2px 2px 0 ${c.shadow}`,
        transform: 'rotate(-1.5deg)',
      }}
    >
      {formatMoveLabel(move)}
    </span>
  )
}

function HPIndicator({ current, max, name }: { current: number; max: number; name: string }) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100))
  const isCrticial = percent <= 30
  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="flex justify-between items-end font-space-mono text-[0.45rem] tracking-tight">
        <span className="uppercase opacity-60">{name}</span>
        <span className={isCrticial ? 'text-red-600 font-bold' : 'opacity-80'}>{current}/{max}</span>
      </div>
      <div className="h-1 bg-black/5 rounded-full overflow-hidden border border-black/5">
        <div 
          className={`h-full transition-all duration-700 ${isCrticial ? 'bg-red-600' : 'bg-stone-600'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function BattleLogVisualizer({
  rounds,
  challengerName,
  defenderName,
}: {
  rounds: DuelRound[]
  challengerName: string
  defenderName: string
}) {
  const [openId, setOpenId] = useState<string | null>(rounds[rounds.length - 1]?.id ?? null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (rounds.length > 0) {
      setOpenId(rounds[rounds.length - 1].id)
    }
  }, [rounds])

  if (!rounds.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-stone-200 rounded-lg">
        <div className="w-12 h-12 mb-4 opacity-10">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
             <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
           </svg>
        </div>
        <p className="font-cormorant italic text-stone-400 text-lg">No combat records currently filed for this transmission.</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      {rounds.map((round) => {
        const isOpen = openId === round.id
        const detailLines = describeRoundMechanics(round, challengerName, defenderName)
        const narrative = getDisplayRoundNarrative(round, challengerName, defenderName)
        
        return (
          <article
            key={round.id}
            className={`
              relative bg-[#f7f3ed] border border-stone-300 shadow-sm transition-all duration-300
              ${isOpen ? 'ring-2 ring-stone-400 ring-offset-2 scale-[1.01] z-10' : 'opacity-90 hover:opacity-100'}
            `}
            style={{
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
            }}
          >
            {/* Header / Summary Line */}
            <button
              onClick={() => setOpenId(isOpen ? null : round.id)}
              className="w-full text-left p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="font-space-mono text-[0.4rem] uppercase tracking-tighter text-stone-500">Log Entry</span>
                  <span className="font-space-mono text-xl font-black text-stone-800">
                    #{String(round.round_number).padStart(2, '0')}
                    {round.is_sudden_death && <span className="text-red-700 ml-1">!!!</span>}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <MoveStamp move={round.challenger_move} />
                  <span className="font-space-mono text-[0.4rem] opacity-30 italic">vs</span>
                  <MoveStamp move={round.defender_move} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col text-right pr-4 border-r border-stone-200">
                   <span className="font-space-mono text-[0.4rem] uppercase text-stone-500">Clash Outcome</span>
                   <span className="font-space-mono text-[0.6rem] font-bold">
                     {round.challenger_damage_dealt} : {round.defender_damage_dealt}
                   </span>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            <div className={`
              overflow-hidden transition-all duration-500 ease-in-out
              ${isOpen ? 'max-h-[1000px] opacity-100 pb-6' : 'max-h-0 opacity-0'}
            `}>
              <div className="mx-4 pt-2 border-t border-dashed border-stone-400 flex flex-col gap-6">
                
                {/* Visual HP Bars */}
                <div className="flex justify-between items-center bg-black/[0.02] p-3 rounded border border-black/[0.03]">
                  <HPIndicator 
                    current={round.challenger_hp_after ?? 0} 
                    max={100} // This should probably be dynamic from character slug
                    name={challengerName.split(' ')[0]} 
                  />
                  <div className="font-space-mono text-[0.4rem] uppercase font-bold opacity-30 px-2">POST-EXCHANGE</div>
                  <HPIndicator 
                    current={round.defender_hp_after ?? 0} 
                    max={100} 
                    name={defenderName.split(' ')[0]} 
                  />
                </div>

                {/* Mechanics Summary */}
                <div className="flex flex-col gap-1.5 px-2">
                   {detailLines.map((line, idx) => (
                     <div key={idx} className="flex gap-2 items-start group/line">
                        <span className="font-space-mono text-[0.5rem] opacity-30 mt-1 line-clamp-1 min-w-[30px]">TYPE-{idx}</span>
                        <p className="font-space-mono text-[0.6rem] text-stone-700 leading-relaxed group-hover/line:text-black transition-colors">
                          {line}
                        </p>
                     </div>
                   ))}

                   {round.special_events?.map((event: any, idx) => (
                      <div key={`event-${idx}`} className="mt-2 bg-red-50/50 p-2 border-l-2 border-red-600 animate-in fade-in slide-in-from-left duration-500">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                          <span className="font-space-mono text-[0.45rem] font-black text-red-800 uppercase tracking-widest">Ability Signature Detected</span>
                        </div>
                        <p className="font-space-mono text-[0.55rem] text-red-950 font-bold">
                          {event.description ?? event.type}
                        </p>
                      </div>
                   ))}
                </div>

                {/* Narrative Assessment */}
                <div className="relative px-4 py-6 bg-stone-100/50 border border-stone-200">
                  <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#f7f3ed] px-2 font-space-mono text-[0.4rem] uppercase tracking-widest text-stone-500">
                    Strategic Assessment
                  </div>
                  <p className="font-cormorant text-xl italic leading-relaxed text-stone-900 indent-4">
                    {narrative}
                  </p>
                  <div className="mt-4 flex justify-end gap-1 opacity-10 select-none pointer-events-none">
                    <span className="font-space-mono text-[0.4rem]">AUTHORIZED-BY-ANGO</span>
                    <span className="font-space-mono text-[0.4rem]">SEAL-ARCHIVE-{round.id.slice(0,4)}</span>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Folder Tab Effect */}
            <div className={`
              absolute top-0 right-10 h-6 w-16 bg-stone-300/20 -translate-y-full rounded-t-sm border border-stone-300 border-b-0
              flex items-center justify-center font-space-mono text-[0.35rem] text-stone-500 tracking-tighter
              ${isOpen ? 'bg-stone-400/30' : ''}
            `}>
              ENTRY-{round.round_number}
            </div>
          </article>
        )
      })}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}
