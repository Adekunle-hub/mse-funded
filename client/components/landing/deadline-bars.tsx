"use client"

import { animate, inView, stagger } from "motion"
import { useEffect, useRef } from "react"

import type { LandingSnapshot } from "@/lib/api/landing"
import { cn } from "@/lib/utils"

type DeadlineBarsProps = {
  months: LandingSnapshot["deadlinesByMonth"]
  busiestKey?: string
}

export function DeadlineBars({ months, busiestKey }: DeadlineBarsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const max = Math.max(1, ...months.map((month) => month.count))

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return

    const bars = element.querySelectorAll<HTMLElement>("[data-bar]")
    const counts = element.querySelectorAll<HTMLElement>("[data-count]")
    animate(bars, { scaleY: 0 }, { duration: 0 })
    animate(counts, { opacity: 0, y: 8 }, { duration: 0 })

    return inView(
      element,
      () => {
        animate(bars, { scaleY: 1 }, { type: "spring", stiffness: 110, damping: 14, delay: stagger(0.08) })
        animate(counts, { opacity: 1, y: 0 }, { duration: 0.5, delay: stagger(0.08, { startDelay: 0.25 }) })
      },
      { amount: 0.4 }
    )
  }, [])

  return (
    <div ref={ref}>
      <div className="flex h-48 items-end gap-2 border-b border-white/20 sm:h-64 sm:gap-4">
        {months.map((month, index) => (
          <div key={month.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span data-count className="type-label tabular-nums text-white/80">
              {month.count}
            </span>
            <span
              data-bar
              className={cn(
                "w-full origin-bottom rounded-t-[4px] transition-colors duration-300 hover:bg-white/50",
                month.key === busiestKey && month.count > 0 ? "bg-mint hover:bg-mint" : index === 0 ? "bg-pink hover:bg-pink" : "bg-white/25"
              )}
              style={{ height: `${Math.max(4, (month.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {months.map((month, index) => (
          <span key={month.key} className="flex-1 text-center type-body-sm text-white/70">
            {index === 0 ? "This month" : month.label}
          </span>
        ))}
      </div>
    </div>
  )
}
