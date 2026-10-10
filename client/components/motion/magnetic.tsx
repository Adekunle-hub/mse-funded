"use client"

import { motion, useMotionValue, useSpring } from "motion/react"
import type { PointerEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"

const SPRING = { stiffness: 220, damping: 16, mass: 0.4 }

export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useSpring(useMotionValue(0), SPRING)
  const y = useSpring(useMotionValue(0), SPRING)

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * strength)
    y.set((event.clientY - rect.top - rect.height / 2) * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      whileTap={{ scale: 0.97 }}
      className={cn("inline-flex max-sm:w-full", className)}
    >
      {children}
    </motion.div>
  )
}
