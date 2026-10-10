"use client"

import { useQuery } from "@tanstack/react-query"
import { SlidersHorizontal, X } from "lucide-react"
import { useState } from "react"

import { FilterGroups } from "@/components/search/filter-groups"
import { useSearchController } from "@/components/search/search-controller"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { activeFilterCount, clearFilters, toSearchParams } from "@/lib/scholarships/filters"
import type { SearchFacets, SearchFilters } from "@/lib/types/search"

async function fetchCount(filters: SearchFilters) {
  const response = await fetch(`/api/scholarships/count?${toSearchParams(filters)}`)
  if (!response.ok) throw new Error("Count failed")
  const { total } = (await response.json()) as { total: number }
  return total
}

type FilterSheetProps = {
  facets: SearchFacets
  total: number
}

export function FilterSheet({ facets, total }: FilterSheetProps) {
  const { filters, update } = useSearchController()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const activeCount = activeFilterCount(filters)

  const count = useQuery({
    queryKey: ["scholarship-count", toSearchParams(draft).toString()],
    queryFn: () => fetchCount(draft),
    enabled: open,
    placeholderData: (previous) => previous,
  })
  const shownTotal = count.data ?? total

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(filters)
    setOpen(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="outline" className="w-full px-3" />}>
        <SlidersHorizontal aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-md bg-ink px-1.5 type-caption text-white">
            {activeCount}
            <span className="sr-only"> active</span>
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 rounded-t-card data-[side=bottom]:h-[92dvh]">
        <div className="flex justify-center pt-2" aria-hidden="true">
          <span className="h-1 w-9 rounded-md bg-border-control" />
        </div>
        <div className="flex items-center justify-between border-b border-hairline py-1 pr-1 pl-4">
          <SheetTitle className="type-heading-2">Filters</SheetTitle>
          <div className="flex items-center">
            <Button variant="text" size="inline" className="h-12 px-3" onClick={() => setDraft(clearFilters(draft))}>
              Clear all
            </Button>
            <SheetClose render={<Button variant="ghost" size="icon" aria-label="Close filters" />}>
              <X aria-hidden="true" />
            </SheetClose>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <FilterGroups filters={draft} facets={facets} onChange={setDraft} touch collapseSecondary />
        </div>

        <div className="border-t border-hairline p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => {
              update({ ...draft, page: 1 })
              setOpen(false)
            }}
          >
            {`Show ${shownTotal} ${shownTotal === 1 ? "result" : "results"}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
