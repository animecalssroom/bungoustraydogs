'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { District } from '@/backend/models/district.model'

import type { FactionWar, FactionId } from '@/backend/types'
import { FACTION_META } from '@/frontend/lib/launch'

interface SectorMarker {
  id: string
  name: string
  paths: string[]
  labelX: number
  labelY: number
  color: string
}

const SECTORS: SectorMarker[] = [
  { id: 'tsurumi-district', name: 'Tsurumi District', paths: ['M 300,30 L 600,30 L 650,150 L 250,150 Z'], labelX: 450, labelY: 80, color: '#0f1e38' },
  { id: 'minato-mirai', name: 'Minato Mirai', paths: ['M 250,150 L 650,150 L 750,350 L 500,450 L 300,350 Z'], labelX: 450, labelY: 280, color: '#0f2d52' },
  { 
    id: 'yokohama-port', 
    name: 'Yokohama Port', 
    paths: [
      'M 650,150 L 850,150 L 950,450 L 750,350 Z', // Harbor
      'M 880,50 L 980,100 L 950,300 L 850,250 Z'   // Standard Island
    ], 
    labelX: 800, labelY: 250, color: '#5a0000' 
  },
  { id: 'chinatown', name: 'Chinatown', paths: ['M 500,450 L 750,350 L 800,650 L 550,700 Z'], labelX: 650, labelY: 530, color: '#5a4400' },
  { id: 'motomachi', name: 'Motomachi', paths: ['M 800,650 L 950,900 L 650,950 L 550,700 Z'], labelX: 780, labelY: 820, color: '#0f3828' },
  { id: 'honmoku-area', name: 'Honmoku Area', paths: ['M 400,750 L 550,700 L 650,950 L 300,950 Z'], labelX: 480, labelY: 850, color: '#3a0000' },
  { id: 'kannai-center', name: 'Kannai Center', paths: ['M 100,250 L 250,150 L 300,350 L 500,450 L 550,700 L 400,750 L 100,750 Z'], labelX: 280, labelY: 500, color: '#4a3800' },
  { id: 'suribachi-city', name: 'Suribachi City', paths: ['M 50,750 L 400,750 L 300,950 L 50,950 Z'], labelX: 200, labelY: 850, color: '#141414' },
  { id: 'northern-wards', name: 'Northern Wards', paths: ['M 50,30 L 300,30 L 250,150 L 100,250 Z'], labelX: 180, labelY: 80, color: '#1a1a2a' },
]

interface Landmark {
  id: string
  name: string
  x: number
  y: number
  type: 'mafia' | 'agency' | 'guild' | 'neutral'
  label?: string
}

const LANDMARKS: Landmark[] = [
  { id: 'pm_hq', name: 'PM HQ', x: 820, y: 300, type: 'mafia', label: 'PORT MAFIA HEADQUARTERS' },
  { id: 'ada_office', name: 'ADA OFFICE', x: 420, y: 320, type: 'agency', label: 'ARMED DETECTIVE AGENCY' },
  { id: 'suribachi_crater', name: 'SURIBACHI CRATER', x: 200, y: 880, type: 'neutral', label: 'GROUND ZERO' },
  { id: 'red_brick', name: 'RED BRICK', x: 680, y: 280, type: 'guild', label: 'AKARENGA SOKO' },
  { id: 'sky_casino', name: 'SKY CASINO', x: 915, y: 150, type: 'guild', label: 'E_CASINO UPLINK' }
]

interface TacticalSectorMapProps {
  districts: District[]
  onDistrictSelect: (district: District) => void
  selectedId?: string
  activeWar: FactionWar | null
}

const OLD_SLUG_MAP: Record<string, string> = {
  'harbor': 'yokohama-port',
  'standard_island': 'yokohama-port',
  'waterfront': 'minato-mirai',
  'tsurumi': 'tsurumi-district',
  'honmoku': 'honmoku-area',
  'kannai': 'kannai-center',
  'northern_wards': 'northern-wards',
  'suribachi': 'suribachi-city'
}

