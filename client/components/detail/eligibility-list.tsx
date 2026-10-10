import { Check } from "lucide-react"

import { formatDate } from "@/lib/format/date"

type EligibilityListProps = {
  items: string[]
  copiedAt: string
}

export function EligibilityList({ items, copiedAt }: EligibilityListProps) {
  return (
    <>
      <ul className="mt-3 flex flex-col gap-3 sm:mt-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 type-body-sm text-ink-muted sm:mt-4">
        Copied from the official page on {formatDate(copiedAt)}. The official page is the final word.
      </p>
    </>
  )
}
