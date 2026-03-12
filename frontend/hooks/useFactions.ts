'use client'
import { useEffect, useState } from 'react'
import type { Faction } from '@/backend/types'

export function useFactions() {
  const [factions, setFactions] = useState<(Faction & { member_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/faction').then(r => r.json()).then(({ data }) => { setFactions(data ?? []); setLoading(false) })
  }, [])
  
  return { factions, loading }
}
