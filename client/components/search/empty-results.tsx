import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { activeFilterCount, clearFilters, searchHref } from "@/lib/scholarships/filters"
import type { FilterSuggestion, SearchFilters } from "@/lib/types/search"

function withoutSuggestion(filters: SearchFilters, suggestion: FilterSuggestion): SearchFilters {
  if (suggestion.key === "deadline") return { ...filters, deadline: "any", page: 1 }
  return {
    ...filters,
    [suggestion.key]: (filters[suggestion.key] as string[]).filter((value) => value !== suggestion.value),
    page: 1,
  }
}

type EmptyResultsProps = {
  filters: SearchFilters
  suggestions: FilterSuggestion[]
}

export function EmptyResults({ filters, suggestions }: EmptyResultsProps) {
  const hasFilters = activeFilterCount(filters) > 0

  return (
    <section aria-labelledby="empty-title" className="rounded-card border border-hairline bg-surface p-6 sm:p-8">
      {hasFilters ? (
        <>
          <h2 id="empty-title" className="type-heading-2">
            No scholarships match all your filters
          </h2>
          {suggestions.length > 0 && (
            <>
              <p className="mt-2 text-ink-muted">Try removing one. These would give you results:</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <li key={`${suggestion.key}:${suggestion.value}`}>
                    <Link
                      href={searchHref(withoutSuggestion(filters, suggestion))}
                      scroll={false}
                      className="inline-flex h-12 items-center rounded-md border border-border-control px-3.5 type-label hover:bg-muted-bg sm:h-8"
                    >
                      Remove <strong className="mx-1 font-semibold">{suggestion.label}</strong> ({suggestion.count})
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link
            href={searchHref(clearFilters(filters))}
            scroll={false}
            className={buttonVariants({ variant: "text", size: "inline", className: "mt-4 h-12" })}
          >
            Clear all filters
          </Link>
        </>
      ) : (
        <>
          <h2 id="empty-title" className="type-heading-2">
            No results for <em className="not-italic">&ldquo;{filters.q}&rdquo;</em>
          </h2>
          <p className="mt-2 text-ink-muted">
            Check the spelling or search a broader topic like{" "}
            <Link href={searchHref({ ...filters, q: "nanomaterials", page: 1 })} className="font-medium text-teal underline underline-offset-4">
              nanomaterials
            </Link>
            .
          </p>
        </>
      )}
    </section>
  )
}
