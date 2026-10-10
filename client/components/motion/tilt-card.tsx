"use client"

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react"
import type { PointerEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"

const SPRING = { stiffness: 180, damping: 18 }
const MAX_TILT = 5

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), SPRING)
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), SPRING)
  const glowX = useTransform(px, (value) => `${value * 100}%`)
  const glowY = useTransform(py, (value) => `${value * 100}%`)
  const glow = useMotionTemplate`radial-gradient(260px circle at ${glowX} ${glowY}, color-mix(in oklab, var(--teal) 12%, transparent), transparent 70%)`

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn("group/tilt relative h-full", className)}
    >
      {children}
      <motion.span
        aria-hidden="true"
        style={{ background: glow }}
        className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
      />
    </motion.div>
  )
}
