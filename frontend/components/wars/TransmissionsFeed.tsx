'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as TerminalIcon } from 'lucide-react'

interface Transmission {
  id: string
  text: string
  timestamp: string
  type: 'combat' | 'recon' | 'system' | 'capture' | 'reinforce'
}

interface TransmissionsFeedProps {
  warId: string | null
}

function isValidWarId(value: string | null | undefined): value is string {
  return Boolean(
    value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  )
}

export function TransmissionsFeed({ warId }: TransmissionsFeedProps) {
  const [transmissions, setTransmissions] = useState<Transmission[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isValidWarId(warId)) return

    const fetchFeed = async () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }
      try {
        const res = await fetch(`/api/war/experience?warId=${warId}&mode=feed`)
        const data = await res.json()
        if (data.transmissions) {
          setTransmissions(data.transmissions.map((t: any, idx: number) => {
            const message = t.message || t;
            const type = t.type || 'system';
            
            return {
              id: t.id || `t-${idx}-${Date.now()}`,
              text: message,
              timestamp: t.timestamp || new Date().toISOString(),
              type
            };
          }))
        }
      } catch (err) {
        console.error('Feed sync failed:', err)
      }
    }

    fetchFeed()
    const interval = setInterval(fetchFeed, 120000) // Increased to 120s to reduce I/O
    return () => clearInterval(interval)
  }, [warId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transmissions])

  if (!isValidWarId(warId)) return null

  return (
    <div className="h-32 bg-black/80 border-t border-white/10 flex flex-col font-space-mono overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[0.55rem] font-black text-amber-500 tracking-[0.3em] uppercase">Live_Transmissions_Feed</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[0.45rem] text-white/20 animate-pulse tracking-widest">UPLINK_STABLE</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide select-none"
      >
        <AnimatePresence initial={false}>
          {transmissions.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 transition-colors hover:bg-white/5 px-2 py-0.5 rounded-sm"
            >
              <span className="text-[0.5rem] text-white/25 mt-1 shrink-0">
                [{new Date(t.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <p className={`text-[0.65rem] leading-relaxed tracking-tight ${
                t.text.includes('ASSAULT') || t.text.includes('INTERCEPT') || t.text.includes('NEUTRALIZED') ? 'text-red-400' : 
                t.text.includes('RECON') || t.text.includes('DECRYPT') ? 'text-blue-400' : 
                t.text.includes('GARRISON') ? 'text-blue-300' : 'text-white/70'
              }`}>
                <span className="text-white/20 mr-2">&gt;</span>
                {t.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        {transmissions.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-20 italic text-[0.6rem] uppercase tracking-widest">
            Awaiting battlefield signatures...
          </div>
        )}
      </div>

      {/* CRT Scanline effect overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  )
}
