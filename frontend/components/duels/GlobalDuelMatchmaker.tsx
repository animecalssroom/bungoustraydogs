'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/frontend/context/AuthContext'
import { createClient } from '@/frontend/lib/supabase/client'
import type { Duel } from '@/backend/types'

export function GlobalDuelMatchmaker() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [pendingDuels, setPendingDuels] = useState<Duel[]>([])
    const [busy, setBusy] = useState(false)

    // Fetch initial pending duels on mount
    useEffect(() => {
        if (!user) return

        let active = true
        const loadPending = async () => {
            const response = await fetch('/api/duels/pending-challenges', {
                cache: 'no-store',
            })
            const json = await response.json().catch(() => ({}))
            if (active && response.ok) {
                setPendingDuels((json.data as Duel[]) ?? [])
            }
        }

        void loadPending()

        const channel = supabase
            .channel(`global-matchmaker:${user.id}`)
            .on(
                'postgres_changes',
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'duels',
                    filter: `defender_id=eq.${user.id}`
                },
                (payload) => {
                    const raw = payload.new as Duel | undefined
                    if (!raw) {
                        // Deleted
                        const oldId = (payload.old as any)?.id
                        if (oldId) {
                            setPendingDuels((current) => current.filter(d => d.id !== oldId))
                        }
                        return
                    }

                    // Only care about this user's duels
                    if (raw.challenger_id !== user.id && raw.defender_id !== user.id) return

                    // If the duel status is no longer pending (accepted, declined, complete, etc), remove it
                    if (raw.status !== 'pending') {
                        setPendingDuels((current) => current.filter(d => d.id !== raw.id))

                        // If WE were the challenger and it became active, automatically navigate!
                        if (raw.status === 'active' && raw.challenger_id === user.id) {
                            router.push(`/duels/${raw.id}`)
                        }
                        return
                    }

                    // It's a pending duel, add/update it
                    setPendingDuels((current) => {
                        const filtered = current.filter(d => d.id !== raw.id)
                        return [raw, ...filtered]
                    })
                },
            )
            .subscribe()

        return () => {
            active = false
            void supabase.removeChannel(channel)
        }
    }, [supabase, user, router])

    const incomingPending = pendingDuels.filter(d => d.defender_id === user?.id)
    const outgoingPending = pendingDuels.filter(d => d.challenger_id === user?.id)

    const handleAction = async (kind: 'accept' | 'decline' | 'withdraw', duelId: string) => {
        setBusy(true)
        try {
            const endpoint =
                kind === 'accept' ? '/api/duels/accept' : kind === 'decline' ? '/api/duels/decline' : '/api/duels/withdraw'

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duel_id: duelId }),
            })

            const json = await response.json()

            if (response.ok) {
                setPendingDuels(curr => curr.filter(d => d.id !== duelId))
                if (kind === 'accept' && json.duel_id) {
                    router.push(`/duels/${json.duel_id}`)
                }
            }
        } finally {
            setBusy(false)
        }
    }

    if (!user) return null

    // We only show the active incoming requests as an interrupting modal
    // And the outgoing requests as a non-interrupting toast at the bottom left.
    const activeIncoming = incomingPending[0]

    return (
        <>
            <AnimatePresence>
                {activeIncoming && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9999,
                            display: 'grid',
                            placeItems: 'center',
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(8px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                padding: '2.5rem',
                                border: '1px solid #8B0000',
                                background: 'color-mix(in srgb, var(--card) 90%, #8B0000)',
                                boxShadow: '0 0 40px rgba(139, 0, 0, 0.3)',
                                textAlign: 'center'
                            }}
                        >
                            <h2 className="font-cinzel" style={{ fontSize: '2rem', color: '#8B0000', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Challenge Received
                            </h2>
                            <p className="font-space-mono" style={{ fontSize: '0.8rem', color: 'var(--text2)', letterSpacing: '0.1em', marginBottom: '2rem' }}>
                                A conflict request has been intercepted.
                            </p>

                            <div
                                className="font-cormorant"
                                style={{
                                    fontSize: '1.4rem',
                                    fontStyle: 'italic',
                                    color: 'var(--text)',
                                    padding: '1.5rem',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid #3f0f12',
                                    marginBottom: '2.5rem'
                                }}
                            >
                                {activeIncoming.challenge_message ? (
                                    `"${activeIncoming.challenge_message}"`
                                ) : (
                                    "The challenger has initiated combat without comment."
                                )}
                            </div>

                            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="btn-primary"
                                    style={{ background: '#8B0000', border: '1px solid #a30000', color: '#fff' }}
                                    onClick={() => handleAction('accept', activeIncoming.id)}
                                >
                                    Accept Match
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="btn-secondary"
                                    style={{ color: '#8B0000', borderColor: '#3f0f12' }}
                                    onClick={() => handleAction('decline', activeIncoming.id)}
                                >
                                    Decline
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 9998, display: 'grid', gap: '0.5rem' }}>
                <AnimatePresence>
                    {outgoingPending.map(challenge => (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                padding: '1rem 1.25rem',
                                border: '1px solid var(--border)',
                                background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem'
                            }}
                        >
                            <div>
                                <div className="font-cinzel" style={{ fontSize: '0.9rem', color: 'var(--text1)' }}>
                                    Challenge Sent
                                </div>
                                <div className="font-space-mono" style={{ fontSize: '0.6rem', color: 'var(--text3)', letterSpacing: '0.1em', marginTop: '0.2rem' }}>
                                    AWAITING OPPONENT RESPONSE
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleAction('withdraw', challenge.id)}
                                className="font-space-mono"
                                style={{
                                    border: 0,
                                    background: 'transparent',
                                    color: '#8B0000',
                                    fontSize: '0.65rem',
                                    letterSpacing: '0.15em',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    padding: 0
                                }}
                            >
                                [Withdraw]
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    )
}
