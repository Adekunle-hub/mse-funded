"use client"

import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "motion/react"
import { useEffect, useRef, type ReactNode } from "react"

const SPRING = { stiffness: 90, damping: 20, mass: 0.6 }

export function HeroBackdrop({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 700], [0, 140])
  const opacity = useTransform(scrollY, [0, 600], [1, 0.25])

  const pointerX = useSpring(useMotionValue(-400), SPRING)
  const pointerY = useSpring(useMotionValue(-400), SPRING)
  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${pointerX}px ${pointerY}px, color-mix(in oklab, var(--teal) 14%, transparent), transparent 70%)`

  useEffect(() => {
    const section = ref.current?.parentElement
    if (!section) return

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      const rect = section.getBoundingClientRect()
      pointerX.set(event.clientX - rect.left)
      pointerY.set(event.clientY - rect.top)
    }
    const handleLeave = () => {
      pointerX.set(-400)
      pointerY.set(-400)
    }

    section.addEventListener("pointermove", handleMove)
    section.addEventListener("pointerleave", handleLeave)
    return () => {
      section.removeEventListener("pointermove", handleMove)
      section.removeEventListener("pointerleave", handleLeave)
    }
  }, [pointerX, pointerY])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        {children}
      </motion.div>
      <motion.div style={{ background: spotlight }} className="absolute inset-0 max-lg:hidden" />
    </div>
  )
}
