'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function InkTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const meaningfulRoutes = ['/onboarding/result', '/onboarding/faction-confirm', '/waitlist']
  const isMeaningful = meaningfulRoutes.some((route) => pathname.includes(route))

  return (
    <AnimatePresence mode="wait">
      {isMeaningful ? (
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="ink-overlay"
            initial={{ scale: 0, borderRadius: '50%', opacity: 0.9 }}
            animate={{ scale: 4, borderRadius: '0%', opacity: 0 }}
            exit={{ scale: 0, borderRadius: '50%', opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          {children}
        </motion.div>
      ) : (
        <motion.div key={pathname}>{children}</motion.div>
      )}
    </AnimatePresence>
  )
}
