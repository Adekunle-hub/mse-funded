"use client"

import { motion, useScroll, useSpring } from "motion/react"
import type { ReactNode } from "react"

export function HeaderShell({ children }: { children: ReactNode }) {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 })

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-hairline bg-surface/85 backdrop-blur-md lg:h-18">
      {children}
      <motion.span
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-teal"
      />
    </header>
  )
}
