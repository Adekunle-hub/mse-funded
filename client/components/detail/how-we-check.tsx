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
          We opened the official page on {formatDate(checkedAt)} and confirmed the deadline, funding and
          eligibility against it. A computer checks the official link every day. A person re-checks open
          listings every week, and every two days in the last two weeks before the deadline. If the page
          changes, disappears or a student reports a problem, we mark the listing &ldquo;Under review&rdquo;
          until a person checks it again.
        </p>
      </div>
    </details>
  )
}
