import { ResultCard } from "@/components/scholarship/result-card"
import { SaveButton } from "@/components/scholarship/save-button"
import { ActiveFilterChips } from "@/components/search/active-filter-chips"
import { EmptyResults } from "@/components/search/empty-results"
import { FilterSheet } from "@/components/search/filter-sheet"
import { FilterSidebar } from "@/components/search/filter-sidebar"
import { Pagination } from "@/components/search/pagination"
import { ResultsCount } from "@/components/search/results-count"
import { SearchBar } from "@/components/search/search-bar"
import { SearchController } from "@/components/search/search-controller"
import { SortSelect } from "@/components/search/sort-select"
import { searchScholarships } from "@/lib/api/scholarships"
import { routes } from "@/lib/routes"
import { parseSearchFilters } from "@/lib/scholarships/filters"
import { getRenderTime } from "@/lib/time"

type SearchViewProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function SearchView({ searchParams }: SearchViewProps) {
  const filters = parseSearchFilters(await searchParams)
  const [result, now] = await Promise.all([searchScholarships(filters), getRenderTime()])

  return (
    <SearchController>
      <div className="max-lg:sticky max-lg:top-16 max-lg:z-30 max-lg:-mx-4 max-lg:border-b max-lg:border-hairline max-lg:bg-surface max-lg:px-4 max-lg:py-3 lg:mt-6">
        <SearchBar key={filters.q} />
        <div className="mt-3 grid grid-cols-2 gap-3 lg:hidden">
          <FilterSheet facets={result.facets} total={result.total} />
          <SortSelect compact className="w-full" />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-8 lg:mt-8">
        <div className="w-70 shrink-0 max-lg:hidden">
          <FilterSidebar facets={result.facets} />
        </div>

        <section aria-label="Results" className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ResultsCount total={result.total} sort={filters.sort} />
            <SortSelect className="max-lg:hidden" />
          </div>
          <ActiveFilterChips />

          {result.items.length === 0 ? (
            <EmptyResults filters={filters} suggestions={result.suggestions} />
          ) : (
            <ul className="flex flex-col gap-3 sm:gap-4">
              {result.items.map((scholarship) => (
                <li key={scholarship.id}>
                  <ResultCard
                    scholarship={scholarship}
                    now={now}
                    href={routes.scholarship(scholarship.id)}
                    headingLevel="h2"
                    action={<SaveButton scholarship={scholarship} />}
                  />
                </li>
              ))}
            </ul>
          )}

          <Pagination filters={filters} page={result.page} pageCount={result.pageCount} />
        </section>
      </div>
    </SearchController>
  )
}
