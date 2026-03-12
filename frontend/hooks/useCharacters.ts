'use client'
import { useEffect, useState } from 'react'
import type { Character, FactionId } from '@/backend/types'

export function useCharacters(faction?: FactionId) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const url = faction ? `/api/character?faction=${faction}` : '/api/character'
    fetch(url).then(r => r.json()).then(({ data }) => { setCharacters(data ?? []); setLoading(false) })
  }, [faction])
  
  return { characters, loading }
}
