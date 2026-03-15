'use client'

import { useEffect, useRef } from 'react'

export function LoreViewTracker({ postSlug }: { postSlug: string }) {
    const tracked = useRef(false)

    useEffect(() => {
        if (tracked.current) return

        // 5-second debounce: only count a view if the user actually stays on the page
        // Reduces POST traffic for quick browsing/clicking.
        const timer = setTimeout(() => {
            tracked.current = true
            void fetch(`/api/lore/${encodeURIComponent(postSlug)}/view`, {
                method: 'POST',
                cache: 'no-store',
            }).catch(() => { })
        }, 5000)

        return () => clearTimeout(timer)
    }, [postSlug])

    return null
}
