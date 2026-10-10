"use client"

import { X } from "lucide-react"

import { useSearchController } from "@/components/search/search-controller"
import { deadlineLabel, optionLabel } from "@/lib/scholarships/filters"
import type { MultiFilterKey, SearchFilters } from "@/lib/types/search"

type Chip = { id: string; label: string; remove: (filters: SearchFilters) => SearchFilters }

function chipsFor(filters: SearchFilters): Chip[] {
  const chips: Chip[] = []
  for (const key of ["level", "country", "field", "funding"] as MultiFilterKey[]) {
    for (const value of filters[key] as string[]) {
      chips.push({
        id: `${key}:${value}`,
        label: optionLabel(key, value),
        remove: (current) => ({
          ...current,
          [key]: (current[key] as string[]).filter((item) => item !== value),
          page: 1,
        }),
      })
    }
  }
  if (filters.deadline !== "any") {
    chips.push({
      id: "deadline",
      label: deadlineLabel(filters.deadline),
      remove: (current) => ({ ...current, deadline: "any", page: 1 }),
    })
  }
  return chips
}

export function ActiveFilterChips() {
  const { filters, update } = useSearchController()
  const chips = chipsFor(filters)
  if (chips.length === 0) return null

  return (
    <ul
      aria-label="Active filters"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {chips.map((chip) => (
        <li key={chip.id} className="shrink-0">
          <button
            type="button"
            onClick={() => update(chip.remove(filters))}
            className="inline-flex h-12 items-center gap-1.5 rounded-md border border-border-control bg-surface pr-3 pl-3.5 type-label text-ink hover:bg-muted-bg sm:h-8 sm:pr-2.5"
          >
            {chip.label}
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">, remove filter</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
