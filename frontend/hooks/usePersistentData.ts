'use client'

import { useState, useEffect } from 'react'

/**
 * A hook for 'Warm Start' UX. 
 * Shows previously cached data from sessionStorage while a fresh fetch completes.
 */
export function usePersistentData<T>(key: string, initialData: T): [T, (data: T | ((prev: T) => T)) => void] {
    const [data, setData] = useState<T>(initialData)

    useEffect(() => {
        // 1. Try to load from session storage on mount
        try {
            const saved = sessionStorage.getItem(`bsd_cache_${key}`)
            if (saved) {
                setData(JSON.parse(saved))
            }
        } catch (e) {
            console.warn('Persistence failed:', e)
        }
    }, [key])

    const persist = (newDataOrFn: T | ((prev: T) => T)) => {
        setData((prev) => {
            const next = typeof newDataOrFn === 'function' 
                ? (newDataOrFn as (prev: T) => T)(prev) 
                : newDataOrFn
            
            try {
                sessionStorage.setItem(`bsd_cache_${key}`, JSON.stringify(next))
            } catch (e) {
                console.warn('Persistence failed:', e)
            }
            return next
        })
    }

    return [data, persist]
}
