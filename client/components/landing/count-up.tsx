import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

export function CountUp({ value, className }: { value: number; className?: string }) {
  return (
    <>
      <span aria-hidden="true" className={cn("count-up tabular-nums", className)} style={{ "--count-to": value } as CSSProperties} />
      <span className="sr-only">{value}</span>
    </>
  )
}
