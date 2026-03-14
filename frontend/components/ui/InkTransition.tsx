'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function InkTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const meaningfulRoutes = ['/onboarding/result', '/onboarding/faction-confirm', '/waitlist']
  const isMeaningful = meaningfulRoutes.some((route) => pathname.includes(route))

  if (!isMeaningful) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{ willChange: 'opacity' }}
      >
        <motion.div
          className="ink-overlay"
          initial={{ scale: 0, borderRadius: '50%', opacity: 0.8 }}
          animate={{ scale: 3, borderRadius: '0%', opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            willChange: 'transform, opacity',
            pointerEvents: 'none'
          }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
