'use client'

import { useState } from 'react'
import { getDuelCharacterRule } from '@/lib/duels/characters'

type DuelGuideVariant = 'hub' | 'active'

const HUB_POINTS = [
    'Search a player from another faction and send a challenge.',
    'They must accept from Duel Inbox before the fight begins.',
    'A round resolves only after both players submit a move.',
    'Each round now has a 15 minute deadline before the registry auto-closes it.',
    'Bots usually accept immediately and answer faster than players.',
    'Unassigned files may duel, but Special stays locked until their own character is confirmed.',
]

const ACTIVE_POINTS = [
    'Strike is your safest reliable damage option.',
    'Stance lowers incoming damage and buys time.',
    'Gambit is swingy: if it lands it hits hard, and if it fails it deals nothing.',
    'Recover restores 20 HP, but you cannot use it two rounds in a row.',
    'Special belongs to your file only. An opponent having a character does not unlock your Special.',
]

export function DuelGuide({
    variant,
    hasAssignedCharacter,
    ownCharacterSlug,
    ownCharacterName,
    opponentCharacterSlug,
    opponentCharacterName,
}: {
    variant: DuelGuideVariant
    hasAssignedCharacter?: boolean
    ownCharacterSlug?: string | null
    ownCharacterName?: string | null
    opponentCharacterSlug?: string | null
    opponentCharacterName?: string | null
}) {
    const [open, setOpen] = useState(false)
    const points = variant === 'hub' ? HUB_POINTS : ACTIVE_POINTS
    const ownRule = getDuelCharacterRule(ownCharacterSlug)
    const opponentRule = getDuelCharacterRule(opponentCharacterSlug)

    return (
        <section className="paper-surface" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                    className="font-space-mono"
                    style={{ fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}
                >
                    Duel Guide
                </div>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setOpen((current) => !current)}
                    style={{ width: 'fit-content' }}
                >
                    {open ? 'Hide Duel Notes' : 'Show Duel Notes'}
                </button>
            </div>

            {open ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                        {points.map((line) => (
                            <p
                                key={line}
                                className="font-cormorant"
                                style={{ margin: 0, fontSize: '1rem', lineHeight: 1.65, color: 'var(--text2)', fontStyle: 'italic' }}
                            >
                                {line}
                            </p>
                        ))}
                    </div>

                    {variant === 'active' && !hasAssignedCharacter ? (
                        <div
                            className="font-cormorant"
                            style={{ fontSize: '1rem', lineHeight: 1.65, color: 'var(--accent)', fontStyle: 'italic' }}
                        >
                            Your file is still listed as an unregistered operative. Use Strike, Stance, Gambit, or Recover until your own designation is locked.
                        </div>
                    ) : null}

                    {variant === 'active' ? (
                        <div style={{ display: 'grid', gap: '0.85rem' }}>
                            <div
                                className="font-space-mono"
                                style={{ fontSize: '0.52rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text4)' }}
                            >
                                Matchup Notes
                            </div>

                            <div style={{ display: 'grid', gap: '0.8rem' }}>
                                <div>
                                    <div className="font-cinzel" style={{ fontSize: '1.1rem' }}>{ownCharacterName ?? 'Your File'}</div>
                                    {ownRule ? (
                                        <>
                                            <p className="font-cormorant" style={{ margin: '0.4rem 0 0', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                                                Passive: {ownRule.passive}
                                            </p>
                                            <p className="font-cormorant" style={{ margin: '0.3rem 0 0', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                                                Special: {ownRule.special}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-cormorant" style={{ margin: '0.4rem 0 0', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                                            {hasAssignedCharacter
                                                ? 'The registry has not filed a duel dossier for this character yet.'
                                                : 'No assigned character yet. Special remains locked; only base moves are available.'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="font-cinzel" style={{ fontSize: '1.1rem' }}>{opponentCharacterName ?? 'Opponent File'}</div>
                                    {opponentRule ? (
                                        <>
                                            <p className="font-cormorant" style={{ margin: '0.4rem 0 0', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                                                Passive: {opponentRule.passive}
                                            </p>
                                            <p className="font-cormorant" style={{ margin: '0.3rem 0 0', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                                                Special: {opponentRule.special}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-cormorant" style={{ margin: '0.4rem 0 0', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.7 }}>
                                            The registry has not filed a duel dossier for this opponent yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </section>
    )
}
