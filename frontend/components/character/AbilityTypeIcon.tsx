'use client'

import React from 'react'
import type { AbilityType } from '@/backend/types'

interface AbilityTypeIconProps {
  type?: AbilityType | null | string | undefined
  className?: string
  size?: number
}

export function AbilityTypeIcon({ type, className = '', size = 20 }: AbilityTypeIconProps) {
  if (!type) return null

  // Destruction: Sharp, exploding lines
  const Destruction = () => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M18.4 5.6l-2.1 2.1M5.6 18.4l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

  // Counter: Two intersecting arcs (nullify/reverse)
  const Counter = () => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 4L4 20M4 4l16 16" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )

  // Manipulation: Strings or overlapping circles
  const Manipulation = () => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V3m0 18v-6M9 12H3m18 0h-6M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1" />
      <path d="M18.4 5.6l-2.1 2.1M5.6 18.4l2.1-2.1" />
    </svg>
  )

  // Analysis: Eye or grid
  const Analysis = () => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      <path d="M12 8v4l3 3" />
    </svg>
  )

  switch (type?.toLowerCase()) {
    case 'destruction': return <Destruction />
    case 'counter': return <Counter />
    case 'manipulation': return <Manipulation />
    case 'analysis': return <Analysis />
    default: return null
  }
}
