'use client'

import React from 'react'
import styles from './InkStamp.module.css'

interface InkStampProps {
  text: string
  color?: string
  rotation?: number
  className?: string
}

export function InkStamp({ text, color = 'var(--accent)', rotation = -12, className = '' }: InkStampProps) {
  return (
    <div 
      className={`${styles.stamp} ${className}`} 
      style={{ 
        '--stamp-color': color,
        transform: `rotate(${rotation}deg)`
      } as React.CSSProperties}
    >
      <div className={styles.inner}>
        {text}
      </div>
    </div>
  )
}
