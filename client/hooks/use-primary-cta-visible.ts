"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export const PRIMARY_CTA_ATTRIBUTE = "data-primary-cta"

export function usePrimaryCtaVisible() {
  const pathname = usePathname()
  const [observed, setObserved] = useState<{ pathname: string; visible: boolean } | null>(null)

  useEffect(() => {
    const targets = [...document.querySelectorAll(`[${PRIMARY_CTA_ATTRIBUTE}]`)]
    if (targets.length === 0) return

    const visibleTargets = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleTargets.add(entry.target)
        else visibleTargets.delete(entry.target)
      }
      setObserved({ pathname, visible: visibleTargets.size > 0 })
    })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [pathname])

  return observed?.pathname === pathname ? observed.visible : true
}
