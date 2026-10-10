import { BadgeCheck, TriangleAlert } from "lucide-react"

import { formatDate } from "@/lib/format/date"
import type { Verification } from "@/lib/types/scholarship"
import { cn } from "@/lib/utils"

type TrustLabelProps = {
  verification: Verification
  format?: "long" | "short"
  className?: string
}

export function TrustLabel({ verification, format = "long", className }: TrustLabelProps) {
  if (verification.status === "under-review") {
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md bg-amber-bg px-3 type-label text-amber-ink",
          className
        )}
      >
        <TriangleAlert aria-hidden="true" className="size-4" />
        Under review
      </span>
    )
  }

  const date =
    format === "long"
      ? formatDate(verification.checkedAt)
      : formatDate(verification.checkedAt, { withYear: false })

  return (
    <span className={cn("inline-flex items-center gap-1.5 type-label text-teal", className)}>
      <BadgeCheck aria-hidden="true" className="size-4" />
      <span>
        {format === "long" ? "Verified on " : "Verified "}
        <time dateTime={verification.checkedAt}>{date}</time>
      </span>
    </span>
  )
}
