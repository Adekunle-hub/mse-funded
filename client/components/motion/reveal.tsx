"use client"

import { animate, inView, stagger } from "motion"
import { useEffect, useRef, type ElementType, type ReactNode } from "react"

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function startsBelowFold(element: Element) {
  return element.getBoundingClientRect().top > window.innerHeight * 0.92
}

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
  y?: number
}

// Content renders visible on the server; motion only hides it after hydration when it is still off-screen,
// so slow connections never see blank sections.
export function Reveal({ children, as: Tag = "div", className, delay = 0, y = 28 }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion() || !startsBelowFold(element)) return

    animate(element, { opacity: 0, y, filter: "blur(6px)" }, { duration: 0 })
    return inView(
      element,
      () => {
        animate(element, { opacity: 1, y: 0, filter: "blur(0px)" }, { duration: 0.8, delay, ease: EASE_OUT })
      },
      { amount: 0.15 }
    )
  }, [delay, y])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}

type RevealStaggerProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  gap?: number
  y?: number
}

export function RevealStagger({ children, as: Tag = "div", className, gap = 0.09, y = 36 }: RevealStaggerProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || prefersReducedMotion() || !startsBelowFold(element)) return

    const items = Array.from(element.children) as HTMLElement[]
    animate(items, { opacity: 0, y, scale: 0.97 }, { duration: 0 })
    return inView(
      element,
      () => {
        animate(
          items,
          { opacity: 1, y: 0, scale: 1 },
          { type: "spring", stiffness: 140, damping: 20, delay: stagger(gap) }
        )
      },
      { amount: 0.1 }
    )
  }, [gap, y])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
