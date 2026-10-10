"use client"

import { ChevronDown } from "lucide-react"

import { useSearchController } from "@/components/search/search-controller"
import { sortOptions } from "@/lib/scholarships/filters"
import type { SortOption } from "@/lib/types/search"
import { cn } from "@/lib/utils"

export function SortSelect({ compact, className }: { compact?: boolean; className?: string }) {
  const { filters, update } = useSearchController()

  return (
    <label
      className={cn(
        "relative inline-flex items-center rounded-control border border-border-control bg-surface text-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink",
        compact ? "h-12 type-button" : "h-10 type-label",
        className
      )}
    >
      <span aria-hidden="true" className="pointer-events-none pl-3.5 whitespace-nowrap">
        Sort:
      </span>
      <span className="sr-only">Sort results by</span>
      <select
        value={filters.sort}
        onChange={(event) => update({ ...filters, sort: event.target.value as SortOption, page: 1 })}
        className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-9 pl-1.5 outline-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {compact ? option.shortLabel : option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 size-4" />
    </label>
  )
}
