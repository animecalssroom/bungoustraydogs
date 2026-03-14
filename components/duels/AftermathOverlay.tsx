'use client'

import { useEffect, useState } from 'react'

const RESULT_CONFIG = {
  victory: {
    kanji: '勝',
    label: 'Victory',
    color: 'var(--accent)',
    borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)',
    bg: 'color-mix(in srgb, var(--accent) 5%, transparent)',
  },
  defeat: {
    kanji: '敗',
    label: 'Defeat',
    color: '#8B0000',
    borderColor: 'rgba(139,0,0,0.3)',
    bg: 'rgba(139,0,0,0.04)',
  },
  draw: {
    kanji: '引',
    label: 'Inconclusive',
    color: 'var(--text3)',
    borderColor: 'var(--border2)',
    bg: 'transparent',
  },
}

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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      // Slight delay so the duel page settles before overlay appears
      const t = setTimeout(() => setVisible(true), 120)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [open])

  if (!open) return null

  const cfg = RESULT_CONFIG[result]

  return (
    <>
      <style>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes kanjiReveal {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 0.08; transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9992,
          background: 'rgba(8, 4, 6, 0.9)',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          animation: visible ? 'overlayIn 0.3s ease forwards' : 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      >
        <div
          className="paper-surface"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            display: 'grid',
            gap: '1rem',
            border: `1px solid ${cfg.borderColor}`,
            background: cfg.bg,
            position: 'relative',
            overflow: 'hidden',
            animation: visible ? 'cardIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s both' : 'none',
          }}
        >
          {/* Watermark kanji */}
          <div
            className="font-cinzel"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14rem',
              color: cfg.color,
              opacity: 0,
              pointerEvents: 'none',
              lineHeight: 1,
              userSelect: 'none',
              animation: visible ? 'kanjiReveal 0.6s ease 0.3s both' : 'none',
            }}
          >
            {cfg.kanji}
          </div>

          {/* Corner accents */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '24px', height: '2px', background: cfg.color }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '24px', background: cfg.color }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '2px', background: cfg.color }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '2px', height: '24px', background: cfg.color }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '1rem' }}>
            <div
              className="font-space-mono"
              style={{
                fontSize: '0.56rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--text3)',
              }}
            >
              Duel Aftermath · Registry Filed
            </div>

            <div
              className="font-cinzel"
              style={{
                fontSize: '2.8rem',
                fontWeight: 700,
                color: cfg.color,
                lineHeight: 1,
                letterSpacing: '0.05em',
              }}
            >
              {cfg.label}
            </div>

            {apLabel && (
              <div
                className="font-space-mono"
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: cfg.color,
                  padding: '0.3rem 0.75rem',
                  border: `1px solid ${cfg.borderColor}`,
                  display: 'inline-block',
                  borderRadius: '1px',
                }}
              >
                {apLabel}
              </div>
            )}

            <div
              style={{
                height: '1px',
                background: 'var(--border2)',
                margin: '0.25rem 0',
              }}
            />

            <p
              className="font-cormorant"
              style={{
                margin: 0,
                color: 'var(--text2)',
                fontStyle: 'italic',
                lineHeight: 1.85,
                fontSize: '1.05rem',
              }}
            >
              {summary}
            </p>

            {onClose && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  marginTop: '0.25rem',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Close Record
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onClose}
                >
                  View Match Record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
