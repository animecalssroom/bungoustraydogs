'use client'

import { useEffect, useState } from 'react'

export function PreAssignmentMessage({ userId, open }: { userId: string; open: boolean }) {
  const key = `bsd_preasign_msg_shown_${userId}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) return
    if (window.localStorage.getItem(key)) return
    setVisible(true)
  }, [key, open])

  if (!visible) {
    return null
  }

  return (
    <div
      onClick={() => {
        window.localStorage.setItem(key, '1')
        setVisible(false)
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(8, 4, 6, 0.74)', display: 'grid', placeItems: 'center', padding: '2rem', cursor: 'pointer' }}
    >
      <p className="font-cormorant" style={{ maxWidth: '520px', margin: 0, color: 'var(--text2)', fontStyle: 'italic', fontSize: '1.15rem', lineHeight: 1.8, textAlign: 'center' }}>
        Ability signature not yet confirmed. Combat data will be recorded by the registry.
      </p>
    </div>
  )
}
