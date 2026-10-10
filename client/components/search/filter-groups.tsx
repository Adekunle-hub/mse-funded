"use client"

import { Search } from "lucide-react"
import { useId, useState } from "react"

import { FilterGroup } from "@/components/search/filter-group"
import { Button } from "@/components/ui/button"
import { CheckboxRow } from "@/components/ui/checkbox-row"
import { deadlineLabel, deadlineOptions, filterGroupLabels } from "@/lib/scholarships/filters"
import type { FacetOption, MultiFilterKey, SearchFacets, SearchFilters } from "@/lib/types/search"
import { cn } from "@/lib/utils"

const COUNTRIES_SHOWN = 6

type FilterGroupsProps = {
  filters: SearchFilters
  facets: SearchFacets
  onChange: (next: SearchFilters) => void
  touch?: boolean
  collapseSecondary?: boolean
}

function summaryOf(key: MultiFilterKey, filters: SearchFilters, facets: SearchFacets) {
  const selected = facets[key].filter((option) => (filters[key] as string[]).includes(option.value))
  if (selected.length === 0) return "Any"
  if (selected.length === 1) return selected[0].label
  return `${selected.length} selected`
}

export function FilterGroups({ filters, facets, onChange, touch, collapseSecondary }: FilterGroupsProps) {
  const deadlineName = useId()
  const toggle = (key: MultiFilterKey, value: string, checked: boolean) => {
    const current = filters[key] as string[]
    const next = checked ? [...current, value] : current.filter((item) => item !== value)
    onChange({ ...filters, [key]: next, page: 1 })
  }

  const checkboxes = (key: MultiFilterKey, options: FacetOption[]) =>
    options.map((option) => (
      <CheckboxRow
        key={option.value}
        label={option.label}
        count={option.count}
        touch={touch}
        checked={(filters[key] as string[]).includes(option.value)}
        onChange={(event) => toggle(key, option.value, event.target.checked)}
      />
    ))

  const group = (key: MultiFilterKey, secondary: boolean, body: React.ReactNode) => (
    <FilterGroup
      key={key}
      title={filterGroupLabels[key]}
      summary={summaryOf(key, filters, facets)}
      defaultOpen={!(collapseSecondary && secondary)}
    >
      {body}
    </FilterGroup>
  )

  return (
    <div>
      {group("level", false, checkboxes("level", facets.level))}
      {group("country", true, <CountryOptions {...{ filters, facets, touch }} renderOptions={(options) => checkboxes("country", options)} />)}
      {group("field", false, checkboxes("field", facets.field))}
      <FilterGroup
        title="Deadline"
        summary={deadlineLabel(filters.deadline)}
        defaultOpen={!collapseSecondary}
      >
        <div role="radiogroup" aria-label="Deadline" className="flex flex-wrap gap-2 pt-1">
          {deadlineOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "inline-flex cursor-pointer items-center rounded-md border border-border-control bg-surface px-3.5 type-label text-ink has-checked:border-ink has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                touch ? "h-12" : "h-8"
              )}
            >
              <input
                type="radio"
                name={deadlineName}
                value={option.value}
                checked={filters.deadline === option.value}
                onChange={() => onChange({ ...filters, deadline: option.value, page: 1 })}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </FilterGroup>
      {group("funding", true, checkboxes("funding", facets.funding))}
    </div>
  )
}

type CountryOptionsProps = {
  filters: SearchFilters
  facets: SearchFacets
  touch?: boolean
  renderOptions: (options: FacetOption[]) => React.ReactNode
}

function CountryOptions({ filters, facets, touch, renderOptions }: CountryOptionsProps) {
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)

  const matching = facets.country.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  )
  const pinned = matching.filter((option) => filters.country.includes(option.value))
  const rest = matching.filter((option) => !filters.country.includes(option.value))
  const visible = showAll || query ? matching : [...pinned, ...rest].slice(0, Math.max(COUNTRIES_SHOWN, pinned.length))
  const hiddenCount = matching.length - visible.length

  return (
    <div className="flex flex-col">
      <label className={cn("mb-1 flex items-center gap-3 rounded-control border border-border-control px-3", touch ? "h-12" : "h-10")}>
        <Search aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
        <span className="sr-only">Find a country</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a country"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-muted"
        />
      </label>
      {renderOptions(visible)}
      {visible.length === 0 && <p className="py-2 type-body-sm text-ink-muted">No countries match.</p>}
      {hiddenCount > 0 && (
        <Button
          variant="text"
          size="inline"
          className="h-10 justify-start"
          onClick={() => setShowAll(true)}
        >
          Show all {matching.length}
        </Button>
      )}
    </div>
  )
}
