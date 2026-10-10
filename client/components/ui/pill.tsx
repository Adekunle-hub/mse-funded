import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const pillVariants = cva(
  "inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 type-label whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border border-hairline bg-surface text-ink",
        mint: "bg-mint text-teal-ink",
        muted: "border border-hairline bg-surface text-muted-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

type PillProps = ComponentProps<"span"> & VariantProps<typeof pillVariants>

export function Pill({ className, tone, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone }), className)} {...props} />
}
