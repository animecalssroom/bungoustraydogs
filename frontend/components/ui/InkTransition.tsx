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
        transition={{ duration: 0.28 }}
      >
        <motion.div
          className="ink-overlay"
          initial={{ scale: 0, borderRadius: '50%', opacity: 0.9 }}
          animate={{ scale: 4, borderRadius: '0%', opacity: 0 }}
          exit={{ scale: 0, borderRadius: '50%', opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
