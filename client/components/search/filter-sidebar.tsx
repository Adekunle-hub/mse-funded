"use client"

import { FilterGroups } from "@/components/search/filter-groups"
import { useSearchController } from "@/components/search/search-controller"
import { Button } from "@/components/ui/button"
import { activeFilterCount, clearFilters } from "@/lib/scholarships/filters"
import type { SearchFacets } from "@/lib/types/search"

export function FilterSidebar({ facets }: { facets: SearchFacets }) {
  const { filters, update } = useSearchController()

  return (
    <aside aria-labelledby="filters-title" className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1">
      <div className="flex items-center justify-between pb-2">
        <h2 id="filters-title" className="type-heading-3">
          Filters
        </h2>
        {activeFilterCount(filters) > 0 && (
          <Button variant="text" size="inline" onClick={() => update(clearFilters(filters))}>
            Clear all
          </Button>
        )}
      </div>
      <div className="border-t border-hairline">
        <FilterGroups filters={filters} facets={facets} onChange={(next) => update(next, { debounce: true })} />
      </div>
    </aside>
  )
}
