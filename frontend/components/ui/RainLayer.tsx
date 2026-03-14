'use client'

import React, { useEffect, useState } from 'react'

function generateDrops(count = 20) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${0.8 + Math.random() * 1.2}s`,
    animationDelay: `${Math.random() * 2}s`,
    opacity: 0.1 + Math.random() * 0.2,
  }))
}

const RainLayer = React.memo(function RainLayer() {
  const [drops, setDrops] = useState<Array<any>>([])

  // Only generate drops on the client after mount to avoid SSR/client
  // hydration mismatches caused by Math.random producing different values.
  useEffect(() => {
    setDrops(generateDrops())
  }, [])

  return <div className="rain-layer" aria-hidden="true">{drops.map((drop) => (
    <div
      key={drop.id}
      className="rain-drop"
      style={{
        left: drop.left,
        animationDuration: drop.animationDuration,
        animationDelay: drop.animationDelay,
        opacity: drop.opacity,
      }}
    />
  ))}</div>
})

export default RainLayer
