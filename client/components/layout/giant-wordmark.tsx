"use client"

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react"
import { useRef } from "react"

import { cn } from "@/lib/utils"

const LETTERS = [..."MseFunded"]
const BRAND_SPLIT = 3
const LETTER_STEP = 0.045

function Letter({ letter, index, progress }: { letter: string; index: number; progress: MotionValue<number> }) {
  const start = index * LETTER_STEP
  const y = useTransform(progress, [start, start + 0.5], ["105%", "0%"])
  const rotate = useTransform(progress, [start, start + 0.5], [8, 0])

  return (
    <motion.span
      style={{ y, rotate }}
      whileHover={{ y: "-12%", transition: { type: "spring", stiffness: 420, damping: 14 } }}
      className={cn("inline-block origin-bottom-left", index < BRAND_SPLIT ? "text-ink" : "text-teal")}
    >
      {letter}
    </motion.span>
  )
}

export function GiantWordmark() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, restDelta: 0.001 })

  return (
    <div ref={ref} aria-hidden="true" className="container-page select-none">
      <p className="-mb-[0.09em] flex overflow-hidden pt-2 text-[min(17.6vw,220px)] leading-[0.9] font-semibold tracking-[-0.065em] whitespace-nowrap">
        {LETTERS.map((letter, index) =>
          reduceMotion ? (
            <span key={index} className={index < BRAND_SPLIT ? "text-ink" : "text-teal"}>
              {letter}
            </span>
          ) : (
            <Letter key={index} letter={letter} index={index} progress={progress} />
          )
        )}
      </p>
    </div>
  )
}
