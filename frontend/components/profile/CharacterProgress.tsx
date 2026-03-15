'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CHARACTER_ASSIGNMENT_THRESHOLD } from '@/backend/types'

interface ProgressData {
  assigned: boolean
  characterName?: string
  progress: number
  current: number
  threshold: number
  message: string
  nextStep: string
}

export function CharacterProgress({ factionColor = 'var(--accent)' }: { factionColor?: string }) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch('/api/character/progress')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch character progress', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  if (loading || !data || data.assigned) return null

  return (
    <div className="paper-surface" style={{ padding: '1.25rem', border: '1px solid var(--border2)', background: 'var(--surface2)', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.8rem' }}>
        <div>
          <div className="font-space-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text4)' }}>
            Assignment Progress
          </div>
          <div className="font-cinzel" style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
            {data.message}
          </div>
        </div>
        <div className="font-space-mono" style={{ fontSize: '0.8rem', color: factionColor }}>
          {data.current} / {data.threshold}
        </div>
      </div>

      <div style={{ height: '10px', background: 'var(--border2)', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${factionColor}, color-mix(in srgb, ${factionColor} 60%, white))` }}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: '0.4rem' }}>
          Next Directive
        </div>
        <p className="font-cormorant" style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: 'var(--text2)', fontStyle: 'italic' }}>
          {data.nextStep}
        </p>
      </div>
      
      <div className="font-space-mono" style={{ marginTop: '1rem', fontSize: '0.48rem', color: 'var(--text4)', fontStyle: 'italic', opacity: 0.7 }}>
        * Qualifying events: Daily login (+1), Archive research (+1/read), Transmissions (+1/post), Field Notes filing (+1).
      </div>
    </div>
  )
}
