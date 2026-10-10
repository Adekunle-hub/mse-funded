"use client"

import { useSearchController } from "@/components/search/search-controller"
import type { SortOption } from "@/lib/types/search"

const sortPhrases: Record<SortOption, string> = {
  deadline: "soonest deadline first",
  verified: "recently verified first",
  newest: "newest first",
}

type ResultsCountProps = {
  total: number
  sort: SortOption
}

export function ResultsCount({ total, sort }: ResultsCountProps) {
  const { isPending } = useSearchController()
  const noun = total === 1 ? "scholarship" : "scholarships"

  return (
    <div aria-live="polite" className="flex min-h-6 items-center gap-3">
      {isPending ? (
        <>
          <p className="type-label text-ink">Updating…</p>
          <span
            aria-hidden="true"
            className="h-0.5 w-40 overflow-hidden rounded-md bg-muted-bg"
          >
            <span className="block h-full w-1/2 animate-pulse bg-teal" />
          </span>
        </>
      ) : (
        <p>
          <span className="type-body-sm text-ink-muted sm:hidden">
            {total} {noun}, {sortPhrases[sort]}
          </span>
          <span className="type-label text-ink max-sm:hidden">
            {total} {noun}
          </span>
        </p>
      )}
    </div>
  )
}
