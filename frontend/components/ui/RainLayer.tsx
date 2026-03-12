'use client'

import React from 'react'

const DROPS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  animationDuration: `${0.8 + Math.random() * 1.2}s`,
  animationDelay: `${Math.random() * 2}s`,
  opacity: 0.1 + Math.random() * 0.2,
}))

const RainLayer = React.memo(function RainLayer() {
  return (
    <div className="rain-layer" aria-hidden="true">
      {DROPS.map((drop) => (
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
      ))}
    </div>
  )
})

export default RainLayer
