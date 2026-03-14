'use client'

import { useEffect, useRef } from 'react'

export function LoreViewTracker({ postSlug }: { postSlug: string }) {
    const tracked = useRef(false)

    useEffect(() => {
        if (tracked.current) return
        tracked.current = true

        // Non-blocking view increment
        void fetch(`/api/lore/${encodeURIComponent(postSlug)}/view`, {
            method: 'POST',
            cache: 'no-store',
        }).catch(() => { })
    }, [postSlug])

    return null
}
