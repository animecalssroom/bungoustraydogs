'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { stopRain, stopWind, stopAgency } from '@/frontend/lib/sounds'

interface SoundContextValue {
    enabled: boolean
    toggle: () => void
}

const SoundContext = createContext<SoundContextValue>({
    enabled: false,
    toggle: () => { },
})

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [enabled, setEnabled] = useState(false)

    // Initialize from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('bsd_sounds')
        if (saved === 'true') {
            setEnabled(true)
        }
    }, [])

    const toggle = useCallback(() => {
        setEnabled((prev) => {
            const next = !prev
            localStorage.setItem('bsd_sounds', String(next))

            if (!next) {
                stopRain()
                stopWind()
                stopAgency()
            }

            return next
        })
    }, [])

    return (
        <SoundContext.Provider value={{ enabled, toggle }}>
            {children}
        </SoundContext.Provider>
    )
}

export function useSound() {
    return useContext(SoundContext)
}
