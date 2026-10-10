import { ChevronDown } from "lucide-react"

import { formatDate } from "@/lib/format/date"

export function HowWeCheck({ checkedAt }: { checkedAt: string }) {
  return (
    <details className="group mt-2 sm:mt-3">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between border-y border-hairline type-label text-teal sm:inline-flex sm:h-auto sm:justify-start sm:gap-1.5 sm:border-0 sm:underline sm:underline-offset-[3px] [&::-webkit-details-marker]:hidden">
        How we check this
        <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-3 rounded-card border border-hairline bg-mint p-4 text-teal-ink sm:p-6">
        <p className="type-label">How we check this</p>
        <p className="mt-2 type-body-sm">
          We read the official page and took the deadline, funding and eligibility from it. We last opened
          the official link on {formatDate(checkedAt)}. If something on the page is unclear, the listing is
          marked &ldquo;Under review&rdquo;. Always confirm the details on the official page before you apply.
        </p>
      </div>
    </details>
  )
}
