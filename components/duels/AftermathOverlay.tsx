'use client'

export function AftermathOverlay({
  open,
  result,
  apLabel,
  summary,
  onClose,
}: {
  open: boolean
  result: 'victory' | 'defeat' | 'draw'
  apLabel?: string
  summary: string
  onClose?: () => void
}) {
  if (!open) {
    return null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9992, background: 'rgba(8, 4, 6, 0.88)', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="paper-surface" style={{ maxWidth: '560px', width: '100%', padding: '2rem', textAlign: 'center', display: 'grid', gap: '0.85rem' }}>
        <div className="font-space-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Duel Aftermath
        </div>
        <div className="font-cinzel" style={{ fontSize: '2.4rem' }}>
          {result === 'victory' ? 'Victory' : result === 'defeat' ? 'Defeat' : 'Inconclusive'}
        </div>
        {apLabel ? (
          <div
            className="font-space-mono"
            style={{
              fontSize: '0.64rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: result === 'defeat' ? '#8B0000' : 'var(--accent)',
            }}
          >
            {apLabel}
          </div>
        ) : null}
        <p className="font-cormorant" style={{ margin: 0, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.8 }}>
          {summary}
        </p>
        {onClose ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close Record
            </button>
            <button type="button" className="btn-primary" onClick={onClose}>
              View Match Record
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
