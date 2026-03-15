'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { TerritoryControl, WarStatus, FactionId, RegistryDistrict, WarGlobalStatus } from '@/backend/types'
import { FACTION_META } from '@/frontend/lib/launch'

const DISTRICT_COORDS: Record<RegistryDistrict, { x: number; y: number; size: number }> = {
    kannai: { x: 45, y: 40, size: 1.2 },
    chinatown: { x: 55, y: 50, size: 0.9 },
    harbor: { x: 60, y: 30, size: 1.5 },
    motomachi: { x: 50, y: 65, size: 1.1 },
    honmoku: { x: 35, y: 75, size: 1.4 },
    waterfront: { x: 75, y: 45, size: 1.3 },
    other: { x: 20, y: 30, size: 1.0 },
}

export function FactionWarMap() {
    const [data, setData] = useState<{ territories: TerritoryControl[]; status: WarGlobalStatus } | null>(null)
    const [loading, setLoading] = useState(true)
    const [hovered, setHovered] = useState<RegistryDistrict | null>(null)

    useEffect(() => {
        fetch('/api/war/status')
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-space-mono" style={{ fontSize: '0.6rem', color: '#8b7d6b', opacity: 0.5 }}>SYNCHRONIZING INTELLIGENCE...</span>
        </div>
    )

    return (
        <div style={{ display: 'grid', gap: '1.5rem', userSelect: 'none' }}>
            {/* Map Container */}
            <div
                style={{
                    aspectRatio: '16/9',
                    background: '#fcfaf7',
                    border: '1px solid #d4c5b3',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.03)'
                }}
            >
                {/* Tactical Grid Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'radial-gradient(#d4c5b3 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.3
                }} />

                {/* Districts */}
                {data?.territories.map((t) => {
                    const coords = DISTRICT_COORDS[t.district] || DISTRICT_COORDS.other
                    const faction = t.controlling_faction ? FACTION_META[t.controlling_faction] : null
                    const isHovered = hovered === t.district

                    return (
                        <motion.div
                            key={t.district}
                            onMouseEnter={() => setHovered(t.district)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                position: 'absolute',
                                left: `${coords.x}%`,
                                top: `${coords.y}%`,
                                width: `${coords.size * 40}px`,
                                height: `${coords.size * 40}px`,
                                background: faction ? faction.color : '#e8e2d9',
                                border: '2px solid #fff',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'crosshair',
                                boxShadow: isHovered ? `0 0 20px ${faction?.color || '#000'}44` : '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: isHovered ? 10 : 1,
                                opacity: 0.85
                            }}
                            animate={{
                                scale: isHovered ? 1.2 : 1,
                                opacity: isHovered ? 1 : 0.85,
                            }}
                        >
                            <span className="font-cinzel" style={{ fontSize: '0.5rem', color: '#fff', fontWeight: 800 }}>
                                {t.district.substring(0, 2).toUpperCase()}
                            </span>

                            {/* Pulse for contested zones */}
                            {t.status === 'warzone' && (
                                <motion.div
                                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    style={{
                                        position: 'absolute',
                                        inset: -5,
                                        border: '2px solid #cc0000',
                                        borderRadius: '50%'
                                    }}
                                />
                            )}
                        </motion.div>
                    )
                })}

                {/* Legend / Hover Detail */}
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: '1rem',
                            right: '1rem',
                            background: '#fff',
                            border: '1px solid #d4c5b3',
                            padding: '0.8rem 1rem',
                            borderRadius: '2px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            zIndex: 100,
                            minWidth: '200px'
                        }}
                    >
                        <div className="font-space-mono" style={{ fontSize: '0.45rem', textTransform: 'uppercase', color: '#8b7d6b' }}>Tactical Assessment</div>
                        <div className="font-cinzel" style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 6px', textTransform: 'capitalize' }}>{hovered} Sector</div>

                        {data?.territories.find(t => t.district === hovered)?.controlling_faction ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: FACTION_META[data.territories.find(t => t.district === hovered)!.controlling_faction!].color }} />
                                <span className="font-space-mono" style={{ fontSize: '0.55rem' }}>Controlled by: {FACTION_META[data.territories.find(t => t.district === hovered)!.controlling_faction!].name}</span>
                            </div>
                        ) : (
                            <span className="font-space-mono" style={{ fontSize: '0.55rem', color: '#8b7d6b' }}>No dominant engagement detected.</span>
                        )}
                    </motion.div>
                )}
            </div>

            {/* War Status Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div style={{ border: '1px solid #d4c5b3', padding: '0.75rem', backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }}>
                    <div className="font-space-mono" style={{ fontSize: '0.45rem', color: '#8b7d6b', textTransform: 'uppercase' }}>Active Fronts</div>
                    <div className="font-cinzel" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{data?.status.active_wars ?? 0}</div>
                </div>
                <div style={{ border: '1px solid #d4c5b3', padding: '0.75rem', backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper.png")' }}>
                    <div className="font-space-mono" style={{ fontSize: '0.45rem', color: '#8b7d6b', textTransform: 'uppercase' }}>Cities Contested</div>
                    <div className="font-cinzel" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{data?.status.total_territories ?? 0}</div>
                </div>
                {data?.status.faction_rankings.slice(0, 2).map((rank, i) => (
                    <div key={rank.faction} style={{ border: '1.5px solid #d4c5b3', padding: '0.75rem', background: `${FACTION_META[rank.faction as FactionId].color}08` }}>
                        <div className="font-space-mono" style={{ fontSize: '0.45rem', color: FACTION_META[rank.faction as FactionId].color, textTransform: 'uppercase', fontWeight: 700 }}>{i === 0 ? 'City Leader' : 'Contender'}</div>
                        <div className="font-cinzel" style={{ fontSize: '1rem', fontWeight: 800 }}>{FACTION_META[rank.faction as FactionId].name}</div>
                        <div className="font-space-mono" style={{ fontSize: '0.45rem', color: '#8b7d6b' }}>{rank.score} SEC. CONTROLLED</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