export function TacticalSectorMap({ districts, onDistrictSelect, selectedId, activeWar }: TacticalSectorMapProps) {
  const mappedSectors = useMemo(() => {
    return SECTORS.map(s => {
      const district = districts.find(d => d.slug === s.id || OLD_SLUG_MAP[d.slug] === s.id)
      const factionId = district?.controlling_faction as FactionId
      const factionColor = factionId ? FACTION_META[factionId]?.color : s.color
      
      const isContested = activeWar?.status === 'active' && activeWar.stakes === 'district' && activeWar.stakes_detail?.district_id === district?.id

      return {
        ...s,
        district,
        activeColor: factionColor || s.color,
        hasOwner: !!factionId && (factionId as string) !== 'neutral',
        isContested
      }
    })
  }, [districts, activeWar])

  return (
    <div className="relative w-full h-full bg-[#050505] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20 brain-scan-vignette" />
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <motion.div 
        className="relative w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <svg 
          viewBox="0 0 1000 1000" 
          className="w-full h-full max-h-[85vh]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="6" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="strong-glow" x="-50%" y="-50%" width="200%" height="200%">
               <feGaussianBlur stdDeviation="15" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
               <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff05" strokeWidth="0.5"/>
            </pattern>
            <pattern id="buildings" width="20" height="20" patternUnits="userSpaceOnUse">
               <rect x="2" y="2" width="6" height="6" fill="#ffffff08" />
               <rect x="12" y="10" width="4" height="8" fill="#ffffff08" />
            </pattern>
          </defs>

          <rect width="1000" height="1000" fill="url(#grid)" />

          <motion.rect
            width="1000"
            height="2"
            fill="#ffffff08"
            animate={{ y: [0, 1000] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none"
            style={{ boxShadow: '0 0 15px rgba(255,255,255,0.2)' }}
          />

          {/* Sectors */}
          {mappedSectors.map((sector) => {
            const isSelected = selectedId === sector.district?.id
            const factionId = sector.district?.controlling_faction as FactionId
            const kanji = factionId ? FACTION_META[factionId]?.kanji : null
            const apScore = sector.district?.ap_pool || 0
            
            return (
              <g key={sector.id} className="cursor-pointer group">
                {sector.paths.map((path, idx) => (
                  <React.Fragment key={idx}>
                    <motion.path
                      d={path}
                      initial={{ 
                        opacity: 0, 
                        scale: 0.98,
                        strokeWidth: 1.5,
                        fill: 'rgba(0,0,0,0)',
                        stroke: `${sector.activeColor}44`
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        fill: isSelected 
                          ? `${sector.activeColor}44` 
                          : (sector.isContested ? [`${sector.activeColor}11`, `${sector.activeColor}33`, `${sector.activeColor}11`] : (sector.hasOwner ? `${sector.activeColor}11` : 'rgba(0,0,0,0)')),
                        stroke: isSelected 
                          ? sector.activeColor 
                          : (sector.isContested ? [`${sector.activeColor}66`, sector.activeColor, `${sector.activeColor}66`] : (sector.hasOwner ? `${sector.activeColor}66` : `${sector.activeColor}22`)),
                        strokeWidth: isSelected ? 3 : (sector.isContested ? 2.5 : 1.5)
                      }}
                      whileHover={{ 
                        fill: `${sector.activeColor}22`,
                        stroke: sector.activeColor,
                        strokeWidth: 2,
                        filter: 'url(#glow)'
                      }}
                      transition={{ 
                        fill: sector.isContested ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 },
                        stroke: sector.isContested ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 },
                        default: { duration: 0.3 }
                      }}
                      onClick={() => sector.district && onDistrictSelect(sector.district)}
                    />
                    <path
                      d={path}
                      fill="url(#buildings)"
                      className="pointer-events-none opacity-40"
                    />
                    {sector.isContested && (
                      <motion.path
                        d={path}
                        fill="none"
                        stroke={sector.activeColor}
                        strokeWidth="1"
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="pointer-events-none"
                      />
                    )}
                  </React.Fragment>
                ))}

                {/* Sector Label & Kanji Crest crest */}
                <g transform={`translate(${sector.labelX}, ${sector.labelY})`} className="pointer-events-none select-none">
                   {kanji && (
                     <text
                       textAnchor="middle"
                       y="-22"
                       className="font-noto-serif-jp transition-opacity"
                       style={{ 
                         fontSize: '22px', 
                         fill: sector.activeColor,
                         opacity: isSelected ? 0.9 : 0.4,
                         filter: isSelected ? 'url(#glow)' : 'none'
                        }}
                     >
                       {kanji}
                     </text>
                   )}
                   
                   <text
                    textAnchor="middle"
                    className="font-cinzel"
                    style={{ 
                      fontSize: '14px', 
                      fill: sector.isContested ? '#ff4444' : (isSelected ? '#fff' : '#ffffffaa'), 
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      fontWeight: (isSelected || sector.isContested) ? 'bold' : 'normal',
                      filter: sector.isContested ? 'url(#glow)' : 'none'
                    }}
                  >
                    {sector.isContested && <tspan fill="#ff0000" className="animate-pulse">[!] </tspan>}
                    {sector.name}
                  </text>
                  
                  <text
                    y="15"
                    textAnchor="middle"
                    className="font-space-mono"
                    style={{ 
                      fontSize: '8px', 
                      fill: sector.activeColor, 
                      opacity: isSelected ? 0.9 : 0.6,
                      letterSpacing: '2px'
                    }}
                  >
                    {sector.district?.controlling_faction?.toUpperCase() || 'NEUTRAL'}
                  </text>

                  {apScore > 0 && (
                    <text
                      y="28"
                      textAnchor="middle"
                      className="font-space-mono"
                      style={{ 
                        fontSize: '9px', 
                        fill: '#fff', 
                        opacity: isSelected ? 0.5 : 0.2,
                      }}
                    >
                      {apScore.toLocaleString()} AP
                    </text>
                  )}
                </g>

                {isSelected && (
                  <>
                    <motion.circle
                      cx={sector.labelX}
                      cy={sector.labelY}
                      r="40"
                      fill="none"
                      stroke={sector.activeColor}
                      strokeWidth="2"
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <circle
                      cx={sector.labelX}
                      cy={sector.labelY}
                      r="5"
                      fill={sector.activeColor}
                      filter="url(#glow)"
                    />
                  </>
                )}
              </g>
            )
          })}

          {LANDMARKS.map((landmark) => (
            <g key={landmark.id} transform={`translate(${landmark.x}, ${landmark.y})`} className="pointer-events-none">
              <g transform="scale(1.0)">
                {landmark.type === 'mafia' && (
                  <g transform="translate(-8, -15)">
                    <rect x="0" y="0" width="8" height="30" fill="#222" stroke="#fff" strokeWidth="0.5" />
                    <rect x="11" y="-8" width="8" height="38" fill="#111" stroke="#fff" strokeWidth="0.5" />
                    <rect x="22" y="4" width="8" height="26" fill="#222" stroke="#fff" strokeWidth="0.5" />
                  </g>
                )}
                {landmark.type === 'agency' && (
                  <rect x="-10" y="-10" width="20" height="20" fill="#88222233" stroke="#fff" strokeWidth="0.8" />
                )}
                {landmark.id === 'suribachi_crater' && (
                  <g>
                    <circle r="25" fill="none" stroke="#ffffff11" strokeWidth="1" strokeDasharray="4,2" />
                    <circle r="15" fill="none" stroke="#ffffff22" strokeWidth="0.8" />
                  </g>
                )}
                {(landmark.type === 'guild' || landmark.id === 'red_brick') && (
                  <rect x="-8" y="-8" width="16" height="16" fill="#c8a02022" stroke="#c8a020" strokeWidth="0.8" transform="rotate(45)" />
                )}
              </g>

              {landmark.label && (
                <text
                   y="35"
                   textAnchor="middle"
                   className="font-space-mono opacity-30"
                   style={{ fontSize: '7px', fill: '#fff', letterSpacing: '2px' }}
                >
                   {landmark.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  )
}
