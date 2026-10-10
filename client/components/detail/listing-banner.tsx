import { CalendarX, TriangleAlert } from "lucide-react"

import { formatDate } from "@/lib/format/date"
import type { ScholarshipDetail } from "@/lib/types/scholarship"

type ListingBannerProps = {
  scholarship: ScholarshipDetail
  closed: boolean
}

export function ListingBanner({ scholarship, closed }: ListingBannerProps) {
  if (closed) {
    return (
      <div role="note" className="flex gap-3 rounded-card border border-hairline bg-muted-bg px-4 py-4 sm:px-6">
        <CalendarX aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">This deadline has passed</p>
          <p className="type-body-sm text-ink-muted">
            The funder may open a new round. Check the official page.
          </p>
        </div>
      </div>
    )
  }

  if (scholarship.verification.status !== "under-review") return null

  return (
    <div role="note" className="flex gap-3 rounded-card border border-amber-border bg-amber-bg px-4 py-4 text-amber-ink sm:px-6">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="type-heading-3">We couldn&apos;t confirm this listing</p>
        <p className="mt-1 type-body-sm">
          Last confirmed on {formatDate(scholarship.verification.checkedAt)}. The official page has changed
          since. Check every detail there before you apply.
        </p>
      </div>
    </div>
  )
}
