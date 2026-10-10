"use client"

import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react"
import { useState, type ReactNode } from "react"

const HIDE_AFTER_PX = 160

export function HeaderShell({ children }: { children: ReactNode }) {
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 })
  const [hidden, setHidden] = useState(false)

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0
    setHidden(current > previous && current > HIDE_AFTER_PX)
  })

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onFocusCapture={() => setHidden(false)}
      className="sticky top-0 z-40 h-16 border-b border-hairline bg-surface/85 backdrop-blur-md lg:h-18"
    >
      {children}
      <motion.span
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-teal"
      />
    </motion.header>
  )
}
