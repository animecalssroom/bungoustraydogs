'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Target, Zap } from 'lucide-react'
import type { District } from '@/backend/models/district.model'
import type { FactionWar } from '@/backend/types'
import { TacticalSectorMap } from './TacticalSectorMap'
import { getDistrictData } from '@/frontend/lib/data/districts.data'

interface TacticalMapProps {
  districts: District[]
  onDistrictSelect: (district: District) => void
  activeWars: FactionWar[]
}

export function TacticalMap({ districts, onDistrictSelect, activeWars }: TacticalMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (district: District) => {
    setSelectedId(district.id)
    onDistrictSelect(district)
  }

  const selectedDistrict = districts.find(d => d.id === selectedId)

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg border border-[#333] bg-black">
      <TacticalSectorMap 
        districts={districts} 
        onDistrictSelect={handleSelect} 
        selectedId={selectedId || undefined} 
        activeWars={activeWars}
      />
      
      {/* UI Overlays */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-black/60 backdrop-blur-md border border-[#333] px-3 py-1.5 rounded flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-space-mono text-[0.6rem] text-white tracking-widest leading-none">TACTICAL LINK: STABLE</span>
            <span className="font-space-mono text-[0.5rem] text-green-500/60 mt-0.5">ENCRYPTION: AES-256-GCM [ACTIVE]</span>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm border border-white/5 p-2 rounded w-48 hidden lg:block">
           <div className="flex justify-between text-[0.5rem] font-space-mono text-white/40 mb-1">
             <span>SIGNAL_LATENCY</span>
             <span>14ms</span>
           </div>
           <div className="h-0.5 bg-white/5 w-full">
             <motion.div 
               animate={{ width: ['20%', '25%', '22%', '24%'] }}
               transition={{ duration: 1, repeat: Infinity }}
               className="h-full bg-green-500/40"
             />
           </div>
        </div>
      </div>

      {/* Right Side Telemetry */}
      <div className="absolute top-4 right-4 z-10 text-right space-y-2 hidden md:block">
        <div className="font-space-mono text-[0.5rem] text-white/20">
          UPLINK_STATUS: AUTHENTICATED<br/>
          TRACE_BYPASS: ENABLED<br/>
          YOKOHAMA_MS: 35.4433 N, 139.6367 E
        </div>
      </div>

      {/* Removed floating info panel to prevent duplication with SectorPanel sidebar/drawer */}

      {/* Grid Pattern Overlay (Faded) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen" 
        style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
          backgroundSize: '100px 100px' 
        }} 
      />
    </div>
  )
}
