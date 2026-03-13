'use client'

export function HPBar({
  label,
  value,
  max,
  align,
  showValue,
}: {
  label: string
  value: number
  max: number
  align: 'left' | 'right'
  showValue?: boolean
}) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))

  return (
    <div style={{ display: 'grid', gap: '0.35rem', textAlign: align }}>
      <div className="font-space-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>
        {label}
      </div>
      <div style={{ height: '10px', background: 'var(--border2)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            marginLeft: align === 'right' ? 'auto' : 0,
            background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 35%, white))',
            transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      {showValue ? (
        <div className="font-space-mono" style={{ fontSize: '0.52rem', color: 'var(--text3)' }}>
          {value} / {max}
        </div>
      ) : null}
    </div>
  )
}
