import { Search } from "lucide-react"

import { ResultListSkeleton } from "@/components/scholarship/result-card-skeleton"

export function SearchViewSkeleton() {
  return (
    <div aria-busy="true">
      <div className="max-lg:-mx-4 max-lg:border-b max-lg:border-hairline max-lg:px-4 max-lg:py-3 lg:mt-6">
        <div className="flex h-12 items-center gap-3 rounded-control border border-border-control px-4 text-ink-muted lg:h-14">
          <Search aria-hidden="true" className="size-5" />
          Search by topic, university or funder
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:hidden">
          <span className="h-12 rounded-control border border-border-control" />
          <span className="h-12 rounded-control border border-border-control" />
        </div>
      </div>
      <div className="mt-4 flex gap-8 lg:mt-8">
        <div className="w-70 shrink-0 max-lg:hidden" />
        <div className="flex-1">
          <ResultListSkeleton />
        </div>
      </div>
    </div>
  )
}
