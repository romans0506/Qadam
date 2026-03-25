'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{
          duration: 0.22,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{ minHeight: '100vh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
