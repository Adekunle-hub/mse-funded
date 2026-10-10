import type { ReactNode } from "react"

import { Reveal } from "@/components/motion/reveal"
import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  id: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: "left" | "center"
  action?: ReactNode
  className?: string
}

export function SectionHeading({ id, eyebrow, title, description, align = "left", action, className }: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "items-center text-center sm:flex-col sm:items-center",
        className
      )}
    >
      <div className={cn("max-w-160", align === "center" && "mx-auto")}>
        <p className="inline-flex items-center gap-2 type-label tracking-[0.08em] text-teal uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-teal" />
          {eyebrow}
        </p>
        <h2 id={id} className="mt-2.5 type-display-3 text-balance text-ink lg:type-display-2">
          {title}
        </h2>
        {description && <p className="mt-2.5 max-w-140 type-body-lg text-ink-muted sm:mt-3">{description}</p>}
      </div>
      {action}
    </Reveal>
  )
}
